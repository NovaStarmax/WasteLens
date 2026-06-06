from fastapi import Depends, HTTPException, status

from app.core.security import verify_token


def require_role(role: str):
    def checker(payload: dict = Depends(verify_token)):
        if payload.get("role") != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {role} role",
            )
        return payload
    return checker
