from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
from bson import ObjectId

from app.database import get_database
from app.middleware.jwt_auth import get_current_user
from app.services.file_service import get_file_service
from app.models.chat import FileUploadResponse

router = APIRouter()


@router.post("/projects/{project_id}/files", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a file to a project using OpenAI Files API.
    
    Supported file types depend on the purpose. For assistants:
    - Text files (.txt, .md, .json, .csv, etc.)
    - PDFs
    - Code files
    
    Max file size: 512 MB
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
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")
    
    try:
        file_service = get_file_service()
        uploaded_file = await file_service.upload_file(
            file=file,
            project_id=project_id,
            purpose="assistants"
        )
        
        return FileUploadResponse(**uploaded_file)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )


@router.get("/projects/{project_id}/files", response_model=List[FileUploadResponse])
async def list_project_files(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all files uploaded to a project.
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
        file_service = get_file_service()
        files = await file_service.list_project_files(project_id)
        
        return [FileUploadResponse(**f) for f in files]
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a file from the project and OpenAI.
    """
    try:
        file_service = get_file_service()
        await file_service.delete_file(file_id, current_user["_id"])
        return None
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
