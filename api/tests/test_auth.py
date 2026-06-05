from unittest.mock import patch

from tests.conftest import TEST_PASSWORD, TEST_USERNAME


def test_login_valid_returns_token(client):
    response = client.post("/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert isinstance(data["expires_in"], int) and data["expires_in"] > 0


def test_login_wrong_password_returns_401(client):
    response = client.post("/login", json={"username": TEST_USERNAME, "password": "wrongpassword"})
    assert response.status_code == 401


def test_login_wrong_username_returns_401(client):
    response = client.post("/login", json={"username": "wronguser", "password": TEST_PASSWORD})
    assert response.status_code == 401


def test_login_missing_config_returns_500(client):
    # Simulates APP_USERNAME / APP_PASSWORD_HASH not set in environment
    with patch("app.core.security.os.getenv", return_value=None):
        response = client.post("/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD})
    assert response.status_code == 500


def test_login_rate_limit_returns_429(client):
    from app.core.limiter import limiter
    limiter._storage.reset()  # état propre indépendamment des autres tests

    for _ in range(6):
        response = client.post(
            "/login",
            json={"username": TEST_USERNAME, "password": "wrongpassword"},
        )

    assert response.status_code == 429
    limiter._storage.reset()  # nettoyage pour les tests suivants
