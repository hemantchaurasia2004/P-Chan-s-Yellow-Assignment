from typing import List, Optional
from datetime import datetime
from openai import AsyncOpenAI
from fastapi import HTTPException, status, UploadFile
from bson import ObjectId

from app.config import settings
from app.database import get_database
from app.models.chat import FileInDB


class FileService:
    """Service class for file operations with OpenAI Files API."""
    
    def __init__(self):
        """Initialize OpenAI client."""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def upload_file(
        self,
        file: UploadFile,
        project_id: str,
        purpose: str = "assistants"
    ) -> dict:
        """
        Upload a file to OpenAI and store reference in database.
        
        Args:
            file: File to upload
            project_id: Project ID to associate file with
            purpose: OpenAI file purpose (assistants, fine-tune, etc.)
            
        Returns:
            File document with OpenAI file ID
            
        Raises:
            HTTPException: If upload fails
        """
        db = get_database()
        
        try:
            # Read file content
            content = await file.read()
            
            # Upload to OpenAI
            openai_file = await self.client.files.create(
                file=(file.filename, content),
                purpose=purpose
            )
            
            # Create file document
            file_doc = FileInDB(
                project_id=project_id,
                filename=file.filename,
                openai_file_id=openai_file.id,
                purpose=purpose,
                size_bytes=len(content),
                uploaded_at=datetime.utcnow()
            )
            
            # Store in database
            result = await db.files.insert_one(file_doc.model_dump())
            
            # Return created file document
            created_file = await db.files.find_one({"_id": result.inserted_id})
            created_file["_id"] = str(created_file["_id"])
            
            return created_file
        
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}"
            )
    
    async def list_project_files(self, project_id: str) -> List[dict]:
        """
        List all files for a project.
        
        Args:
            project_id: Project ID
            
        Returns:
            List of file documents
        """
        db = get_database()
        
        cursor = db.files.find({"project_id": project_id})
        files = await cursor.to_list(length=100)
        
        for f in files:
            f["_id"] = str(f["_id"])
        
        return files
    
    async def delete_file(self, file_id: str, user_id: str) -> bool:
        """
        Delete a file from OpenAI and database.
        
        Args:
            file_id: File ID (database ID)
            user_id: User ID (for ownership verification)
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If file not found or deletion fails
        """
        db = get_database()
        
        # Get file document
        file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
        if not file_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Verify project ownership
        project = await db.projects.find_one({"_id": ObjectId(file_doc["project_id"])})
        if not project or project["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this file"
            )
        
        try:
            # Delete from OpenAI
            await self.client.files.delete(file_doc["openai_file_id"])
        except Exception:
            # Continue even if OpenAI deletion fails (file might already be deleted)
            pass
        
        # Delete from database
        await db.files.delete_one({"_id": ObjectId(file_id)})
        
        return True
    
    async def get_file(self, file_id: str) -> Optional[dict]:
        """
        Get a file document by ID.
        
        Args:
            file_id: File ID
            
        Returns:
            File document if found
        """
        db = get_database()
        
        try:
            file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
            if file_doc:
                file_doc["_id"] = str(file_doc["_id"])
            return file_doc
        except:
            return None


# Singleton instance
_file_service: Optional[FileService] = None


def get_file_service() -> FileService:
    """Get or create file service instance."""
    global _file_service
    
    if _file_service is None:
        _file_service = FileService()
    
    return _file_service
