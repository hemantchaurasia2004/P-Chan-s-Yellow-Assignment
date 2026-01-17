from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


class ChatMessage(BaseModel):
    """Schema for a single chat message."""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    """Schema for chat request."""
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None  # If None, creates new session


class ChatResponse(BaseModel):
    """Schema for chat response."""
    session_id: str
    message: ChatMessage
    project_id: str


class ChatSession(BaseModel):
    """Schema for chat session stored in database."""
    project_id: str
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class ChatSessionResponse(BaseModel):
    """Schema for chat session response."""
    id: str = Field(..., alias="_id")
    project_id: str
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class ChatSessionSummary(BaseModel):
    """Schema for chat session list item."""
    id: str = Field(..., alias="_id")
    project_id: str
    message_count: int
    last_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


# File Models
class FileUploadResponse(BaseModel):
    """Schema for file upload response."""
    id: str = Field(..., alias="_id")
    project_id: str
    filename: str
    openai_file_id: str
    purpose: str
    size_bytes: Optional[int] = None
    uploaded_at: datetime
    
    class Config:
        populate_by_name = True


class FileInDB(BaseModel):
    """Schema for file stored in database."""
    project_id: str
    filename: str
    openai_file_id: str
    purpose: str = "assistants"
    size_bytes: Optional[int] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
