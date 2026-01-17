from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.middleware.jwt_auth import get_current_user
from app.services.openai_service import get_openai_service
from app.models.chat import (
    ChatRequest, ChatResponse, ChatMessage,
    ChatSessionResponse, ChatSessionSummary
)

router = APIRouter()


@router.post("/projects/{project_id}/chat", response_model=ChatResponse)
async def send_chat_message(
    project_id: str,
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to the project's AI agent and get a response.
    
    - **message**: User's message
    - **session_id**: Optional session ID (creates new session if not provided)
    """
    db = get_database()
    
    # Verify project ownership
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Get or create session
    session_id = chat_request.session_id
    
    if session_id:
        try:
            session = await db.chat_sessions.find_one({
                "_id": ObjectId(session_id),
                "project_id": project_id
            })
        except:
            session = None
        
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
        messages = [ChatMessage(**msg) for msg in session.get("messages", [])]
    else:
        # Create new session
        session_doc = {
            "project_id": project_id,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": None
        }
        result = await db.chat_sessions.insert_one(session_doc)
        session_id = str(result.inserted_id)
        messages = []
    
    # Add user message
    user_message = ChatMessage(
        role="user",
        content=chat_request.message,
        timestamp=datetime.utcnow()
    )
    messages.append(user_message)
    
    # Get AI response
    try:
        openai_service = get_openai_service()
        
        # Get active prompts to enhance system prompt
        active_prompts = await db.prompts.find({
            "project_id": project_id,
            "is_active": True
        }).to_list(length=10)
        
        # Build system prompt with active prompts
        system_prompt = project["system_prompt"]
        if active_prompts:
            prompt_context = "\n\n".join([
                f"[{p['name']}]: {p['content']}" for p in active_prompts
            ])
            system_prompt = f"{system_prompt}\n\nAdditional context:\n{prompt_context}"
        
        ai_response_text = await openai_service.generate_chat_response(
            messages=messages,
            system_prompt=system_prompt
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    
    # Create assistant message
    assistant_message = ChatMessage(
        role="assistant",
        content=ai_response_text,
        timestamp=datetime.utcnow()
    )
    messages.append(assistant_message)
    
    # Update session
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "messages": [msg.model_dump() for msg in messages],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return ChatResponse(
        session_id=session_id,
        message=assistant_message,
        project_id=project_id
    )


@router.get("/projects/{project_id}/sessions", response_model=List[ChatSessionSummary])
async def list_chat_sessions(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all chat sessions for a project.
    """
    db = get_database()
    
    # Verify project ownership
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    cursor = db.chat_sessions.find({"project_id": project_id}).sort("created_at", -1)
    sessions = await cursor.to_list(length=50)
    
    result = []
    for session in sessions:
        messages = session.get("messages", [])
        last_message = None
        if messages:
            # Get the last user message for preview
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    last_message = msg.get("content", "")[:100]
                    break
        
        result.append(ChatSessionSummary(
            _id=str(session["_id"]),
            project_id=session["project_id"],
            message_count=len(messages),
            last_message=last_message,
            created_at=session["created_at"],
            updated_at=session.get("updated_at")
        ))
    
    return result


@router.post("/projects/{project_id}/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new chat session for a project.
    """
    db = get_database()
    
    # Verify project ownership
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    session_doc = {
        "project_id": project_id,
        "messages": [],
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    result = await db.chat_sessions.insert_one(session_doc)
    created = await db.chat_sessions.find_one({"_id": result.inserted_id})
    created["_id"] = str(created["_id"])
    
    return ChatSessionResponse(**created)


@router.get("/projects/{project_id}/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    project_id: str,
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific chat session with all messages.
    """
    db = get_database()
    
    # Verify project ownership
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    try:
        session = await db.chat_sessions.find_one({
            "_id": ObjectId(session_id),
            "project_id": project_id
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID")
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    session["_id"] = str(session["_id"])
    
    return ChatSessionResponse(**session)


@router.delete("/projects/{project_id}/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    project_id: str,
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a chat session.
    """
    db = get_database()
    
    # Verify project ownership
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    try:
        result = await db.chat_sessions.delete_one({
            "_id": ObjectId(session_id),
            "project_id": project_id
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    return None
