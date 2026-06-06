import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limiter import limiter
from app.core.security import authenticate_user, create_access_token
from app.db.base import get_db
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
        429: {"description": "Too many requests"},
        500: {"description": "Auth misconfigured"},
    },
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    user = await authenticate_user(body.username, body.password, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = create_access_token(user)
    expires_in = int(os.getenv("JWT_EXPIRE_HOURS", "24")) * 3600
    return TokenResponse(access_token=token, token_type="bearer", expires_in=expires_in)
