def test_predict_no_token_returns_401(client, valid_png_bytes):
    # FastAPI >= 0.95: HTTPBearer returns 401 when Authorization header is absent
    response = client.post(
        "/predict",
        files={"file": ("image.png", valid_png_bytes, "image/png")},
    )
    assert response.status_code == 401


def test_predict_invalid_token_returns_401(client, valid_png_bytes):
    response = client.post(
        "/predict",
        files={"file": ("image.png", valid_png_bytes, "image/png")},
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert response.status_code == 401


def test_predict_expired_token_returns_401(client, valid_png_bytes, expired_token):
    response = client.post(
        "/predict",
        files={"file": ("image.png", valid_png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


def test_predict_valid_image_returns_200(client, valid_png_bytes, valid_token):
    response = client.post(
        "/predict",
        files={"file": ("image.png", valid_png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_class"] == "plastic"
    assert data["confidence"] == 0.9876
    assert data["bin_recommendation"] == "yellow bin"


def test_predict_pdf_returns_400(client, pdf_bytes, valid_token):
    response = client.post(
        "/predict",
        files={"file": ("document.pdf", pdf_bytes, "application/pdf")},
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 400


def test_predict_oversized_file_returns_400(client, oversized_png_bytes, valid_token):
    response = client.post(
        "/predict",
        files={"file": ("large.png", oversized_png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 400


def test_predict_corrupted_image_returns_400(client, corrupted_png_bytes, valid_token):
    response = client.post(
        "/predict",
        files={"file": ("bad.png", corrupted_png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 400
