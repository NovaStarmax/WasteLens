import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.main import app


def test_list_users_admin_returns_200(client, valid_token):
    response = client.get("/users", headers={"Authorization": f"Bearer {valid_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_users_requires_admin(client, user_token):
    response = client.get("/users", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 403


def test_list_users_no_token_returns_401(client):
    response = client.get("/users")
    assert response.status_code == 401


def test_create_user_requires_admin(client, user_token):
    response = client.post(
        "/users",
        json={"username": "newuser", "password": "pass123", "role": "user"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_create_user_conflict_returns_409(client, valid_token):
    # mock_db retourne mock_admin_user via scalar_one_or_none → conflit détecté
    response = client.post(
        "/users",
        json={"username": "testuser", "password": "pass123", "role": "user"},
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 409


_TEST_USER_ID = "12345678-1234-5678-1234-567812345678"  # identique au conftest


def test_delete_user_no_token_returns_401(client):
    response = client.delete(f"/users/{uuid.uuid4()}")
    assert response.status_code == 401


def test_delete_user_requires_admin(client, user_token):
    response = client.delete(
        f"/users/{uuid.uuid4()}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_delete_own_account_returns_403(client, valid_token):
    response = client.delete(
        f"/users/{_TEST_USER_ID}",
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 403


def test_delete_user_not_found_returns_404(client, valid_token):
    target_id = uuid.uuid4()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None

    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock(return_value=mock_result)

    original = app.dependency_overrides.get(get_db)

    async def override():
        yield session

    app.dependency_overrides[get_db] = override
    try:
        response = client.delete(
            f"/users/{target_id}",
            headers={"Authorization": f"Bearer {valid_token}"},
        )
        assert response.status_code == 404
    finally:
        if original:
            app.dependency_overrides[get_db] = original
        else:
            app.dependency_overrides.pop(get_db, None)


def test_delete_user_admin_returns_204(client, valid_token):
    # UUID différent de TEST_USER_ID → pas de self-delete
    # mock_db.scalar_one_or_none retourne mock_admin_user → user trouvé → 204
    target_id = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    response = client.delete(
        f"/users/{target_id}",
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 204


def test_create_user_admin_returns_201(client, valid_token):
    new_user = MagicMock()
    new_user.id = uuid.uuid4()
    new_user.username = "brandnewuser"
    new_user.role = "user"
    new_user.created_at = datetime.now(timezone.utc)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None

    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock(return_value=mock_result)

    async def mock_refresh(obj):
        obj.id = new_user.id
        obj.created_at = new_user.created_at

    session.refresh = mock_refresh

    original = app.dependency_overrides.get(get_db)

    async def override():
        yield session

    app.dependency_overrides[get_db] = override
    try:
        response = client.post(
            "/users",
            json={"username": "brandnewuser", "password": "pass123", "role": "user"},
            headers={"Authorization": f"Bearer {valid_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "brandnewuser"
        assert data["role"] == "user"
        assert "id" in data
    finally:
        if original:
            app.dependency_overrides[get_db] = original
        else:
            app.dependency_overrides.pop(get_db, None)
