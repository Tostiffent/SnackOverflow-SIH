from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
import getpass
import os
from langchain_core.tools import tool
from time import sleep
import argparse
os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter your Google AI API key: ")
from langchain_core.messages import HumanMessage, SystemMessage
import aiohttp
import asyncio


llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2, 
)

memory = MemorySaver()
### Build retriever tool ###-pr1
@tool
async def check_events() -> str:
    '''Return a list of currently available museum events. Use this when asking the user to book for tickets. Can be used to let user know what is available to book'''
    async with aiohttp.ClientSession() as session:
        async with session.get('http://localhost:5000/events') as response:
            if response.status == 200:
                events = await response.json()
                return "\n".join([f"{i+1}) {event['name']}" for i, event in enumerate(events)])
            else:
                return "Error fetching events. Please try again later."
@tool
def check_events() -> float:
     '''Return a list of currently available museum events. Use this when asking the user to book for tickets. Can be used to let user know what is available to book'''
     return f"1) Stargazing, 2) Astronomy, 3) Painting, 4) History"

@tool
def check_tickets() -> float:
     '''Return currently available tickets for the show, use this tool when user is selecting how many tickets he/she wants. Can also be used to give more information about the event by telling that these many tickets are available'''
     return f"5 tickets available for stargazing, 10 for astronomy, 1 for paiting, 4 for history. Price for each ticket is 100 rupees"
tools = [check_tickets, check_events]


config = {"configurable": {"thread_id": "thread-1"}}
def print_stream(graph, inputs, config):
     for s in graph.stream(inputs, config, stream_mode="values"):
         message = s["messages"][-1]
         if isinstance(message, tuple):
             print(message)
         else:
             message.pretty_print()

def main():
    print("Bot: Hello there! I'm your agent for today. Choose a language to continue: English or Hindi.")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("Bot: Thank you! Goodbye!")
            break
        
        inputs = {"messages": [("user", user_input)]}
        print_stream(graph, inputs, config)
        sleep(2)  # Add a 2-second delay between API calls
graph = create_react_agent(llm, tools, checkpointer=MemorySaver(), state_modifier="You are an AI agent AND YOU SPEAK ONLY IN THE LANGUAGE DECIDED BY THE USER BUT THE USER CAN SPEAK IN HINDI OR ENGLISH BUT REPLY IN THE LANGUAGE DECIDED BY THE USER ONLY. You are tasked to help a user decide and buy a museum ticket. You can speak in multiple languages mostly Indian. Your end goal is to gather the following information from the user 1) Name of the user, 2) Show the user wants to watch (give user the list of available shows to book), 3) Number of tickets required. You shall ask these questions to the user in a natural way ONE BY ONE. If the user has any query related to museum stop and answer that first and then ask question again. AT THE END GIVE A SUMMARY FOR THE ORDER IN THE FORMAT NAME:, SHOW: NUMBER OF TICKETS:, TOTAL AMOUNT TO BE PAID: . Start with saying Hello i'm ur agent for today, how may I help you? IF THE USER USES PROFANITY STOP AND ASK THE USER TO NOT USE PROFANITY. ALSO REQUEST THEM TO TALK ABOUT TICKETS IN A NORMAL WAY AND NOT IN PROFANITY.")

if __name__ == "__main__":
    main()