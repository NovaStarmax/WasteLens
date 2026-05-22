import io
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import bcrypt
import jwt
import pytest
from fastapi.testclient import TestClient
from PIL import Image

# Test credentials — set before importing app; python-dotenv does not override existing env vars by default
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpassword123"
TEST_JWT_SECRET = "test-jwt-secret-for-pytest-only-xx"  # 32+ bytes — avoids PyJWT InsecureKeyLengthWarning

os.environ["APP_USERNAME"] = TEST_USERNAME
os.environ["APP_PASSWORD_HASH"] = bcrypt.hashpw(
    TEST_PASSWORD.encode(), bcrypt.gensalt()
).decode()
os.environ["JWT_SECRET"] = TEST_JWT_SECRET
os.environ["JWT_EXPIRE_HOURS"] = "24"

from app.main import app  # noqa: E402


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
def client(mock_predict_service):
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def valid_token():
    payload = {
        "sub": TEST_USERNAME,
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
