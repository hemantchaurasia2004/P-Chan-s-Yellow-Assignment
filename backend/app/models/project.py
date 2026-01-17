from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProjectCreate(BaseModel):
    """Schema for creating a new project/agent."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    system_prompt: Optional[str] = Field(
        default="You are a helpful AI assistant.",
        description="System prompt that defines the agent's behavior"
    )


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    system_prompt: Optional[str] = None


class ProjectResponse(BaseModel):
    """Schema for project response."""
    id: str = Field(..., alias="_id")
    user_id: str
    name: str
    description: Optional[str] = None
    system_prompt: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class ProjectInDB(BaseModel):
    """Schema for project stored in database."""
    user_id: str
    name: str
    description: Optional[str] = None
    system_prompt: str = "You are a helpful AI assistant."
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# Prompt Models
class PromptCreate(BaseModel):
    """Schema for creating a new prompt."""
    name: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    is_active: bool = True


class PromptUpdate(BaseModel):
    """Schema for updating a prompt."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None
    is_active: Optional[bool] = None


class PromptResponse(BaseModel):
    """Schema for prompt response."""
    id: str = Field(..., alias="_id")
    project_id: str
    name: str
    content: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class PromptInDB(BaseModel):
    """Schema for prompt stored in database."""
    project_id: str
    name: str
    content: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
