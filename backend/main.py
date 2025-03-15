from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="French Laudure API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Remix default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to French Laudure API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Load fine dining dataset
@app.on_event("startup")
async def load_data():
    with open("../fine-dining-dataset.json", "r") as f:
        app.state.dining_data = json.load(f)

@app.get("/dining-data")
async def get_dining_data():
    return app.state.dining_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
