from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson import ObjectId
from flask_cors import CORS
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

app = Flask(__name__)
CORS(app)


app.config["MONGO_URI"] = "mongodb://localhost:27017/"
mongo = PyMongo(app)

client = AsyncIOMotorClient("mongodb://localhost:27017/")
db = client.national_museum_database  
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

if __name__ == '__main__':
    app.run(debug=True)