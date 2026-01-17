from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.middleware.jwt_auth import get_password_hash, verify_password, create_access_token
from app.models.user import UserCreate, UserInDB


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    async def register_user(user_data: UserCreate) -> dict:
        """
        Register a new user.
        
        Args:
            user_data: User registration data
            
        Returns:
            Created user document
            
        Raises:
            HTTPException: If email already exists
        """
        db = get_database()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user document
        user_in_db = UserInDB(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            name=user_data.name,
            created_at=datetime.utcnow()
        )
        
        # Insert user into database
        result = await db.users.insert_one(user_in_db.model_dump())
        
        # Get the created user
        created_user = await db.users.find_one({"_id": result.inserted_id})
        created_user["_id"] = str(created_user["_id"])
        
        return created_user
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[dict]:
        """
        Authenticate a user by email and password.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            User document if authenticated, None otherwise
        """
        db = get_database()
        
        user = await db.users.find_one({"email": email})
        if not user:
            return None
        
        if not verify_password(password, user["password_hash"]):
            return None
        
        user["_id"] = str(user["_id"])
        return user
    
    @staticmethod
    def create_user_token(user_id: str, email: str) -> str:
        """
        Create JWT token for a user.
        
        Args:
            user_id: User ID
            email: User email
            
        Returns:
            JWT access token
        """
        return create_access_token(
            data={"sub": user_id, "email": email}
        )
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[dict]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User document if found, None otherwise
        """
        db = get_database()
        
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except:
            return None
