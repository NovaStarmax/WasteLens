import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer()


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
