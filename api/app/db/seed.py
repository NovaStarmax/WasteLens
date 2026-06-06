import logging
import os

import bcrypt
from sqlalchemy import func, select

from app.db.base import AsyncSessionLocal
from app.db.models import User

logger = logging.getLogger(__name__)


async def create_admin_if_empty() -> None:
    async with AsyncSessionLocal() as session:
        count = await session.scalar(select(func.count()).select_from(User))
        if count and count > 0:
            logger.info("Admin already exists — skipping seed.")
            return

        raw_password = os.getenv("ADMIN_PASSWORD", "wastelens2026")
        password_hash = bcrypt.hashpw(raw_password.encode(), bcrypt.gensalt(rounds=12)).decode()

        admin = User(
            username=os.getenv("ADMIN_USERNAME", "admin"),
            password_hash=password_hash,
            role="admin",
        )
        session.add(admin)
        await session.commit()
        logger.info("Admin user created.")
