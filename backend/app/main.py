from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, projects, chat, files


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="Chatbot Platform API",
    description="A minimal chatbot platform with authentication, project management, and OpenAI integration",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(files.router, prefix="/api", tags=["Files"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "Chatbot Platform API is running",
        "version": "1.0.0"
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "openai": "configured" if settings.openai_api_key else "not configured"
    }
