from flask import Flask, jsonify, request, send_file
from flask_pymongo import PyMongo
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from chat_model import *
import json
import random

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

@app.route('/generate_summary', methods=['POST'])
def generate_summary_route():
    messages = request.json['messages']
    conversation_history = [f"{msg['sender']}: {msg['content']}" for msg in messages]
    pdf_buffer = generate_summary(conversation_history)
    
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name='chat_summary.pdf',
        mimetype='application/pdf'
    )

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
    socketio.run(app, debug=True, host='0.0.0.0', port=5000,allow_unsafe_werkzeug=True)