from pydantic_settings import BaseSettings
from typing import List, Optional
from urllib.parse import quote_plus, urlparse, urlunparse
import re
import os


class Settings(BaseSettings):
    # MongoDB - can use full URL or separate credentials
    mongodb_url: Optional[str] = None
    mongodb_host: str = "cluster0.xsx8m4x.mongodb.net"
    mongodb_username: str = "sharmapriyanshi178"
    mongodb_password: str = "@Ps8700067157"
    database_name: str = "chatbot_platform"
    
    @property
    def mongo_connection_string(self) -> str:
        """Build MongoDB connection string with properly encoded credentials."""
        if self.mongodb_url:
            # Parse and re-encode the URL to handle special characters
            return self._encode_mongodb_url(self.mongodb_url)
        
        # URL-encode the password to handle special characters like @
        encoded_password = quote_plus(self.mongodb_password)
        return f"mongodb+srv://{self.mongodb_username}:{encoded_password}@{self.mongodb_host}/?appName=Cluster0"
    
    def _encode_mongodb_url(self, url: str) -> str:
        """Parse MongoDB URL and properly encode credentials."""
        # Match mongodb:// or mongodb+srv:// URLs
        # Pattern: mongodb+srv://username:password@host/...
        # The password can contain @ so we need to find the LAST @ before the host
        
        # Check for mongodb:// or mongodb+srv://
        if url.startswith('mongodb+srv://'):
            scheme = 'mongodb+srv://'
            rest = url[len(scheme):]
        elif url.startswith('mongodb://'):
            scheme = 'mongodb://'
            rest = url[len(scheme):]
        else:
            return url
        
        # Find credentials - look for @ that separates credentials from host
        # The host typically contains dots (like cluster0.abc.mongodb.net)
        # We find the last @ before any / or ? query params
        
        # Split by @ to find where credentials end and host begins
        at_parts = rest.split('@')
        if len(at_parts) < 2:
            return url  # No credentials
        
        # The last part is the host, everything before is username:password
        host_and_path = at_parts[-1]
        credentials = '@'.join(at_parts[:-1])  # Rejoin in case password has @
        
        # Split credentials into username and password
        if ':' in credentials:
            colon_idx = credentials.index(':')
            username = credentials[:colon_idx]
            password = credentials[colon_idx + 1:]
            
            # URL-encode username and password
            encoded_username = quote_plus(username)
            encoded_password = quote_plus(password)
            
            return f"{scheme}{encoded_username}:{encoded_password}@{host_and_path}"
        
        return url
    
    # JWT
    jwt_secret_key: str = "your-super-secret-jwt-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # OpenAI
    openai_api_key: str = ""
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
