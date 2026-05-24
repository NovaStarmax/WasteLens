import os

from fastapi import APIRouter

from app.core.security import authenticate_user, create_access_token
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate with username and password. Returns a JWT valid for 24 hours.",
    response_description="JWT access token",
    responses={
        401: {"description": "Invalid credentials"},
        500: {"description": "Auth misconfigured"},
    },
)
def login(body: LoginRequest) -> TokenResponse:
    authenticate_user(body.username, body.password)
    token = create_access_token({"sub": body.username})
    expires_in = int(os.getenv("JWT_EXPIRE_HOURS", "24")) * 3600

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
    )
