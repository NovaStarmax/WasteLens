import os

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": os.getenv("VERSION", "unknown"),
        "environment": os.getenv("ENVIRONMENT", "unknown"),
    }
