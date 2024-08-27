from pymongo import MongoClient
from datetime import datetime, timedelta
import client_info

def connect_to_mongodb():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['national_museum_database']
    return db

def create_sample_events():
    # This function remains unchanged
    return [
        {
            "name": "Ancient Civilizations Exhibition",
            "category": "Permanent Exhibition",
            "description": "Explore the wonders of ancient civilizations from around the world.",
            "prices": {
                "normal_unguided": 15,
                "normal_guided": 25,
                "special_guided": 40
            },
            "timings": ["09:00", "11:00", "14:00", "16:00"],
            "duration": 120,  # in minutes
            "capacity": 50,
            "days_available": ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"]
        },
        {
            "name": "Modern Art Masterpieces",
            "category": "Permanent Exhibition",
            "description": "A curated collection of 20th and 21st century artistic masterpieces.",
            "prices": {
                "normal_unguided": 20,
                "normal_guided": 30,
                "special_guided": 45
            },
            "timings": ["10:00", "13:00", "15:00"],
            "duration": 90,
            "capacity": 40,
            "days_available": ["Tuesday", "Thursday", "Saturday", "Sunday"]
        },
        {
            "name": "Dinosaur Discovery",
            "category": "Permanent Exhibition",
            "description": "Journey back in time to the age of dinosaurs.",
            "prices": {
                "normal_unguided": 18,
                "normal_guided": 28,
                "special_guided": 42
            },
            "timings": ["09:30", "11:30", "14:30", "16:30"],
            "duration": 100,
            "capacity": 60,
            "days_available": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        },
        {
            "name": "Space Exploration",
            "category": "Temporary Exhibition",
            "description": "Discover the mysteries of the universe and the history of space exploration.",
            "prices": {
                "normal_unguided": 22,
                "normal_guided": 32,
                "special_guided": 48
            },
            "timings": ["10:00", "12:00", "14:00", "16:00"],
            "duration": 110,
            "capacity": 45,
            "days_available": ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "start_date": datetime(2024, 6, 1),
            "end_date": datetime(2024, 12, 31)
        },
        {
            "name": "Wildlife Photography",
            "category": "Temporary Exhibition",
            "description": "Award-winning wildlife photographs from around the globe.",
            "prices": {
                "normal_unguided": 16,
                "normal_guided": 26,
                "special_guided": 38
            },
            "timings": ["11:00", "14:00", "16:00"],
            "duration": 80,
            "capacity": 35,
            "days_available": ["Friday", "Saturday", "Sunday"],
            "start_date": datetime(2024, 7, 1),
            "end_date": datetime(2024, 9, 30)
        },
        {
            "name": "Night at the Museum",
            "category": "Special Event",
            "description": "Experience the museum after hours with special guided tours and activities.",
            "prices": {
                "special_guided": 60
            },
            "timings": ["20:00"],
            "duration": 180,
            "capacity": 30,
            "days_available": ["Saturday"],
            "frequency": "Monthly"
        },
        {
            "name": "Children's Interactive Workshop",
            "category": "Educational Program",
            "description": "Hands-on learning experience for children aged 7-12.",
            "prices": {
                "normal_guided": 25
            },
            "timings": ["10:00", "14:00"],
            "duration": 120,
            "capacity": 20,
            "days_available": ["Saturday", "Sunday"],
            "age_range": "7-12"
        }
    ]

def insert_events(db):
    events_collection = db['events']
    events = create_sample_events()
    for event in events:
        events_collection.update_one({'name': event['name']}, {'$set': event}, upsert=True)
    print(f"Inserted {len(events)} events into the database.")

def print_all_events(db):
    events_collection = db['events']
    all_events = list(events_collection.find())
    print("All events in the database:")
    for event in all_events:
        print(f"- {event['name']}")

def normalize_tour_type(tour_type):
    tour_type = tour_type.lower().strip()
    if 'special' in tour_type and 'guided' in tour_type:
        return 'special_guided'
    elif 'guided' in tour_type:
        return 'normal_guided'
    else:
        return 'normal_unguided'

def calculate_total_cost(db, event_name, num_tickets, tour_type):
    events_collection = db['events']
    # Use case-insensitive regex search and trim spaces
    event = events_collection.find_one({'name': {'$regex': f'^{event_name.strip()}$', '$options': 'i'}})
    
    if not event:
        # If not found, print all event names for debugging
        print("Available events in the database:")
        all_events = list(events_collection.find({}, {'name': 1}))
        for e in all_events:
            print(e['name'])
        raise ValueError(f"Event '{event_name}' not found in the database.")
    
    prices = event['prices']
    normalized_tour_type = normalize_tour_type(tour_type)
    
    if normalized_tour_type not in prices:
        raise ValueError(f"Invalid tour type '{tour_type}' for event '{event['name']}'.")
    
    price_per_ticket = prices[normalized_tour_type]
    total_cost = price_per_ticket * num_tickets
    
    return total_cost, event['name']

def insert_guest_data(db, client_name, email, phone_number, num_tickets, event_name, event_time, tour_type, special_provisions, total_cost):
    guests_collection = db['guests']
    guest_data = {
        'name': client_name,
        'email': email,
        'phone_number': phone_number,
        'number_of_tickets': num_tickets,
        'event_name': event_name,
        'timings': event_time,
        'tour_type': tour_type,
        'special_provisions': special_provisions,
        'total_cost': total_cost,
        'booking_date': datetime.now()
    }
    guests_collection.insert_one(guest_data)

def store_museum_data(client_name, phone_number, email_id, event_name, num_tickets, tour_type, special_provisions, event_time):
    db = connect_to_mongodb()
    
    # Ensure we have events in the database
    insert_events(db)
    print_all_events(db)  # Print all events for debugging
    
    print(f"Attempting to book event: '{event_name}'")  # Debug print
    
    # Calculate the total cost
    try:
        total_cost, actual_event_name = calculate_total_cost(db, event_name, num_tickets, tour_type)
    except ValueError as e:
        print(f"Error calculating cost: {e}")
        return
    
    # Insert the guest data
    insert_guest_data(
        db,
        client_name,
        email_id,
        phone_number,
        num_tickets,
        actual_event_name,
        event_time,
        tour_type,
        special_provisions,
        total_cost
    )
    
    print(f"Booking confirmed for {client_name}:")
    print(f"Event: {actual_event_name}")
    print(f"Tour type: {tour_type}")
    print(f"Number of tickets: {num_tickets}")
    print(f"Total cost: ${total_cost}")
    print(f"Special provisions: {special_provisions}")

# Example usage
if __name__ == "__main__":
    client_name, phone_number, email_id, event_name, num_tickets, tour_type, special_provisions, event_time = client_info.ready_to_store('stt.txt')

    store_museum_data(client_name, phone_number, email_id, event_name, num_tickets, tour_type, special_provisions, event_time)