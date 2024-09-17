#
# Copyright (c) 2024, Rohith
# Copyright (c) 2024, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import asyncio
from typing import AsyncGenerator, List
import aiohttp
import os
import json
import sys
import requests

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_response import LLMAssistantResponseAggregator, LLMUserResponseAggregator
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.frames.frames import (
    LLMMessagesFrame, Frame, StartFrame, CancelFrame, EndFrame
)
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.services.google import GoogleLLMService

from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langgraph_processor import LanggraphProcessor

from loguru import logger

from dotenv import load_dotenv
load_dotenv(override=True)

import google.generativeai as genai
genai.configure(api_key=os.getenv("GOOGLE_AI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


class ConversationProcessor(FrameProcessor):
    def __init__(self, messages: List[dict] = [], caller_location = (5.6, 3.22), **kwargs):
        super().__init__(**kwargs)
        self.conversation_log = messages
        self.conversation_ended = False
        self.caller_location = caller_location
    
    async def handle_conversation_end(self):
        if self.conversation_ended:
            return
        
        self.conversation_ended = True
        await self.push_frame(EndFrame(), FrameDirection.UPSTREAM)

        logger.info("Conversation Ended")

        # remove system prompt
        self.conversation_log = self.conversation_log[1:]

        # create text transcript from message dict
        transcript = ""
        for message in self.conversation_log:
            transcript += f'{message["role"]}: {message["content"]}\n' 
        print(transcript) 
        prompt = 'You are an AI information extrapolation agent for the purpose of ticket booking in a museum. You are to extract the following data from the given transcript: 1) name (the name of the show the user wants to attend) 2) number: (The number of tickets required) 3) Name (the name of the person). Respond in the following json format: { "type": string, "number": number, "name": string }. DO NOT OUTPUT ANYTHING OTHER THAN THE JSON. If you are unable to determine any of the above please state "Unknown". Following is the transcript of the call:'
        prompt += "\n" + transcript
        response = model.generate_content(prompt)
        json_data = json.loads(response.candidates[0].content.parts[0].text)
        print(json_data)

        api_server_url = os.getenv("API_SERVER_URL")
        res = requests.post(f"{api_server_url}/api/incidents/register", json={
            "name" : json_data["name"],
            "lat": self.caller_location[0],
            "lng": self.caller_location[1],
            "criticality": json_data["criticality"],
            "transcript": transcript,
            "status": "open",
            "type": json_data["type"],
            "impact": json_data["impact"]
        })
        print(res.json())

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> AsyncGenerator[Frame, None]:
        await super().process_frame(frame, direction)

        if isinstance(frame, LLMMessagesFrame):
            last_message = frame.messages[-1]

            if last_message["role"] == "assistant":
                if "<END>" in last_message["content"]:
                    await self.handle_conversation_end()

            print(last_message)
        elif isinstance(frame, EndFrame):
                await self.handle_conversation_end()

        await self.push_frame(frame, direction)

async def main():
    async with aiohttp.ClientSession() as session:
        (room_url, token, caller_location) = await configure(session)

        transport = DailyTransport(
            room_url,
            token,
            "Chatbot",
            DailyParams(
                audio_out_enabled=True,
                vad_enabled=True,
                vad_analyzer=SileroVADAnalyzer(),
                transcription_enabled=True,     
                vad_audio_passthrough=True,  
            )
        )

        stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

        tts = ElevenLabsTTSService(
            aiohttp_session=session,
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            voice_id="EXAVITQu4vr4xnSDxMaL", # English
        )

        llm = GoogleLLMService(
            api_key=os.getenv("GOOGLE_AI_API_KEY"),
            model="gemini-1.5-flash-latest"
        )

        messages = [
            {
                "role": "system",
                "content": "You are an AI ticket booking agent at a national museum and you speak in HINDI. ASK ALL QUESTIONS TO THE USER IN HINDI ONE BY ONE NOT ALL AT ONCE AND SLOWLY. You are in a call with a person who wants to book a few tickets to available shows and the user speaks in HINDI so the words will be in hindi. You are to obtain the following information from the user. ASK EACH INFORMATION ONE AT A TIME AND NOT ALL AT ONCE AND WAIT FOR THEIR RESPONSE BEFORE PROCEEDING AND THE RESPONSE WILL BE IN HINDI: Name of the event, number of tickets required, name of the caller. Do so by prompting for each piece of information and waiting for a response before moving on to the next one. Do not ask them all at once. Your output will be converted to audio so don't include special characters in your answers. Keep your responses brief. Start with 'Ticket booking service, how may I help you (IN HINDI)?'. If you feel you have all the information you need, end the conversation, although not abruptly. Do not end with a question. Include '<END>' at the end of your last response.",
            },
        ]

        user_response = LLMUserResponseAggregator(messages)
        assistant_response = LLMAssistantResponseAggregator(messages)

        convo_processor = ConversationProcessor(messages, caller_location)

        pipeline = Pipeline([
            transport.input(),
            stt,
            user_response,
            llm,
            tts,
            transport.output(),
            assistant_response,
            convo_processor,
        ])

        task = PipelineTask(pipeline, PipelineParams(allow_interruptions=True))

        @transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport, participant):
            transport.capture_participant_transcription(participant["id"])
            await task.queue_frames([LLMMessagesFrame(messages)])

        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport, participant, *args):
            await task.queue_frames([EndFrame()])

        runner = PipelineRunner()

        await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
