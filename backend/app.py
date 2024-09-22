from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson import ObjectId
from flask_cors import CORS
from motor.motor_asyncio import AsyncIOMotorClient
from flask_socketio import SocketIO
from flask_socketio import emit
from chat_model import ChatModel
import json

app = Flask(__name__)
#socketio and cors headers
cors = CORS(app, resources={r"/*": {"origins": "*"}})
#threading auto handles all async tasks as a seperate thread
socketio = SocketIO(app, cors_allowed_origins="*")


app.config["MONGO_URI"] = "mongodb+srv://rayyaan:rayyaan123@assistance-app.cg5ou.mongodb.net/?retryWrites=true&w=majority&appName=Assistance-app"
mongo = PyMongo(app)

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
    

#event named send_message is trigger, current input format as a dict {"msg": string, "id", string}
@socketio.on('send_message')
def handle_send_message(msg):
    print("Generating response for: ", msg)
    #manually converting string to json
    res = ChatModel(msg["id"], msg["msg"])
    #response is the event name triggered on frontend
    print("sending", res)
    socketio.emit("response", res)

if __name__ == '__main__':
    #socketio takes over the handling of the flask application
    socketio.run(app, debug=True, host='127.0.0.1', port=5000)
