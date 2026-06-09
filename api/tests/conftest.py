import io
import os
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import bcrypt
import jwt
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession

TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpassword123"
TEST_JWT_SECRET = "test-jwt-secret-for-pytest-only-xx"
TEST_USER_ID = "12345678-1234-5678-1234-567812345678"
TEST_USER_ROLE = "admin"

os.environ["JWT_SECRET"] = TEST_JWT_SECRET
os.environ["JWT_EXPIRE_HOURS"] = "24"

from app.main import app  # noqa: E402
from app.db.base import get_db  # noqa: E402


@pytest.fixture(scope="session")
def mock_admin_user():
    user = MagicMock()
    user.id = uuid.UUID(TEST_USER_ID)
    user.username = TEST_USERNAME
    user.password_hash = bcrypt.hashpw(TEST_PASSWORD.encode(), bcrypt.gensalt()).decode()
    user.role = TEST_USER_ROLE
    return user


@pytest.fixture(scope="session")
def mock_standard_user():
    user = MagicMock()
    user.id = uuid.uuid4()
    user.username = "standarduser"
    user.password_hash = bcrypt.hashpw(b"standardpassword", bcrypt.gensalt()).decode()
    user.role = "user"
    return user


@pytest.fixture(scope="session")
def mock_db(mock_admin_user):
    session = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_admin_user
    mock_result.scalars.return_value.all.return_value = []
    mock_result.scalar.return_value = 0
    session.execute = AsyncMock(return_value=mock_result)
    return session


@pytest.fixture(scope="session")
def mock_predict_service():
    """Patches ModelService.get_instance() for the whole session — no real ResNet loaded."""
    mock_service = MagicMock()
    mock_service.predict.return_value = {
        "predicted_class": "plastic",
        "confidence": 0.9876,
        "bin_recommendation": "yellow bin",
    }
    with patch("app.services.model.ModelService.get_instance", return_value=mock_service):
        yield mock_service


@pytest.fixture(scope="session")
def client(mock_predict_service, mock_db):
    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    mock_conn = AsyncMock()
    mock_conn.run_sync = AsyncMock()
    mock_cm = MagicMock()
    mock_cm.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_cm.__aexit__ = AsyncMock(return_value=False)

    with patch("app.main.engine") as mock_engine, \
         patch("app.main.create_admin_if_empty", new_callable=AsyncMock):
        mock_engine.begin.return_value = mock_cm
        with TestClient(app) as c:
            yield c

    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def valid_token():
    payload = {
        "sub": TEST_USERNAME,
        "user_id": TEST_USER_ID,
        "role": TEST_USER_ROLE,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture(scope="session")
def user_token():
    payload = {
        "sub": "standarduser",
        "user_id": str(uuid.uuid4()),
        "role": "user",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture(scope="session")
def expired_token():
    payload = {
        "sub": TEST_USERNAME,
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture(scope="session")
def valid_png_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color=(100, 150, 200)).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="session")
def pdf_bytes():
    return b"%PDF-1.4 fake pdf content"


@pytest.fixture(scope="session")
def oversized_png_bytes():
    # PNG magic bytes + zero-padding just over 10 MB — fails the size check
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * (10 * 1024 * 1024 + 1)


@pytest.fixture(scope="session")
def corrupted_png_bytes():
    # No valid magic bytes — fails _check_magic() before PIL is even called
    return b"\x00" * 64
