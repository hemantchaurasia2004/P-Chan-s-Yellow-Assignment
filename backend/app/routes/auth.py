from fastapi import APIRouter, HTTPException, status, Depends

from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.middleware.jwt_auth import get_current_user

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user account.
    
    - **email**: Valid email address (must be unique)
    - **password**: Password (minimum 6 characters)
    - **name**: User's display name
    """
    user = await AuthService.register_user(user_data)
    
    # Create token for immediate login
    token = AuthService.create_user_token(user["_id"], user["email"])
    
    return {
        "message": "User registered successfully",
        "user": {
            "_id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"]
        },
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """
    Authenticate user and return JWT token.
    
    - **email**: Registered email address
    - **password**: Account password
    """
    user = await AuthService.authenticate_user(credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = AuthService.create_user_token(user["_id"], user["email"])
    
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get the currently authenticated user's information.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse(
        _id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )
