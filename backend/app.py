from io import BytesIO
from flask import Flask, jsonify, request, send_file
from flask_pymongo import PyMongo
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from chat_model import *
from datetime import datetime  # Correct import
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
import random
import re


app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb+srv://rayyaan:rayyaan123@assistance-app.cg5ou.mongodb.net/college_database?retryWrites=true&w=majority&appName=Assistance-app"
mongo = PyMongo(app)

# Ensure database connection
try:
    # The ping command is cheap and does not require auth.
    mongo.db.command('ping')
    print("Connected to MongoDB!")
except ConnectionFailure:
    print("Failed to connect to MongoDB")
    # You might want to exit the application here if MongoDB is critical
    # import sys
    # sys.exit(1)

# Helper function to convert ObjectId to string
def convert_objectid(document):
    document["_id"] = str(document["_id"])
    return document

@app.route("/",methods=['GET'])
def home_route():
    return "chat backend"

@app.route('/voice/response', methods=['POST'])
def handle_voice_response():
    data = request.json
    print(data)
    emit("voice_response", data)
    return "sent to front"


summary_llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.5,  # Adjust the temperature for more creative summaries
    max_tokens=800,   # Adjust the token length for your summaries
    timeout=None,
    max_retries=2,
    google_api_key="AIzaSyDPMDPp221VN3OznFnYj74ga0gDCPVxbEA"
)

def clean_summary(raw_summary):
    # Replace headings '##' with a formatted title
    clean_text = re.sub(r"##\s*(.+)", r"\1\n", raw_summary)

    # Replace bold '**' with normal text
    clean_text = re.sub(r"\*\*(.+?)\*\*", r"\1", clean_text)

    # Replace bullet points '*' with '-' (optional) or leave them out for cleaner text
    clean_text = re.sub(r"\*\s*", "- ", clean_text)

    return clean_text
def format_summary_for_chat(summary):
    summary = clean_summary(summary)
    lines = summary.split('\n')
    formatted_content = []
    
    for line in lines:
        stripped_line = line.strip()
        if not stripped_line:
            continue
        
        if stripped_line.endswith(':'):
            if len(stripped_line) > 30:  # Longer lines as main headings
                formatted_content.append(f"\n### {stripped_line}\n")
            else:
                formatted_content.append(f"\n#### {stripped_line}\n")
        elif stripped_line.startswith('•') or stripped_line.startswith('-'):
            formatted_content.append(f"- {stripped_line[1:].strip()}")
        else:
            formatted_content.append(stripped_line)

    return "\n".join(formatted_content) 
@app.route('/generate-summary', methods=['POST'])
def generate_summary():
    data = request.json
    conversation_history = data.get('conversation', [])
    
    if not conversation_history:
        return jsonify({"error": "No conversation history available for summarization."}), 400

    # Format the entire conversation as a string for the prompt
    formatted_conversation = ""
    for message in conversation_history:
        formatted_conversation += f"User: {message['user']}\nBot: {message['bot']}\n\n"

    # Create the dramatic-style prompt for summarization
    prompt = f"""

As an AI specialized in providing student assistance and college-related information for EduMitra, create a structured summary of the following conversation in a style suitable for educational purposes. Use the format below:
Conversation to summarize:
{formatted_conversation}
Please structure the summary as follows:

### **Introduction**
- Briefly introduce the context of the conversation and the primary focus areas discussed.

### **Main Topics Discussed**
- List the key subjects covered during the conversation.
- Use bullet points for clarity.

### **Detailed Information**
- For each main topic, provide:
  - Sub-bullets with key facts, data, or explanations discussed.
  - Specific details about college names, courses, fees, scholarships, or other aspects.
  - Include numerical data, rankings, or relevant cutoffs where mentioned.

### **Key Takeaways**
- Summarize the most critical points or conclusions from the discussion.

### **Next Steps (if applicable)**
- List any recommended actions or follow-up steps suggested during the conversation.

### **Conclusion**
- Provide a concise closing statement summarizing the overall discussion.



NOTE---->
- Structure the response using markdown syntax to ensure readability (e.g., headers, lists).
- Use clear, professional, and user-friendly language.
- Incorporate any numerical data, scores, or rankings if mentioned in the conversation.
- Ensure information about colleges or courses is accurate and contextually relevant.
- Use formatting elements such as **bold**, *italic*, or `code` for emphasis where appropriate.
- Present all data clearly and avoid any unrelated information.
"""

    # Call the Gemini LLM to generate the summary
    try:
        summary_response = summary_llm.invoke(prompt)

        # Assuming the response is an AIMessage object, extract the content appropriately
        if hasattr(summary_response, 'content'):
            summary_text = summary_response.content 
        else:
            summary_text = str(summary_response)  # Fallback to string conversion
        # Add the summary to the response
        return jsonify({
            "summary": summary_text,
            "status": "Summary generated successfully"
        })
    except Exception as e:
        return jsonify({"error": f"Failed to generate summary: {str(e)}"}), 500
def format_summary(summary):
    styles = getSampleStyleSheet()
    
    # Modify existing styles instead of adding new ones
    styles['Title'].fontName = "Helvetica-Bold"
    styles['Title'].fontSize = 24
    styles['Title'].spaceAfter = 30
    styles['Title'].alignment = 1  # Center alignment
    styles['Title'].textColor = HexColor("#000066")
    
    styles['Heading1'].fontName = "Helvetica-Bold"
    styles['Heading1'].fontSize = 18
    styles['Heading1'].spaceBefore = 20
    styles['Heading1'].spaceAfter = 10
    styles['Heading1'].textColor = HexColor("#000066")
    
    styles['Normal'].fontName = "Helvetica"
    styles['Normal'].fontSize = 12
    styles['Normal'].leading = 16
    styles['Normal'].spaceBefore = 6
    styles['Normal'].spaceAfter = 6
    
    # Add only the custom bullet style which doesn't exist
    styles.add(ParagraphStyle(
        'BulletPoint',
        parent=styles['Normal'],
        leftIndent=20,
        bulletIndent=10,
        spaceBefore=3,
        spaceAfter=3
    ))

    def process_markdown(text):
        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
        text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
        return text

    story = []
    story.append(Paragraph("EduMitra Conversation Summary", styles['Title']))
    story.append(Spacer(1, 30))
    
    sections = summary.split('###')
    for section in sections:
        if not section.strip():
            continue
            
        lines = section.strip().split('\n')
        if lines:
            # Add section heading
            heading = lines[0].strip('* ')
            story.append(Paragraph(heading, styles['Heading1']))
            story.append(Spacer(1, 10))
            
            current_list_items = []
            
            for line in lines[1:]:
                line = line.strip()
                if not line:
                    continue
                    
                if line.startswith('-') or line.startswith('•'):
                    item_text = line[1:].strip()
                    item_text = process_markdown(item_text)
                    current_list_items.append(
                        ListItem(
                            Paragraph(item_text, styles['BulletPoint']),
                            bulletColor=HexColor("#000066")
                        )
                    )
                else:
                    if current_list_items:
                        story.append(
                            ListFlowable(
                                current_list_items,
                                bulletType='bullet',
                                bulletFontSize=8,
                                bulletOffsetY=2
                            )
                        )
                        current_list_items = []
                    
                    text = process_markdown(line)
                    story.append(Paragraph(text, styles['Normal']))
            
            if current_list_items:
                story.append(
                    ListFlowable(
                        current_list_items,
                        bulletType='bullet',
                        bulletFontSize=8,
                        bulletOffsetY=2
                    )
                )
            
            story.append(Spacer(1, 15))
    
    return story

@app.route('/download-summary', methods=['POST'])
def download_summary():
    data = request.json
    summary = data.get('summary', '')

    if not summary:
        return jsonify({"error": "No summary available for download."}), 400

    try:
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=60,
            leftMargin=60,
            topMargin=48,
            bottomMargin=48
        )
        
        # Format and build PDF
        story = format_summary(summary)
        doc.build(story)
        
        # Prepare response
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'EduMitra_Summary_{datetime.now().strftime("%Y%m%d_%H%M")}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return jsonify({"error": "Failed to generate PDF"}), 500
@socketio.on('send_message')
def handle_send_message(msg):
    print("Generating response for: ", msg)
    res = ChatModel(msg["id"], msg["msg"])
    print("sending", res)
    socketio.emit("response", res)

@app.route('/quiz/questions', methods=['GET'])
def get_quiz_questions():
    try:
        # Ensure the collection exists
        if 'quiz_questions' not in mongo.db.list_collection_names():
            return jsonify({"error": "Quiz questions collection does not exist"}), 404

        questions = list(mongo.db.quiz_questions.find())
        if not questions:
            return jsonify({"error": "No quiz questions found"}), 404

        questions_list = [convert_objectid(question) for question in questions]
        random.shuffle(questions_list)
        return jsonify(questions_list[:5]), 200
    except Exception as e:
        print(f"Error accessing quiz questions: {e}")
        return {"error": str(e)}, 500

def analyze_quiz_answers(answers):
    course_scores = {
        "Computer Science and Engineering (CSE)": 0,
        "Mechanical Engineering": 0,
        "Electrical Engineering": 0,
        "Civil Engineering": 0,
        "Artificial Intelligence (AI)": 0,
        "Data Science": 0,
        "Biomedical Engineering": 0,
        "Aerospace Engineering": 0,
        "Chemical Engineering": 0,
        "Electronics and Communication Engineering": 0,
        "Information Technology (IT)": 0
    }
    
    for question_id in answers.keys():
        question = mongo.db.quiz_questions.find_one({"_id": ObjectId(question_id)})
        if question:
            weights = question.get("courseWeights", {})
            for course, weight in weights.items():
                if course in course_scores:
                    course_scores[course] += weight
    
    sorted_courses = sorted(course_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    
    recommendations = [
        {
            "course": course,
            "score": score,
            "reason": f"Based on your answers, you show a strong aptitude for {course}."
        }
        for course, score in sorted_courses if score > 0
    ]
    
    return recommendations

@app.route('/quiz/submit', methods=['POST'])
def submit_quiz():
    try:
        data = request.json
        answers = data['answers']
        
        recommendations = analyze_quiz_answers(answers)
        
        mongo.db.quiz_responses.insert_one({"answers": answers, "recommendations": recommendations})
        
        return jsonify(recommendations), 200
        
    except Exception as e:
        print(f"Error processing quiz submission: {e}")
        return {"error": str(e)}, 500

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)