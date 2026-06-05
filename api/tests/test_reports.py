import json
from unittest.mock import patch


# --- Authentication ---

def test_evaluation_no_token_returns_401(client):
    response = client.get("/reports/evaluation")
    assert response.status_code == 401


def test_evaluation_invalid_token_returns_401(client):
    response = client.get(
        "/reports/evaluation",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert response.status_code == 401


def test_evaluation_expired_token_returns_401(client, expired_token):
    response = client.get(
        "/reports/evaluation",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


def test_confusion_matrix_no_token_returns_401(client):
    response = client.get("/reports/confusion-matrix")
    assert response.status_code == 401


def test_confusion_matrix_invalid_token_returns_401(client):
    response = client.get(
        "/reports/confusion-matrix",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert response.status_code == 401


def test_confusion_matrix_expired_token_returns_401(client, expired_token):
    response = client.get(
        "/reports/confusion-matrix",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


# --- 404 quand les fichiers sont absents ---

def test_evaluation_missing_file_returns_404(client, valid_token, tmp_path):
    with patch("app.routers.reports.REPORTS_PATH", tmp_path):
        response = client.get(
            "/reports/evaluation",
            headers={"Authorization": f"Bearer {valid_token}"},
        )
    assert response.status_code == 404
    assert "Evaluation report not found" in response.json()["detail"]


def test_confusion_matrix_missing_file_returns_404(client, valid_token, tmp_path):
    with patch("app.routers.reports.REPORTS_PATH", tmp_path):
        response = client.get(
            "/reports/confusion-matrix",
            headers={"Authorization": f"Bearer {valid_token}"},
        )
    assert response.status_code == 404
    assert "Confusion matrix not found" in response.json()["detail"]


# --- Cas heureux ---

def test_evaluation_returns_json_with_accuracy(client, valid_token, tmp_path):
    report = {
        "test_accuracy": 0.9,
        "best_val_accuracy": 0.862797,
        "per_class_metrics": {
            "cardboard": {"precision": 1.0, "recall": 0.9167, "f1": 0.9565},
        },
    }
    (tmp_path / "evaluation_report.json").write_text(json.dumps(report))

    with patch("app.routers.reports.REPORTS_PATH", tmp_path):
        response = client.get(
            "/reports/evaluation",
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["test_accuracy"] == 0.9
    assert "per_class_metrics" in data


def test_confusion_matrix_returns_png(client, valid_token, tmp_path, valid_png_bytes):
    (tmp_path / "confusion_matrix.png").write_bytes(valid_png_bytes)

    with patch("app.routers.reports.REPORTS_PATH", tmp_path):
        response = client.get(
            "/reports/confusion-matrix",
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
