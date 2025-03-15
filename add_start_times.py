import json
import random

def generate_time():
    # Generate hours between 12 PM and 8 PM (20:00)
    hour = random.randint(12, 20)
    # Generate minutes in 15-minute intervals
    minute = random.choice([0, 15, 30, 45])
    # Format time as HH:MM
    return f"{hour:02d}:{minute:02d}"

# Read the JSON file
with open('fine-dining-dataset-augmented.json', 'r') as f:
    data = json.load(f)

# Add start_time field to all reservations
for diner in data['diners']:
    for reservation in diner['reservations']:
        reservation['start_time'] = generate_time()

# Write the modified data back to the file
with open('fine-dining-dataset-augmented.json', 'w') as f:
    json.dump(data, f, indent=4)
