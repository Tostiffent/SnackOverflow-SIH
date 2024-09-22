import sys
from time import sleep
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from pymongo import MongoClient
from langchain_community.document_loaders.csv_loader import CSVLoader
import asyncio
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
from time import sleep 
import sys
# MongoDB connection
client = MongoClient('mongodb+srv://rayyaan:rayyaan123@assistance-app.cg5ou.mongodb.net/?retryWrites=true&w=majority&appName=Assistance-app')
db = client['college_database']

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    google_api_key="AIzaSyDIG-JhAjoTJPZV_M5CGzjhIX8klNbXm3I"

)

extractionLLM = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    google_api_key="AIzaSyDIG-JhAjoTJPZV_M5CGzjhIX8klNbXm3I"
)

memory = MemorySaver()



@tool
def check_colleges() -> dict:
    '''Return a list of currently listed colleges in the database from Rajasthan. Use when user wants to know about the colleges available. WHENEVER USER ASK WHAT ALL COLLEGES YOU KNOW ABOUT GIVE THIS LIST... FETCH DATA FROM DATA BASE'''
    colleges = list(db.colleges.find())
    college_info = [{"name": college["name"], "id": str(college["_id"])} for college in colleges]
    print(college_info)
    return {"colleges": college_info, "type": "college_list"}
@tool
def check_courses(name: str) -> str:
    '''Return currently available courses in a particular college'''
    college = db.colleges.find_one({'name': name})
    print(college)
    if college:
        return college["Courses"]
    else:
        return {
            "error": f"Sorry we don't have any information about {name}"
        }

@tool
def check_fees(name: str, type: str) -> str:
    '''Return the current fees for each college depending on the type (regular or management)'''
    college = db.colleges.find_one({'name': name})
    return {
            "fees": college[type],
        }

    
    

@tool 
def check_cutoff(name: str) -> dict:
    '''Return the cutoffs in a particular selected college'''
    college = db.colleges.find_one({'name': name})
    
    if college:
        return {
            "cutoff": college["cutoff"]
        }
    else:
        return {
            "error": f"Sorry, we don't have any information about {name}"
        }
tools = [check_courses, check_colleges, check_fees, check_cutoff]

def extract_college_info(content):
    prompt = f"""
    Extract the college inquiry information from the following conversation:
    {content}
    
    Return the information in JSON format with the following keys:
    - name: The name of the college being inquired about (if mentioned)
    - course: The course being inquired about (if mentioned)
    - fees: The fee structure being inquired about (if mentioned)
    - cutoff: The cutoff information being inquired about (if mentioned)
    - scholarships: Any scholarships being inquired about (if mentioned). BUT DONT RETURN ANYTHING RELATED TO SCHOLARSHIP
    - specific_details: Any specific details or questions asked
    
    If any information is not available, leave the value as an empty string or 0 for numbers.
    If no relevant information is found, return an empty JSON object. 
    """
    
    response = extractionLLM.invoke(prompt)
    print(response)  
    try:
        extracted_info = json.loads(response.content)
        print(extracted_info)
    except json.JSONDecodeError:
        try:
            json_start = response.content.index('{')
            json_end = response.content.rindex('}') + 1
            json_str = response.content[json_start:json_end]
            extracted_info = json.loads(json_str)
        except (ValueError, json.JSONDecodeError):
            print("Warning: Could not extract valid JSON from the response.")
            return {}
    
    
    
    return extracted_info


def print_stream(graph, inputs, config):
     msg = ""
     toolCall = {}
     for s in graph.stream(inputs, config, stream_mode="values"):
         message = s["messages"][-1]
         #adding only the ai chunks
         
         if message.type == "ai":
             msg = msg + message.content
         elif message.type == "tool":
             toolCall = json.loads(message.content)
           
        # leaving this for testing
         if isinstance(message, tuple):
             print(message)
         else:
             message.pretty_print()
     return {"msg": msg, "toolCall":toolCall}

def ChatModel(id, msg):
    config = {"configurable": {"thread_id": id}}
    inputs = {"messages": [("user", msg)]}
    try:
        res = print_stream(graph, inputs, config)
        extraction = extract_college_info(res["msg"])
        return {"res": res, "info": extraction}
    except Exception as e:
        print("Error in ChatModel:", str(e))
        return {"res": {"msg": "I'm sorry, but I encountered an error. Could you please try again?", "toolCall": {}}, "info": {}}
graph = create_react_agent(llm, tools, checkpointer=MemorySaver(), state_modifier='''You are an AI-powered Student Assistance Chatbot for the Department of Technical Education, Government of Rajasthan. Your primary role is to provide accurate and helpful information about engineering and polytechnic institutes in Rajasthan.
ACCESSS THE COLLEGES INFO THROUGH THE @TOOLS AND USE THE COLLEGE NAME TO FETCH THE DATA FROM THE DATABASE. FETCH DATA FROM DATABASE ONLY ONLY ONLY.ACCESSS THE COLLEGES INFO THROUGH THE @TOOLS AND USE THE COLLEGE NAME TO FETCH THE DATA FROM THE DATABASE. FETCH DATA FROM DATABASE ONLY ONLY ONLY
IF THE USER ASKS ABOUT ALL THE ENGINEERING COLLEGES AVAILABLE FETCH THE DATABASE AND FROM THE TOOL CALL OF DATABSE, SEE THE CATEGORY OF THE COLLEGES AVAILABLE IN DATABSE, AND PRINT THE ENGINEERING COLLEGES. 
IF THE USER ASKS ABOUT ALL THE POLYTECHNIC COLLEGES AVAILABLE FETCH THE DATABASE AND FROM THE TOOL CALL OF DATABSE, SEE THE CATEGORY OF THE COLLEGES AVAILABLE IN DATABSE, AND PRINT THE POLYTECHNIC COLLEGES. 
IF THE USERASKS ABOUT SOME MEDICAL OR ARTS OR ANY OTHER MISCLENEOUS COLLEGES, JUST SAY YOU DONT HAVE ANY INFORMATION.
Key Points:
1. Language: You can understand queries in English or Hindi, but always respond in the language chosen by the user at the start of the conversation.
2. Scope: You only provide information about engineering and polytechnic colleges under the Department of Technical Education, Government of Rajasthan.
3. Information Coverage: You can answer questions about:
   - Admission processes all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - Eligibility criteria all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - College-specific information all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - Fee structures all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - Curricula all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - Scholarships all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - Hostel facilities all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - Previous year's college and branch-specific allotments all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.
   - Placement opportunities all with respective to the specific college chosen by the User before, dont try to give information of some other college , if you dont know just avoid answering and say you dont have accurate information.

4. Data Source:FETCH USING THE TOOL FECTH DATABASE.
5. User Experience: Be polite, patient, and thorough in your responses. Use markdown, numbering, and bolding where appropriate to present information clearly.
6. Complex Queries: If a query is too complex or outside your knowledge base, politely suggest contacting the specific college or department directly.
7. Data Privacy: Do not share or ask for personal information.
8. Continuous Availability: Remind users that you're available 24/7 for their queries
9. College Selection: When a user asks about colleges or needs to select a specific college, use the check_college tool to fetch the list of colleges. Present this list to the user as a series of options they can choose from.
10. College Cut-off: When a user asks about the previous year's college and branch-specific allotments, use the check_cutoff tool to fetch the list of cutoff of that particular college selected by user.
11. College Fees: When a user asks about the fee structure of a college, use the check_fees tool to fetch the fee structure of that particular college selected by user.

Start the conversation by introducing yourself and asking how you can help with college information today. Always try to provide accurate, helpful, and efficient assistance to reduce the workload on department staff and enhance the user experience.

NOTE- IF YOU DONT HAVE ANY COLLEGES IN DATABASE, DONT ANSWER ANYTHING, JUST SAY YOU DONT HAVE ANY INFORMATION. ''')
#uncomment and run to test
# def main():
#     print("Bot: Hello there! I'm your agent for today. Choose a language to continue: English or Hindi or Kannada.")
#     while True:
#         user_input = input("You: ")
#         if user_input.lower() in ['exit', 'quit', 'bye']:
#             print("Bot: Thank you! Goodbye!")
#             sys.exit()
        
#         inputs = {"messages": [("user", user_input)]}
#         print_stream(graph, inputs, config={"configurable": {"thread_id": "123"}})  
#         sleep(2)  

# if __name__ == "__main__":
#     main()