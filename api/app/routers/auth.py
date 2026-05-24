import os

import bcrypt
from fastapi import APIRouter, HTTPException

from app.core.security import create_access_token
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
    expected_username = os.getenv("APP_USERNAME")
    stored_hash = os.getenv("APP_PASSWORD_HASH")

    if not expected_username or not stored_hash:
        raise HTTPException(status_code=500, detail="Authentication is not configured.")

    if body.username != expected_username:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    try:
        password_valid = bcrypt.checkpw(
            body.password.encode("utf-8"),
            stored_hash.encode("utf-8"),
        )
    except ValueError:
        raise HTTPException(status_code=500, detail="Authentication is misconfigured.")

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    token = create_access_token({"sub": body.username})
    expires_in = int(os.getenv("JWT_EXPIRE_HOURS", "24")) * 3600

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
    )
