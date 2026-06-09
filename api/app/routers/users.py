import uuid

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_role
from app.db.base import get_db
from app.db.models import Prediction, User
from app.schemas.users import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "",
    response_model=list[UserResponse],
    summary="List all users (admin)",
    responses={
        401: {"description": "Token expired or invalid"},
        403: {"description": "Requires admin role"},
    },
)
async def list_users(
    _: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post(
    "",
    response_model=UserResponse,
    status_code=201,
    summary="Create a user (admin)",
    responses={
        401: {"description": "Token expired or invalid"},
        403: {"description": "Requires admin role"},
        409: {"description": "Username already exists"},
    },
)
async def create_user(
    body: UserCreate,
    _: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already exists.")
    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(rounds=12)).decode()
    user = User(username=body.username, password_hash=password_hash, role=body.role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=204,
    summary="Delete a user (admin)",
    responses={
        401: {"description": "Token expired or invalid"},
        403: {"description": "Requires admin role or self-deletion attempt"},
        404: {"description": "User not found"},
    },
)
async def delete_user(
    user_id: uuid.UUID,
    payload: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> Response:
    if str(user_id) == payload.get("user_id"):
        raise HTTPException(status_code=403, detail="Cannot delete your own account.")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    await db.execute(delete(Prediction).where(Prediction.user_id == user_id))
    await db.delete(user)
    await db.commit()
    return Response(status_code=204)
