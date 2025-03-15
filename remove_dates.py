import json

# Read the JSON file
with open('fine-dining-dataset-augmented.json', 'r') as f:
    data = json.load(f)

# Remove date field from all reservations
for diner in data['diners']:
    for reservation in diner['reservations']:
        if 'date' in reservation:
            del reservation['date']

# Write the modified data back to the file
with open('fine-dining-dataset-augmented.json', 'w') as f:
    json.dump(data, f, indent=4)
