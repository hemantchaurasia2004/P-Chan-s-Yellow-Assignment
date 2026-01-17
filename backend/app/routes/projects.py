from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.middleware.jwt_auth import get_current_user
from app.models.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    PromptCreate, PromptUpdate, PromptResponse
)

router = APIRouter()


# ============== Project CRUD ==============

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new project/agent.
    
    - **name**: Project name
    - **description**: Optional project description
    - **system_prompt**: System prompt for the AI agent
    """
    db = get_database()
    
    project_doc = {
        "user_id": current_user["_id"],
        "name": project_data.name,
        "description": project_data.description,
        "system_prompt": project_data.system_prompt or "You are a helpful AI assistant.",
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    result = await db.projects.insert_one(project_doc)
    created_project = await db.projects.find_one({"_id": result.inserted_id})
    created_project["_id"] = str(created_project["_id"])
    
    return ProjectResponse(**created_project)


@router.get("", response_model=List[ProjectResponse])
async def list_projects(current_user: dict = Depends(get_current_user)):
    """
    List all projects for the current user.
    """
    db = get_database()
    
    cursor = db.projects.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    projects = await cursor.to_list(length=100)
    
    for project in projects:
        project["_id"] = str(project["_id"])
    
    return [ProjectResponse(**p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific project by ID.
    """
    db = get_database()
    
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    project["_id"] = str(project["_id"])
    return ProjectResponse(**project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a project.
    """
    db = get_database()
    
    # Check project exists and belongs to user
    try:
        existing = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Build update document
    update_data = {"updated_at": datetime.utcnow()}
    
    if project_data.name is not None:
        update_data["name"] = project_data.name
    if project_data.description is not None:
        update_data["description"] = project_data.description
    if project_data.system_prompt is not None:
        update_data["system_prompt"] = project_data.system_prompt
    
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    
    updated = await db.projects.find_one({"_id": ObjectId(project_id)})
    updated["_id"] = str(updated["_id"])
    
    return ProjectResponse(**updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a project and all associated data.
    """
    db = get_database()
    
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": current_user["_id"]
        })
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID")
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Delete associated data
    await db.prompts.delete_many({"project_id": project_id})
    await db.chat_sessions.delete_many({"project_id": project_id})
    await db.files.delete_many({"project_id": project_id})
    
    # Delete project
    await db.projects.delete_one({"_id": ObjectId(project_id)})
    
    return None


# ============== Prompt CRUD ==============

@router.post("/{project_id}/prompts", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    project_id: str,
    prompt_data: PromptCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new prompt for a project.
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
    
    prompt_doc = {
        "project_id": project_id,
        "name": prompt_data.name,
        "content": prompt_data.content,
        "is_active": prompt_data.is_active,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    result = await db.prompts.insert_one(prompt_doc)
    created = await db.prompts.find_one({"_id": result.inserted_id})
    created["_id"] = str(created["_id"])
    
    return PromptResponse(**created)


@router.get("/{project_id}/prompts", response_model=List[PromptResponse])
async def list_prompts(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all prompts for a project.
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
    
    cursor = db.prompts.find({"project_id": project_id}).sort("created_at", -1)
    prompts = await cursor.to_list(length=100)
    
    for prompt in prompts:
        prompt["_id"] = str(prompt["_id"])
    
    return [PromptResponse(**p) for p in prompts]


@router.put("/prompts/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: str,
    prompt_data: PromptUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a prompt.
    """
    db = get_database()
    
    # Get prompt and verify ownership
    try:
        prompt = await db.prompts.find_one({"_id": ObjectId(prompt_id)})
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid prompt ID")
    
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
    
    # Verify project ownership
    project = await db.projects.find_one({
        "_id": ObjectId(prompt["project_id"]),
        "user_id": current_user["_id"]
    })
    
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Build update document
    update_data = {"updated_at": datetime.utcnow()}
    
    if prompt_data.name is not None:
        update_data["name"] = prompt_data.name
    if prompt_data.content is not None:
        update_data["content"] = prompt_data.content
    if prompt_data.is_active is not None:
        update_data["is_active"] = prompt_data.is_active
    
    await db.prompts.update_one(
        {"_id": ObjectId(prompt_id)},
        {"$set": update_data}
    )
    
    updated = await db.prompts.find_one({"_id": ObjectId(prompt_id)})
    updated["_id"] = str(updated["_id"])
    
    return PromptResponse(**updated)


@router.delete("/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a prompt.
    """
    db = get_database()
    
    # Get prompt and verify ownership
    try:
        prompt = await db.prompts.find_one({"_id": ObjectId(prompt_id)})
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid prompt ID")
    
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
    
    # Verify project ownership
    project = await db.projects.find_one({
        "_id": ObjectId(prompt["project_id"]),
        "user_id": current_user["_id"]
    })
    
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await db.prompts.delete_one({"_id": ObjectId(prompt_id)})
    
    return None
