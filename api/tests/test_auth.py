from unittest.mock import AsyncMock, patch

import jwt

from tests.conftest import TEST_JWT_SECRET, TEST_PASSWORD, TEST_USER_ID, TEST_USER_ROLE, TEST_USERNAME


def test_login_valid_returns_token(client):
    response = client.post("/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert isinstance(data["expires_in"], int) and data["expires_in"] > 0
    payload = jwt.decode(data["access_token"], TEST_JWT_SECRET, algorithms=["HS256"])
    assert payload["role"] == TEST_USER_ROLE
    assert payload["user_id"] == TEST_USER_ID


def test_login_wrong_password_returns_401(client):
    response = client.post("/login", json={"username": TEST_USERNAME, "password": "wrongpassword"})
    assert response.status_code == 401


def test_login_wrong_username_returns_401(client):
    with patch("app.routers.auth.authenticate_user", new_callable=AsyncMock, return_value=None):
        response = client.post("/login", json={"username": "wronguser", "password": TEST_PASSWORD})
    assert response.status_code == 401


def test_login_user_not_found_returns_401(client):
    with patch("app.routers.auth.authenticate_user", new_callable=AsyncMock, return_value=None):
        response = client.post("/login", json={"username": "unknown", "password": TEST_PASSWORD})
    assert response.status_code == 401


def test_login_rate_limit_returns_429(client):
    from app.core.limiter import limiter
    limiter._storage.reset()

    for _ in range(6):
        response = client.post(
            "/login",
            json={"username": TEST_USERNAME, "password": "wrongpassword"},
        )

    assert response.status_code == 429
    limiter._storage.reset()
