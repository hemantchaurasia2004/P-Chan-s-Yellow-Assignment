from typing import List, Optional
from openai import AsyncOpenAI
from fastapi import HTTPException, status

from app.config import settings
from app.models.chat import ChatMessage


class OpenAIService:
    """Service class for OpenAI API operations."""
    
    def __init__(self):
        """Initialize OpenAI client."""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.default_model = "gpt-4o-mini"
    
    async def generate_chat_response(
        self,
        messages: List[ChatMessage],
        system_prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a chat response using OpenAI API.
        
        Args:
            messages: List of chat messages (conversation history)
            system_prompt: System prompt for the assistant
            model: Model to use (defaults to gpt-4o-mini)
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0-2)
            
        Returns:
            Assistant's response text
            
        Raises:
            HTTPException: If API call fails
        """
        try:
            # Build messages list for API
            api_messages = [{"role": "system", "content": system_prompt}]
            
            for msg in messages:
                api_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=model or self.default_model,
                messages=api_messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OpenAI API error: {str(e)}"
            )
    
    async def generate_chat_response_with_files(
        self,
        messages: List[ChatMessage],
        system_prompt: str,
        file_ids: List[str],
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a chat response with file context using OpenAI API.
        
        Note: This is a simplified implementation. For full file-based 
        conversations, consider using OpenAI Assistants API.
        
        Args:
            messages: List of chat messages
            system_prompt: System prompt for the assistant
            file_ids: List of OpenAI file IDs for context
            model: Model to use
            max_tokens: Maximum tokens in response
            temperature: Response randomness
            
        Returns:
            Assistant's response text
        """
        # For now, we'll use the regular chat completion
        # File context would typically be handled via Assistants API
        enhanced_system_prompt = system_prompt
        if file_ids:
            enhanced_system_prompt += f"\n\n[Note: This conversation has {len(file_ids)} associated files for context.]"
        
        return await self.generate_chat_response(
            messages=messages,
            system_prompt=enhanced_system_prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature
        )


# Singleton instance
_openai_service: Optional[OpenAIService] = None


def get_openai_service() -> OpenAIService:
    """Get or create OpenAI service instance."""
    global _openai_service
    
    if _openai_service is None:
        _openai_service = OpenAIService()
    
    return _openai_service
