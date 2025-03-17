from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import json
import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

app = FastAPI(title="French Laudure API")

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
        1: "Jean-Pierre Dubois",
        2: "Marie-Claire Laurent",
        3: "François Moreau",
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
                    "orders": reservation["orders"]
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
3. Consider the number of people and complexity of orders
4. Return the assignments in JSON format with waiter_id as key and list of assigned reservations

Provide only the JSON response, no additional text."""

    try:
        response = await openai.ChatCompletion.acreate(
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
        
        # Parse the response and validate
        assignments = json.loads(response.choices[0].message.content)
        return assignments
        
    except Exception as e:
        print(f"Error in OpenAI call: {e}")
        # Fallback: Simple round-robin assignment
        assignments = {}
        for i, waiter_id in enumerate(waiter_ids):
            assignments[waiter_id] = reservations[i::len(waiter_ids)]
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

@app.get("/attendance")
async def get_attendance():
    if not hasattr(app.state, "attendance"):
        app.state.attendance = []
    
    # Include table assignments if they exist
    assignments = []
    if hasattr(app.state, "table_assignments"):
        for waiter_id in app.state.attendance:
            # Sort tables by time
            tables = sorted(
                app.state.table_assignments.get(waiter_id, []),
                key=lambda x: parse_time(x["start_time"]).strftime("%H:%M")
            )
            assignments.append({
                "waiter_id": waiter_id,
                "waiter_name": get_waiter_name(waiter_id),
                "tables": tables
            })
    
    return {
        "waiter_ids": app.state.attendance,
        "assignments": assignments
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
