from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from typing import Optional
from app.config import settings


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[Database] = None


db = MongoDB()


async def connect_to_mongo():
    """Create database connection."""
    try:
        db.client = AsyncIOMotorClient(
            settings.mongo_connection_string,
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )
        db.database = db.client[settings.database_name]
        
        # Test connection
        await db.client.admin.command('ping')
        
        # Create indexes for better query performance
        await create_indexes()
        
        print(f"Connected to MongoDB: {settings.database_name}")
    except Exception as e:
        print(f"WARNING: Could not connect to MongoDB: {e}")
        print("The application will start but database operations will fail.")
        print("Please ensure MongoDB is running and accessible.")


async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")


async def create_indexes():
    """Create database indexes for performance."""
    # Users collection
    await db.database.users.create_index("email", unique=True)
    
    # Projects collection
    await db.database.projects.create_index("user_id")
    await db.database.projects.create_index([("user_id", 1), ("created_at", -1)])
    
    # Prompts collection
    await db.database.prompts.create_index("project_id")
    
    # Chat sessions collection
    await db.database.chat_sessions.create_index("project_id")
    await db.database.chat_sessions.create_index([("project_id", 1), ("created_at", -1)])
    
    # Files collection
    await db.database.files.create_index("project_id")


def get_database() -> Database:
    """Get database instance."""
    return db.database
