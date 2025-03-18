# French Laudure

A modern fine dining restaurant management system built with TypeScript, React, Remix, and FastAPI. Features AI-powered table assignments and staff management.

## Tech Stack

- **Frontend**
  - TypeScript
  - React
  - Remix
  - Tailwind CSS

- **Backend**
  - Python
  - FastAPI
  - OpenAI API

## Setup

1. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## API Endpoints

### Staff and Table Management
- `GET /attendance`: Get current staff attendance and table assignments
- `POST /attendance`: Update staff attendance and trigger AI table reassignment
- `GET /dining-data`: Get restaurant dining data
- `GET /daily-stats`: Get daily statistics including total reservations and guests

### Customer Information
- `GET /allergies/{diner_name}`: Get allergy information for a specific diner
- `GET /preferences/{diner_name}`: Get dining preferences and special requests for a specific diner

### Health Check
- `GET /`: Root endpoint, returns server status
- `GET /health`: Health check endpoint

## Development

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:8000`
- Uses CORS for local development

## Contributing

Please ensure you have read the documentation and tested your changes before submitting a pull request.
