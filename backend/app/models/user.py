from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom type for MongoDB ObjectId."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, handler):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    name: str = Field(..., min_length=2, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (excludes password)."""
    id: str = Field(..., alias="_id")
    email: EmailStr
    name: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class UserInDB(BaseModel):
    """Schema for user stored in database."""
    email: EmailStr
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for decoded token data."""
    user_id: Optional[str] = None
    email: Optional[str] = None
