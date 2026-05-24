import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer()


def authenticate_user(username: str, password: str) -> str:
    expected_username = os.getenv("APP_USERNAME")
    stored_hash = os.getenv("APP_PASSWORD_HASH")

    if not expected_username or not stored_hash:
        raise HTTPException(status_code=500, detail="Authentication is not configured.")

    if username != expected_username:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    try:
        password_valid = bcrypt.checkpw(
            password.encode("utf-8"),
            stored_hash.encode("utf-8"),
        )
    except ValueError:
        raise HTTPException(status_code=500, detail="Authentication is misconfigured.")

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    return username


def create_access_token(data: dict) -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured.")

    expire_hours = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=expire_hours)

    return jwt.encode(payload, secret, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    try:
        payload = jwt.decode(
            credentials.credentials,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
