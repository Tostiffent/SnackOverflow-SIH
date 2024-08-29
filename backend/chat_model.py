from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
import getpass
import os
from time import sleep
from langchain_core.tools import tool
import sys
import json
from pymongo import MongoClient
from langchain_core.output_parsers import JsonOutputParser

# API Key (removed redundancy)
os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter your Google AI API key: ")

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['national_museum_database']

# Single Gemini model instance
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

memory = MemorySaver()

# Global variables to store booking information
booking_info = {
    "name": "",
    "show": "",
    "number_of_tickets": 0,
    "total_amount": 0
}

@tool
def check_events() -> str:
    '''Return a list of currently available museum events.'''
    events = list(db.events.find({}, {'name': 1, '_id': 0}))
    return "\n".join([f"{i+1}) {event['name']}" for i, event in enumerate(events)])

@tool
def check_tickets(show: str) -> str:
    '''Return currently available tickets for the show.'''
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

config = {"configurable": {"thread_id": "thread-1"}}

# Extract booking info using Gemini
def extract_booking_info(content):
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
    sleep(3)
    response = llm.invoke(prompt)  # Use only 'llm'
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
    
    # Ensure all expected keys are present
    for key in ["name", "show", "number_of_tickets", "total_amount"]:
        if key not in extracted_info:
            extracted_info[key] = "" if key != "number_of_tickets" else 0
    
    return extracted_info

# Update booking info
def update_booking_info(content):
    global booking_info
    extracted_info = extract_booking_info(content)
    
    for key, value in extracted_info.items():
        if value:
            booking_info[key] = value
    
    # Print updated booking information
    print("\n--- Current Booking Information ---")
    for key, value in booking_info.items():
        print(f"{key.capitalize()}: {value}")
    print("-----------------------------------\n")

# Print conversation and update booking info in real-time
def print_stream(graph, inputs, config):
    global message
    conversation_history = []
    for s in graph.stream(inputs, config, stream_mode="values"):
        message = s["messages"][-1]
        conversation_history.append(f"Bot: {message.content}")
        print(f"Bot: {message.content}")
        update_booking_info("\n".join(conversation_history))
        sleep(3)

# Main function to run the chatbot
def main():
    rate_limit = 0
    print("Bot: Hello there! I'm your agent for today. Choose a language to continue: English or Hindi.")
    sleep(3)
    while True:
        user_input = input("You: ")

        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("Bot: Thank you! Goodbye!")
            sys.exit()

        inputs = {"messages": [("user", user_input)]}  
        print_stream(graph, inputs, config)
        sleep(3)
        if is_conversation_relevant(user_input):
            rate_limit = 0
        else:
            rate_limit += 1
            if rate_limit == 10:
                print("Bot: Thank you! Goodbye! The conversation seems to have gone off-topic.")
                sys.exit()

# Function to check if booking is complete
def is_booking_complete():
    return all(booking_info.values())

# Relevant conversation checker
def is_conversation_relevant(user_input):
    relevant_keywords = [
        'ticket', 'टिकट', 'pass', 'entry', 'admission', 'प्रवेश पत्र', 'museum',
        'event', 'show', 'book', 'reserve', 'price', 'time', 'exhibition'
    ]
    user_words = set(user_input.lower().split())
    return len(user_words.intersection(relevant_keywords)) > 0

# Initialize the agent
graph = create_react_agent(llm, tools, checkpointer=MemorySaver(), state_modifier='''
You are an AI agent tasked to help a user decide and buy a museum ticket.
Your goal is to gather the following information from the user: 1) Name of the user, 2) Show the user wants to watch, 3) Number of tickets required.
Ask these questions one by one, and at the end give a summary in the format: NAME: SHOW: NUMBER OF TICKETS: TOTAL AMOUNT TO BE PAID.
If the user uses profanity, ask them to stop. After payment, ask the user to type 'BYE' to end the conversation.
''')

if __name__ == "__main__":
    main()
