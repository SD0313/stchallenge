from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import json
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# Create OpenAI client
openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to do
    yield
    # Shutdown: close OpenAI client
    await openai_client.close()

app = FastAPI(title="French Laudure API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],  # Support all Remix ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store table assignments
app.state.table_assignments = {}

def get_waiter_name(waiter_id: int) -> str:
    waiters = {
        1: "Sauman Das",
        2: "Danny Bessonov",
        3: "Justin Zhou",
        4: "Amélie Rousseau",
        5: "Philippe Lefebvre",
        6: "Sophie Beaumont",
        7: "Lucas Girard",
        8: "Isabelle Dupont",
        9: "Antoine Mercier",
        10: "Claire Fontaine"
    }
    return waiters.get(waiter_id, "Unknown Waiter")

def parse_time(time_str: str) -> datetime:
    try:
        # Try 24-hour format first since that's what our dataset uses
        return datetime.strptime(time_str, "%H:%M")
    except ValueError:
        try:
            # Fall back to 12-hour format if needed
            return datetime.strptime(time_str, "%I:%M %p")
        except ValueError as e:
            print(f"Error parsing time {time_str}: {e}")
            raise

async def extract_allergies(diner: dict, reservation: dict) -> str:
    # Combine relevant information for allergy detection
    email_content = '\n'.join(email.get('combined_thread', '') for email in diner.get('emails', []))
    dietary_tags = [item.get('dietary_tags', []) for item in reservation.get('orders', [])]
    dietary_tags = [tag for sublist in dietary_tags for tag in sublist]  # flatten
    reviews = diner.get('reviews', [])
    review_texts = [review.get('text', '') for review in reviews]
    
    prompt = f"""Given the following information about a restaurant reservation, identify any allergies or dietary restrictions mentioned. 
    If no allergies are mentioned, respond with 'No Allergies'. Be concise and only list the allergies.

    Email Content: {email_content}
    Dietary Tags from Orders: {', '.join(dietary_tags)}
    Previous Reviews: {'. '.join(review_texts)}
    """

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are a helpful assistant that identifies allergies and dietary restrictions from restaurant reservation data. Only output the allergies/restrictions or 'No Allergies' if none are found."
            }, {
                "role": "user",
                "content": prompt
            }],
            max_tokens=100,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error extracting allergies: {e}\n --------")
        return "No Allergies"

def extract_reservations(dining_data: dict) -> List[dict]:
    reservations = []
    for diner in dining_data.get("diners", []):
        for reservation in diner.get("reservations", []):
            try:
                # Parse the time for sorting
                time = parse_time(reservation["start_time"])
                reservations.append({
                    "diner_name": diner["name"],
                    "start_time": time.strftime("%I:%M %p").lstrip('0'),  # Convert to 12-hour format, remove leading 0
                    "number_of_people": reservation["number_of_people"],
                    "orders": reservation["orders"],
                    "allergies": "Loading...",  # Will be populated later
                    "_diner_data": diner,  # Temporary field for allergy extraction
                    "_reservation_data": reservation  # Temporary field for allergy extraction
                })
            except Exception as e:
                print(f"Error processing reservation for {diner['name']}: {e}")
    return reservations

async def assign_tables(waiter_ids: List[int], dining_data: dict) -> Dict[int, List[dict]]:
    reservations = extract_reservations(dining_data)
    
    # Prepare the prompt for OpenAI
    prompt = f"""Given the following waiters and reservations at French Laudure, assign tables to waiters optimally.
    
Waiters in attendance today:
{[get_waiter_name(wid) for wid in waiter_ids]}

Reservations:
{json.dumps(reservations, indent=2)}

Rules for assignment:
1. Each waiter should have an approximately even number of tables
2. Minimize time overlaps in each waiter's assignments
3. Consider the number of people
4. Return the assignments in JSON format with waiter_id as key and list of assigned reservations

Provide only the JSON response, no additional text."""

    try:
        print("\nPrompt sent to OpenAI:")
        print(prompt)

        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are a restaurant management AI that optimizes table assignments for waiters."
            }, {
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=2000
        )
        
        print("\nResponse from OpenAI:")
        response_text = response.choices[0].message.content.strip()
        print(response_text)
        
        # Parse the response and validate
        assignments = json.loads(response_text)
        print("\nParsed assignments:")
        print(json.dumps(assignments, indent=2))
        
        # Ensure all waiter IDs are present and have a list of assignments
        formatted_assignments = {}
        for waiter_id in waiter_ids:
            waiter_str_id = str(waiter_id)
            formatted_assignments[waiter_id] = assignments.get(waiter_str_id, [])
        
        print("\nFormatted assignments:")
        print(json.dumps(formatted_assignments, indent=2))
        
        return formatted_assignments
        
    except Exception as e:
        print(f"Error in OpenAI call: {e}")
        print("Falling back to round-robin assignment")
        # Fallback: Simple round-robin assignment
        assignments = {}
        for i, waiter_id in enumerate(waiter_ids):
            assignments[waiter_id] = reservations[i::len(waiter_ids)]
        print("\nRound-robin assignments:")
        print(json.dumps(assignments, indent=2))
        return assignments

# Define models
class WaiterAttendance(BaseModel):
    waiter_ids: List[int]

class Order(BaseModel):
    item: str
    dietary_tags: List[str]
    price: float

class Table(BaseModel):
    diner_name: str
    number_of_people: int
    start_time: str
    orders: List[Order]

class TableAssignment(BaseModel):
    waiter_id: int
    waiter_name: str
    tables: List[Table]

class TableAssignmentResponse(BaseModel):
    assignments: List[TableAssignment]
    message: str

@app.get("/")
async def root():
    return {"message": "Welcome to French Laudure API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Load fine dining dataset
@app.on_event("startup")
async def load_data():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "fine-dining-dataset-augmented.json")
    try:
        with open(dataset_path, "r") as f:
            app.state.dining_data = json.load(f)
            print(f"Loaded dataset from {dataset_path}")
    except FileNotFoundError as e:
        print(f"Error loading dataset: {e}")
        # Initialize with empty data to prevent crashes
        app.state.dining_data = {"diners": []}
    app.state.table_assignments = {}

async def detect_special_event(email_content: str) -> dict:
    if not email_content:
        return {"is_special_event": False, "event_type": None}

    prompt = f"""Analyze the following email content and determine if it indicates a special event/request (e.g., birthday, anniversary, business meeting). 
    If they have a special request (i.e. being in a rush) for the waiter to consider, return that as well.
    If it is a special event, respond with a JSON object containing 'is_special_event': true and 'event_type': <type>.
    If it is not a special event, respond with a JSON object containing 'is_special_event': false and 'event_type': null.

    Email Content:
    {email_content}
    """

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are a helpful assistant that detects special events from email content. Only respond with a JSON object."
            }, {
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=100
        )

        result = json.loads(response.choices[0].message.content)
        return {
            "is_special_event": result.get("is_special_event", False),
            "event_type": result.get("event_type")
        }
    except Exception as e:
        print(f"Error detecting special event: {e}")
        return {"is_special_event": False, "event_type": None}

@app.get("/daily-stats")
def get_daily_stats():
    if not hasattr(app.state, "dining_data"):
        return {
            "total_reservations": 0,
            "total_guests": 0,
            "special_events": 0
        }

    total_reservations = 0
    total_guests = 0
    special_events = 0

    # Process each diner's data
    for diner in app.state.dining_data.get("diners", []):
        # Count reservations and guests
        reservations = diner.get("reservations", [])
        total_reservations += len(reservations)
        total_guests += sum(r.get("number_of_people", 0) for r in reservations)

    # Get special events count from cache
    if hasattr(app.state, "special_events_cache"):
        special_events = sum(1 for value in app.state.special_events_cache.values() if value is not None)

    return {
        "total_reservations": total_reservations,
        "total_guests": total_guests,
        "special_events": special_events
    }

@app.get("/dining-data")
async def get_dining_data():
    return app.state.dining_data

# Initialize waiter attendance state
@app.on_event("startup")
async def init_attendance():
    app.state.attendance = []

@app.post("/attendance")
async def update_attendance(attendance: WaiterAttendance):
    app.state.attendance = attendance.waiter_ids
    
    # Clear any existing assignments, summary cache, and diner reservations
    if hasattr(app.state, "table_assignments"):
        app.state.table_assignments = {}
    if hasattr(app.state, "waiter_summaries"):
        app.state.waiter_summaries = {}
    if hasattr(app.state, "diner_reservations"):
        app.state.diner_reservations = {}
    if hasattr(app.state, "summary_cache"):
        app.state.summary_cache = {}
    
    # When attendance is updated, reassign tables
    if hasattr(app.state, "dining_data"):
        assignments = await assign_tables(attendance.waiter_ids, app.state.dining_data)
        app.state.table_assignments = assignments
        
        formatted_assignments = []
        for waiter_id in attendance.waiter_ids:
            # Sort tables by time
            tables = sorted(
                assignments.get(waiter_id, []),
                key=lambda x: parse_time(x["start_time"]).strftime("%H:%M")
            )
            formatted_assignments.append({
                "waiter_id": waiter_id,
                "waiter_name": get_waiter_name(waiter_id),
                "tables": tables
            })
        
        return {
            "message": "Attendance updated and tables reassigned",
            "present_count": len(attendance.waiter_ids),
            "assignments": formatted_assignments
        }
    
    return {
        "message": "Attendance updated successfully",
        "present_count": len(attendance.waiter_ids)
    }

async def generate_waiter_summary(waiter_name: str, tables: List[dict]) -> str:
    if not tables:
        return "No tables assigned for today."
    # Gather detailed information from diner_reservations
    table_info = []
    total_guests = 0
    time_range = f"{tables[0]['start_time']} to {tables[-1]['start_time']}"
    for table in tables:
        diner_name = table['diner_name']
        if hasattr(app.state, 'diner_reservations') and diner_name in app.state.diner_reservations:
            diner_data = app.state.diner_reservations[diner_name]
            diner = diner_data['diner']
            reservation = diner_data['reservation']

            # Extract only relevant dietary information and special requests
            dietary_info = []
            special_requests = []
            
            # Process emails for dietary info and special requests
            for email in diner.get('emails', []):
                content = email.get('combined_thread', '')
                if 'allerg' in content.lower() or 'diet' in content.lower():
                    dietary_info.append(content)
                if 'special' in content.lower() or 'request' in content.lower():
                    special_requests.append(content)

            # Get dietary tags from orders
            dietary_tags = []
            for order in reservation.get('orders', []):
                dietary_tags.extend(order.get('dietary_tags', []))

            # Check for special events
            special_event = None
            if diner.get('emails'):
                # result = await detect_special_event(diner['emails'][0].get('combined_thread', ''))
                # if result['is_special_event']:
                special_event = diner['emails'][0].get('combined_thread', '') # result['event_type']

            table_info.append({
                'diner': diner_name,
                'time': reservation.get('start_time'),
                'guests': reservation.get('number_of_people', 0),
                'dietary_info': dietary_info,
                'dietary_tags': dietary_tags,
                'special_requests': special_requests,
                'special_event': special_event
            })
            total_guests += reservation.get('number_of_people', 0)

    # Create the prompt with the filtered data
    prompt = f"""As a restaurant manager, write a 2-3 sentence briefing for {waiter_name} about their tables for today. Here's the information:

    Overview:
    - {total_guests} total guests across {len(tables)} tables from {time_range}

    Table Details:
    {json.dumps([{
        'diner': info['diner'],
        'guests': info['guests'],
        'dietary_notes': info['dietary_info'],
        'special_requests': info['special_requests'],
        'special_event': info['special_event']
    } for info in table_info], indent=2)}

    Write a concise summary focusing on:
    1. Total guest count and timing
    2. Any dietary restrictions or allergies
    3. Any special events or requests
    4. Any expected large parties
    
    Make the summary organized and include bulleted points for the waiter to keep in mind.
    Keep it professional but friendly. End the summary with a "Good Luck!"."""
    print(f'Generating summary for {waiter_name}...')
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are a helpful restaurant manager providing concise briefings to waiters. Extract and summarize key information about allergies and special events from the raw data."
            }, {
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating waiter summary for {waiter_name}: {e}")
        return f"You have {total_guests} guests across {len(tables)} tables from {time_range}."

@app.get("/attendance")
async def get_attendance():
    try:
        if not hasattr(app.state, "attendance"):
            app.state.attendance = []
        
        # Include table assignments if they exist
        assignments = []
        if hasattr(app.state, "table_assignments") and app.state.table_assignments:
            # Initialize summary cache if it doesn't exist
            if not hasattr(app.state, "waiter_summaries"):
                app.state.waiter_summaries = {}
                
            for waiter_id in app.state.attendance:
                try:
                    # Sort tables by time
                    tables = sorted(
                        app.state.table_assignments.get(waiter_id, []),
                        key=lambda x: parse_time(x["start_time"]).strftime("%H:%M")
                    )
                    
                    # Initialize allergies as loading state
                    for table in tables:
                        if "_diner_data" in table and "_reservation_data" in table:
                            table["allergies"] = "Loading..."
                            # Keep the diner and reservation data for later use
                            if not hasattr(app.state, "diner_reservations"):
                                app.state.diner_reservations = {}
                            app.state.diner_reservations[table["diner_name"]] = {
                                "diner": table["_diner_data"],
                                "reservation": table["_reservation_data"]
                            }
                            # Remove temporary fields
                            del table["_diner_data"]
                            del table["_reservation_data"]
                    
                    waiter_name = get_waiter_name(waiter_id)
                    # Use cached summary if available
                    if waiter_id in app.state.waiter_summaries:
                        summary = app.state.waiter_summaries[waiter_id]
                    else:
                        # Generate new summary only if not cached
                        print(f"Debug: Generating summary for waiter {waiter_name}")
                        summary = await generate_waiter_summary(waiter_name, tables)
                        app.state.waiter_summaries[waiter_id] = summary
                    
                    assignment = {
                        "waiter_id": waiter_id,
                        "waiter_name": waiter_name,
                        "summary": summary,
                        "tables": tables
                    }
                    assignments.append(assignment)
                except Exception as e:
                    print(f"Debug: Error processing waiter {waiter_id}: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Error processing waiter {waiter_id}: {str(e)}")
        else:
            print("Debug: No table assignments found")
        
        response = {
            "waiter_ids": app.state.attendance,
            "assignments": assignments
        }
        return response
    except Exception as e:
        print(f"Debug: Error in get_attendance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/preferences/{diner_name}")
async def get_preferences(diner_name: str):
    # Initialize preferences cache if it doesn't exist
    if not hasattr(app.state, "preferences_cache"):
        app.state.preferences_cache = {}

    # Check cache first
    if diner_name in app.state.preferences_cache:
        return app.state.preferences_cache[diner_name]

    try:
        if not hasattr(app.state, "diner_reservations") or diner_name not in app.state.diner_reservations:
            raise HTTPException(status_code=404, detail="Diner not found")

        diner_data = app.state.diner_reservations[diner_name]
        reviews = diner_data["diner"].get("reviews", [])
        review_texts = [review.get("content", "") for review in reviews]

        if not review_texts:
            app.state.preferences_cache[diner_name] = {"preferences": []}
            return app.state.preferences_cache[diner_name]

        prompt = f"Based on these reviews from other restaurants: {' '.join(review_texts)}\n\nExtract dining preferences that would be relevant to a French fine dining restaurant. Only include preferences that are generalizable to French cuisine and fine dining. Format the response as a JSON array of strings, each string being a specific preference. If no relevant preferences are found, return an empty array."

        response = await openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are a helpful restaurant assistant that extracts generalized dining preferences from reviews. Only respond with a valid JSON array of strings."
            }, {
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=200
        )
        # print(f'Prompt: {prompt}')
        # print("\nResponse from OpenAI:")
        # print(response.choices[0].message.content)
        
        try:
            content = response.choices[0].message.content.strip()
            if not content.startswith('[') and not content.endswith(']'):
                content = f"[{content}]"
            preferences = json.loads(content)
            if not isinstance(preferences, list):
                preferences = []
            # Clean up preferences
            preferences = [p.strip('"') for p in preferences if isinstance(p, str)]
        except (json.JSONDecodeError, AttributeError, IndexError) as e:
            print(f"Error parsing preferences: {e}")
            print(f"Raw response: {response.choices[0].message.content if response.choices else 'No content'}")
            preferences = []
        app.state.preferences_cache[diner_name] = {"preferences": preferences}
        return app.state.preferences_cache[diner_name]
    except Exception as e:
        print(f"Error getting preferences: {str(e)}")
        app.state.preferences_cache[diner_name] = {"preferences": []}
        return app.state.preferences_cache[diner_name]

@app.get("/allergies/{diner_name}")
async def get_allergies(diner_name: str):
    try:
        if not hasattr(app.state, "diner_reservations") or diner_name not in app.state.diner_reservations:
            raise HTTPException(status_code=404, detail="Diner not found")

        diner_data = app.state.diner_reservations[diner_name]
        allergies = await extract_allergies(diner_data["diner"], diner_data["reservation"])

        # Initialize special events cache if it doesn't exist
        if not hasattr(app.state, "special_events_cache"):
            app.state.special_events_cache = {}

        # Check cache first
        if diner_name not in app.state.special_events_cache:
            # Get first email's content for special event detection
            emails = diner_data["diner"].get("emails", [])
            email_content = emails[0].get("combined_thread", "") if emails else ""
            result = await detect_special_event(email_content)
            app.state.special_events_cache[diner_name] = result["event_type"] if result["is_special_event"] else None

        return {
            "allergies": allergies,
            "special_event": app.state.special_events_cache[diner_name]
        }
    except Exception as e:
        print(f"Error getting allergies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
