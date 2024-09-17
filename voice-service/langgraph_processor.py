from dataclasses import dataclass
from typing import Any, Union
import requests

from langchain.schema import Document
from langchain_core.messages import HumanMessage
from langgraph.graph.graph import CompiledGraph
from langchain_google_genai import ChatGoogleGenerativeAI
import json
from loguru import logger
from pipecat.frames.frames import (
    DataFrame,
    Frame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMMessagesFrame,
    TextFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

try:
    from langchain_core.messages import AIMessageChunk
except ModuleNotFoundError as e:
    logger.exception(
        "In order to use Langgraph, you need to `pip install pipecat-ai[langchain]`. "
    )
    raise Exception(f"Missing module: {e}")

extractionLLM = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    google_api_key="AIzaSyDIG-JhAjoTJPZV_M5CGzjhIX8klNbXm3I"
)

def extract_booking_info(content):
    print(content)
    prompt = f"""
    Extract the booking information from the following conversation:
    {content}
    
    Return the information in JSON format with the following keys:
    - name: The name of the person booking (if mentioned)
    - show: The name of the show being booked (if mentioned)
    - number_of_tickets: The number of tickets being booked (if mentioned)
    - total_amount: The total amount to be paid (if mentioned)
    
    If any information is not available, leave the value as an empty string or 0 for numbers.
    If no relevant information is found, return an empty JSON object. 
    """
    
    response = extractionLLM.invoke(prompt)  
    try:
        extracted_info = json.loads(response.content)
    except json.JSONDecodeError:
        try:
            json_start = response.content.index('{')
            json_end = response.content.rindex('}') + 1
            json_str = response.content[json_start:json_end]
            extracted_info = json.loads(json_str)
        except (ValueError, json.JSONDecodeError):
            print("Warning: Could not extract valid JSON from the response.")
            return {}
    
    for key in ["name", "show", "number_of_tickets", "total_amount"]:
        if key not in extracted_info:
            extracted_info[key] = "" if key != "number_of_tickets" else 0
    
    return extracted_info


@dataclass
class ToolResultMessage(DataFrame):
    result: Any
    type: str = "tool_result"

    def __str__(self):
        return f"{self.name}(result: {self.result})"


class LanggraphProcessor(FrameProcessor):
    def __init__(self, graph: CompiledGraph):
        super().__init__()
        self._graph = graph
        self._participant_id: str | None = None

    def set_participant_id(self, participant_id: str):
        self._participant_id = participant_id

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        if isinstance(frame, LLMMessagesFrame):
            # Messages are accumulated by the `LLMUserResponseAggregator` in a list of messages.
            # The last one by the human is the one we want to send to the LLM.
            logger.debug(f"Got transcription frame {frame}")
            text: str = frame.messages[-1]["content"]
            extracted = {"name": "", "show": "", "number_of_tickets": 0, "total_amount": 0}
            if (frame.messages[-1]["role"] != "system"):
                extracted = extract_booking_info(frame.messages)
                send_data = {
                "info": extracted,
                "res": {"msg": [frame.messages[-2]["content"],frame.messages[-1]["content"]], "toolCall": {}}
                }

                res = requests.post(f"https://fuzzy-space-guide-r5646xqvwpqcpqpx-5000.app.github.dev/voice/response", json=send_data)
                print(res)

            await self._ainvoke(text.strip())
        else:
            await self.push_frame(frame, direction)

    @staticmethod
    def __get_token_value(text: Union[str, AIMessageChunk]) -> str:
        match text:
            case str():
                return text
            case AIMessageChunk():
                return str(text.content)
            case _:
                return ""

    async def _ainvoke(self, text: str):
        logger.debug(f"Invoking agent with {text}")
        await self.push_frame(LLMFullResponseStartFrame())
        try:
            async for event in self._graph.astream_events(
                {"messages": [HumanMessage(content=text)]},
                config={
                    "configurable": {"thread_id": self._participant_id}
                },
                version="v1",
            ):
                match event["event"]:
                    case "on_chat_model_stream":
                        # await self.push_frame(LLMFullResponseStartFrame())
                        await self.push_frame(
                            TextFrame(self.__get_token_value(event["data"]["chunk"]))
                        )
                        # await self.push_frame(LLMFullResponseEndFrame())
                    case "on_tool_start":
                        logger.debug(
                            f"Starting tool: {event['name']} with inputs: {event['data'].get('input')}"
                        )
                    case "on_tool_end":
                        # TODO Implement non-retriever tools that return strings
                        pass
                    case "on_retriever_end":
                        docs: list[Document] = event["data"]["output"]["documents"]
                        logger.debug(f"Sending {len(docs)} docs")
                        for doc in docs:
                            await self.push_frame(
                                ToolResultMessage(doc.dict(exclude_none=True))
                            )
                    case _:
                        pass
        except GeneratorExit:
            logger.exception(f"{self} generator was closed prematurely")
        except Exception as e:
            logger.exception(f"{self} an unknown error occurred: {e}")

        await self.push_frame(LLMFullResponseEndFrame())
