#
# Copyright (c) 2024, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import aiohttp
import asyncio
import os
import sys

from pipecat.frames.frames import LLMMessagesFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
    LLMUserResponseAggregator
)
from pipecat.services.cartesia import CartesiaTTSService
from pipecat.services.deepgram import DeepgramSTTService
from pipecat.services.openai import OpenAILLMService
from pipecat.transports.network.websocket_server import WebsocketServerParams, WebsocketServerTransport
from pipecat.vad.silero import SileroVADAnalyzer
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.services.google import GoogleLLMService

from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from pipecat.processors.frameworks.langgraph import LanggraphProcessor

from loguru import logger
from pymongo import MongoClient

from dotenv import load_dotenv
load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


async def main():
    async with aiohttp.ClientSession() as session:
        transport = WebsocketServerTransport(
            params=WebsocketServerParams(
                audio_out_enabled=True,
                add_wav_header=True,
                vad_enabled=True,
                vad_analyzer=SileroVADAnalyzer(),
                vad_audio_passthrough=True
            )
        )

        stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

        tts = ElevenLabsTTSService(
            aiohttp_session=session,
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            voice_id="z9fAnlkpzviPz146aGWa", # English
        )
        memory = MemorySaver()
        client = MongoClient('mongodb+srv://rayyaan:rayyaan123@assistance-app.cg5ou.mongodb.net/?retryWrites=true&w=majority&appName=Assistance-app')
        db = client['national_museum_database']
        @tool
        def check_events() -> str:
          '''Return a list of currently available museum events. Use this when asking the user to book for tickets. Can be used to let user know what is available to book'''
          events = list(db.events.find({}, {'name': 1, '_id': 0}))
          return "\n".join([f"{i+1}) {event['name']}" for i, event in enumerate(events)])

        @tool
        def check_tickets(show: str) -> str:
          '''Return currently available tickets for the show, use this tool when user is selecting how many tickets he/she wants. Can also be used to give more information about the event by telling that these many tickets are available'''
          event = db.events.find_one({'name': show})
          if event:
            capacity = event.get('capacity', 0)
            booked_tickets = db.guests.count_documents({'event_name': show})
            available_tickets = max(0, capacity - booked_tickets)
            price = event.get('prices', {}).get('normal_unguided', 'N/A')
            return f"{available_tickets} tickets available for {show}. Price for each ticket is {price} rupees."
          else:
            return f"No information available for {show}."

        tools = [check_tickets, check_events]
        llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

        messages = [
            {
                "role": "system",
                "content": '''You are an AI agent AND YOU SPEAK ONLY IN THE LANGUAGE DECIDED BY THE USER BUT THE USER CAN SPEAK IN ENGLISH BUT REPLY IN THE LANGUAGE DECIDED BY THE USER ONLY. 
                           You are tasked to help a user decide and buy a museum ticket. You can speak in multiple languages mostly Indian.
                            Your end goal is to gather the following information from the user 1) Name of the user, 2) Show the user wants to watch (give user the list of available shows to book), 3) Number of tickets required.
                            You shall ask these questions to the user in a natural way ONE BY ONE. If the user has any query related to museum stop and answer that first and then ask question again.
                            AT THE END GIVE A SUMMARY FOR THE ORDER IN WITH THE FOLLOWING VALUES,NAME:, SHOW: NUMBER OF TICKETS:, TOTAL AMOUNT TO BE PAID. REMEMBER YOUR BILL MESSAGE MUST HAVE THE NAME, SHOW, NUMBER OF TICKETS AND TOTAL AMOUNT TO BE PAID. IF THOSE ARE NOTPRESENT REWRITE YOUR MESSAGE.
                           Start with saying Hello i'm ur agent for today, how may I help you?
                                   YOUR TEXT WILL BE CONVERTED TO VOICE SO PLEASE DON'T USE ANY KIND OF SPECIAL CHARACTERS LIKE `#` or `*`. " AS IT WILL GIVE UNATURAL SOUNDS. Only say 1 thing at time and not all at once. Also please write everything in 1 sentence instead of multiple''',
            },
        ]

        graph = create_react_agent(llm, tools ,checkpointer=MemorySaver(), state_modifier='''You are an AI agent AND YOU SPEAK ONLY IN THE LANGUAGE DECIDED BY THE USER BUT THE USER CAN SPEAK IN ENGLISH BUT REPLY IN THE LANGUAGE DECIDED BY THE USER ONLY. 
                           You are tasked to help a user decide and buy a museum ticket. You can speak in multiple languages mostly Indian.
                            Your end goal is to gather the following information from the user 1) Name of the user, 2) Show the user wants to watch (give user the list of available shows to book), 3) Number of tickets required.
                            You shall ask these questions to the user in a natural way ONE BY ONE. If the user has any query related to museum stop and answer that first and then ask question again.
                            AT THE END GIVE A SUMMARY FOR THE ORDER IN WITH THE FOLLOWING VALUES,NAME:, SHOW: NUMBER OF TICKETS:, TOTAL AMOUNT TO BE PAID. REMEMBER YOUR BILL MESSAGE MUST HAVE THE NAME, SHOW, NUMBER OF TICKETS AND TOTAL AMOUNT TO BE PAID. IF THOSE ARE NOTPRESENT REWRITE YOUR MESSAGE.
                           Start with saying Hello i'm ur agent for today, how may I help you?
                                   YOUR TEXT WILL BE CONVERTED TO VOICE SO PLEASE DON'T USE ANY KIND OF SPECIAL CHARACTERS LIKE `#` or `*`. " AS IT WILL GIVE UNATURAL SOUNDS. Only say 1 thing at time and not all at once. Also please write everything in 1 sentence instead of multiple''')

        tma_in = LLMUserResponseAggregator(messages)
        tma_out = LLMAssistantResponseAggregator(messages)
        proc = LanggraphProcessor(graph)

        pipeline = Pipeline([
            transport.input(),   # Websocket input from client
            stt,                 # Speech-To-Text
            tma_in,              # User responses
            proc,                 # LLM
            tts,                 # Text-To-Speech
            transport.output(),  # Websocket output to client
            tma_out              # LLM responses
        ])

        task = PipelineTask(pipeline)

        @transport.event_handler("on_client_connected")
        async def on_client_connected(transport, client):
            # Kick off the conversation.
            messages.append(
                {"role": "system", "content": "Please introduce yourself to the user."})
            await task.queue_frames([LLMMessagesFrame(messages)])

        runner = PipelineRunner()

        await runner.run(task)

if __name__ == "__main__":
    asyncio.run(main())