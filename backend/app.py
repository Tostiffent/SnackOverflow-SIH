from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson import ObjectId

app = Flask(__name__)

# MongoDB connection string
app.config["MONGO_URI"] = "mongodb://localhost:27017/"
mongo = PyMongo(app)

# Helper function to convert ObjectId to string
def convert_objectid(document):
    document["_id"] = str(document["_id"])
    return document

@app.route('/events', methods=['GET'])
def get_events():
    try:
        events = mongo.db.events.find()
        events_list = [convert_objectid(event) for event in events]
        return jsonify(events_list), 200
    except Exception as e:
        print(f"Error accessing events: {e}")
        return {"error": str(e)}, 500

@app.route('/add_event', methods=['POST'])
def add_event():
    try:
        data = request.json
        event_id = mongo.db.events.insert_one(data).inserted_id
        return jsonify({"message": "Event added successfully", "event_id": str(event_id)}), 201
    except Exception as e:
        print(f"Error adding event: {e}")
        return {"error": str(e)}, 500

@app.route('/update_event/<event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        data = request.json
        result = mongo.db.events.update_one({'_id': ObjectId(event_id)}, {"$set": data})
        if result.matched_count == 0:
            return jsonify({"message": "Event not found"}), 404
        return jsonify({"message": "Event updated successfully"}), 200
    except Exception as e:
        print(f"Error updating event: {e}")
        return {"error": str(e)}, 500

@app.route('/delete_event/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        result = mongo.db.events.delete_one({'_id': ObjectId(event_id)})
        if result.deleted_count == 0:
            return jsonify({"message": "Event not found"}), 404
        return jsonify({"message": "Event deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting event: {e}")
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(debug=True)
