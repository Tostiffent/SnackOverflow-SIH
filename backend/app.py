from flask import Flask, jsonify, request, send_file
from flask_pymongo import PyMongo
from bson import ObjectId
from flask_cors import CORS
from motor.motor_asyncio import AsyncIOMotorClient
from flask_socketio import SocketIO
from chat_model import *
import json
import random
import asyncio

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Synchronous PyMongo for blocking operations
app.config["MONGO_URI"] = "mongodb+srv://rayyaan:rayyaan123@assistance-app.cg5ou.mongodb.net/?retryWrites=true&w=majority&appName=Assistance-app"
mongo = PyMongo(app)

# Asynchronous Motor client for non-blocking operations
client = AsyncIOMotorClient("mongodb+srv://rayyaan:rayyaan123@assistance-app.cg5ou.mongodb.net/?retryWrites=true&w=majority&appName=Assistance-app")
db = client.college_database

# Helper function to convert ObjectId to string
def convert_objectid(document):
    document["_id"] = str(document["_id"])
    return document

@app.route('/events', methods=['GET'])
async def get_events():
    try:
        events = await db.events.find().to_list(length=None)
        events_list = [convert_objectid(event) for event in events]
        return jsonify(events_list), 200
    except Exception as e:
        print(f"Error accessing events: {e}")
        return {"error": str(e)}, 500

@app.route('/add_event', methods=['POST'])
async def add_event():
    try:
        data = request.json
        result = await db.events.insert_one(data)
        return jsonify({"message": "Event added successfully", "event_id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error adding event: {e}")
        return {"error": str(e)}, 500

@app.route('/update_event/<event_id>', methods=['PUT'])
async def update_event(event_id):
    try:
        data = request.json
        result = await db.events.update_one({'_id': ObjectId(event_id)}, {"$set": data})
        if result.matched_count == 0:
            return jsonify({"message": "Event not found"}), 404
        return jsonify({"message": "Event updated successfully"}), 200
    except Exception as e:
        print(f"Error updating event: {e}")
        return {"error": str(e)}, 500

@app.route('/delete_event/<event_id>', methods=['DELETE'])
async def delete_event(event_id):
    try:
        result = await db.events.delete_one({'_id': ObjectId(event_id)})
        if result.deleted_count == 0:
            return jsonify({"message": "Event not found"}), 404
        return jsonify({"message": "Event deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting event: {e}")
        return {"error": str(e)}, 500
    
@app.route('/voice/response', methods=['POST'])
async def handle_voice_response():
    data = request.json
    print(data)
    socketio.emit("voice_response", data)
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
async def get_quiz_questions():
    try:
        questions = await db.quiz_questions.find().to_list(length=None)
        questions_list = [convert_objectid(question) for question in questions]
        random.shuffle(questions_list)
        return jsonify(questions_list[:5]), 200
    except Exception as e:
        print(f"Error accessing quiz questions: {e}")
        return {"error": str(e)}, 500

@app.route('/quiz/submit', methods=['POST'])
async def submit_quiz():
    try:
        data = request.json
        answers = data['answers']
        
        recommendations = await asyncio.run(analyze_quiz_answers(answers))
        
        await db.quiz_responses.insert_one({"answers": answers, "recommendations": recommendations})
        
        return jsonify(recommendations), 200
    except Exception as e:
        print(f"Error processing quiz submission: {e}")
        return {"error": str(e)}, 500

async def analyze_quiz_answers(answers):
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
    
    for question_id, answer in answers.items():
        question = await db.quiz_questions.find_one({"_id": ObjectId(question_id)})
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

if __name__ == '__main__':
    socketio.run(app, debug=True, host='127.0.0.1', port=5000)
