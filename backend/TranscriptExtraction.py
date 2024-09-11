import requests

def ready_to_store(file_name):

    def generate_content(api_key, conversation):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "contents": [
                {
                    "parts": conversation
                }
            ]
        }

        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            content = response.json()
            if 'candidates' in content and len(content['candidates']) > 0:
                generated_text = content['candidates'][0].get('content', {}).get('parts', [{}])[0].get('text', 'No content found')
                return generated_text
            else:
                return f"Error: API did not return the expected content. Response: {content}"
        else:
            return f"Error: {response.status_code}, {response.text}"

    def extract_details(response_text):
        details = {}

        # Extracting each detail using string parsing
        lines = response_text.split('\n')
        for line in lines:
            if "Name of the caller" in line:
                details['client_name'] = line.split(':')[-1].strip().strip('**')
            elif "Phone Number" in line:
                details['phone_number'] = int(line.split(':')[-1].strip().strip('**'))
            elif "Email id" in line:
                details['email_id'] = line.split(':')[-1].strip().strip('**')
            elif "Name of the event" in line:
                details['event_name'] = line.split(':')[-1].strip().strip('**')
            elif "Number of tickets required" in line:
                details['num_tickets'] = int(line.split(':')[-1].strip().strip('**'))
            elif "Type of Tour" in line:
                details['tour_type'] = line.split(':')[-1].strip().strip('**')
            elif "Special Provisions" in line:
                details['special_provisions'] = line.split(':')[-1].strip().strip('**')
            elif "Time of the event" in line:
                details['event_time'] = line.split(':')[-1].strip().strip('**')

        return details

    api_key = "AIzaSyDvHS-6L1iDiTgu5zBUWs4GeCb0bIOveyk"  # Replace with your actual API key
    conversation_history = []
   
    with open(file_name,'r') as f:
        convo = f.read()

    conversation_history.append({"text": "I will be providing you with a recorded phone call which was converted to text including diarization, it is a phone call where the user is inquiring about a query about our Museum. I need you to segregate all the required details: Name of the caller, 1)Phone Number, 2)Email id, 3)Name of the event, 4)Number of tickets required, 5)Type of Tour(Normal or special, guided or unguided), 6)Time of the event, 7)Special Provisions (like wheel chair etc...). \n Call: \n" + convo})
    
    response_text = generate_content(api_key, conversation_history)
    print("Chatbot:", response_text)
    
    # Extract details from the response
    details = extract_details(response_text)
    
    # Assign to variables
    client_name = details.get('client_name', 'N/A')
    phone_number = details.get('phone_number', 'N/A')
    email_id = details.get('email_id', 'N/A')
    event_name = details.get('event_name', 'N/A')
    num_tickets = details.get('num_tickets', 'N/A')
    tour_type = details.get('tour_type', 'N/A')
    special_provisions = details.get('special_provisions', 'N/A')
    event_time = details.get('event_time', 'N/A')

    return client_name, phone_number, email_id, event_name, num_tickets, tour_type, special_provisions, event_time

ready_to_store('stt.txt')