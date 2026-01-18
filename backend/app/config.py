from pydantic_settings import BaseSettings
from typing import List, Optional
from urllib.parse import quote_plus
import os


class Settings(BaseSettings):
    # MongoDB - use MONGODB_URL environment variable for production
    mongodb_url: Optional[str] = None
    mongodb_host: str = ""
    mongodb_username: str = ""
    mongodb_password: str = ""
    database_name: str = "chatbot_platform"
    
    @property
    def mongo_connection_string(self) -> str:
        """Build MongoDB connection string with properly encoded credentials."""
        if self.mongodb_url:
            return self._encode_mongodb_url(self.mongodb_url)
        
        if not all([self.mongodb_username, self.mongodb_password, self.mongodb_host]):
            raise ValueError("MongoDB credentials not configured. Set MONGODB_URL or individual credentials.")
        
        encoded_password = quote_plus(self.mongodb_password)
        return f"mongodb+srv://{self.mongodb_username}:{encoded_password}@{self.mongodb_host}/?appName=Cluster0"
    
    def _encode_mongodb_url(self, url: str) -> str:
        """Parse MongoDB URL and properly encode credentials."""
        if url.startswith('mongodb+srv://'):
            scheme = 'mongodb+srv://'
            rest = url[len(scheme):]
        elif url.startswith('mongodb://'):
            scheme = 'mongodb://'
            rest = url[len(scheme):]
        else:
            return url
        
        at_parts = rest.split('@')
        if len(at_parts) < 2:
            return url
        
        host_and_path = at_parts[-1]
        credentials = '@'.join(at_parts[:-1])
        
        if ':' in credentials:
            colon_idx = credentials.index(':')
            username = credentials[:colon_idx]
            password = credentials[colon_idx + 1:]
            
            encoded_username = quote_plus(username)
            encoded_password = quote_plus(password)
            
            return f"{scheme}{encoded_username}:{encoded_password}@{host_and_path}"
        
        return url
    
    # JWT - MUST be set via environment variable in production
    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # OpenAI
    openai_api_key: str = ""
    
    # Server
    port: int = 8000  # Render provides PORT env variable
    
    # CORS - add your frontend URL here
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
