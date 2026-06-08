def test_history_me_returns_200(client, valid_token):
    response = client.get(
        "/history/me",
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert "total" in data
    assert data["predictions"] == []
    assert data["total"] == 0


def test_history_me_requires_auth(client):
    response = client.get("/history/me")
    assert response.status_code == 401


def test_history_admin_returns_200(client, valid_token):
    response = client.get(
        "/history",
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert "total" in data


def test_history_admin_requires_admin(client, user_token):
    response = client.get(
        "/history",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403
