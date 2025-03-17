# French Laudure

A modern fine dining restaurant management system built with TypeScript, React, Remix, and FastAPI. Features AI-powered table assignments and staff management.

## Features

- **Staff Management**
  - Real-time attendance tracking
  - AI-powered table assignments
  - Elegant UI with responsive design
  - Detailed table and order information

- **AI Integration**
  - OpenAI GPT-4 for intelligent table distribution
  - Optimizes for:
    - Even distribution of tables
    - Minimized time overlaps
    - Party size and order complexity

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
  - SQLAlchemy

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

- `GET /attendance`: Get current staff attendance and table assignments
- `POST /attendance`: Update staff attendance and trigger AI table reassignment
- `GET /dining-data`: Get restaurant dining data

## Data Structure

The system uses a fine dining dataset that includes:
- Diner information
- Reservations
- Order details
- Dietary preferences

## Development

- Frontend runs on `http://localhost:5174`
- Backend runs on `http://localhost:8000`
- Uses CORS for local development

## Contributing

Please ensure you have read the documentation and tested your changes before submitting a pull request.
