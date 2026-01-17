# Chatbot Platform

A minimal chatbot platform built for **Yellow.ai Internship Assignment**. This platform allows users to create AI-powered conversational agents with custom prompts and file support.

## Features

- **User Authentication**: JWT-based authentication with user registration and login
- **Project/Agent Management**: Create and manage multiple AI agent projects
- **Custom Prompts**: Store and associate prompts with projects to customize agent behavior
- **Chat Interface**: Real-time chat with AI agents powered by OpenAI
- **File Upload**: Upload files to OpenAI for document-based context (using OpenAI Files API)
- **Session Management**: Maintain conversation history across chat sessions

## Tech Stack

### Backend
- **Python 3.11+** with **FastAPI** - High-performance async web framework
- **MongoDB** with **Motor** - Async database driver
- **JWT Authentication** - Secure token-based auth with python-jose
- **OpenAI SDK** - GPT-4o-mini integration for chat completions

### Frontend
- **React 18** - Modern UI library
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client for API calls
- **Vite** - Fast development server and build tool

## Project Structure

```
chatbot-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Environment configuration
│   │   ├── database.py          # MongoDB connection
│   │   ├── models/              # Pydantic schemas
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   └── middleware/          # JWT authentication
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer
│   │   └── context/             # React context providers
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- MongoDB (local or cloud instance)
- OpenAI API key

## Setup Instructions

### 1. Clone and Navigate

```bash
cd "Yellow.ai Assignment"
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Or create manually with the following content:
```

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=chatbot_platform

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

```bash
# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. MongoDB Setup

#### Option A: Local MongoDB
- Install MongoDB Community Edition
- Start MongoDB service
- The app will automatically create the database

#### Option B: MongoDB Atlas (Cloud)
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Get your connection string
- Update `MONGODB_URL` in your `.env` file

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/{id}` | Get project details |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |

### Prompts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/{id}/prompts` | Add prompt |
| GET | `/api/projects/{id}/prompts` | List prompts |
| PUT | `/api/projects/prompts/{id}` | Update prompt |
| DELETE | `/api/projects/prompts/{id}` | Delete prompt |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/{id}/chat` | Send message |
| GET | `/api/projects/{id}/sessions` | List chat sessions |
| POST | `/api/projects/{id}/sessions` | Create new session |
| GET | `/api/projects/{id}/sessions/{sid}` | Get session details |
| DELETE | `/api/projects/{id}/sessions/{sid}` | Delete session |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/{id}/files` | Upload file |
| GET | `/api/projects/{id}/files` | List files |
| DELETE | `/api/files/{id}` | Delete file |

## Architecture Decisions

### Scalability
- **Async FastAPI**: All endpoints are async for handling concurrent requests
- **MongoDB Indexes**: Created on user_id, project_id for fast queries
- **Stateless Auth**: JWT tokens enable horizontal scaling

### Security
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: 24-hour expiry with secure secret key
- **Input Validation**: Pydantic models validate all inputs
- **CORS**: Configured allowed origins

### Extensibility
- **Service Layer**: Business logic separated from routes
- **Modular Routes**: Each feature in separate route files
- **Config Management**: Environment-based configuration

### Performance
- **Motor (Async MongoDB)**: Non-blocking database operations
- **OpenAI GPT-4o-mini**: Cost-effective, fast responses
- **React Optimizations**: Minimal re-renders, efficient state management

## Future Enhancements

- [ ] Real-time streaming responses
- [ ] Analytics dashboard
- [ ] Team collaboration features
- [ ] Custom model selection
- [ ] Webhook integrations
- [ ] Rate limiting
- [ ] API key management for projects

## License

This project is created for Yellow.ai internship evaluation purposes.

---

**Author**: Built as Yellow.ai Internship Assignment
**Date**: January 2026
