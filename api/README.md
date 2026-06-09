# WasteLens API

FastAPI backend for the WasteLens waste classification platform.

## Setup

```bash
cp .env.example .env
uv sync
```

## Run

```bash
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| GET | `/docs` | Interactive Swagger UI |
| GET | `/redoc` | ReDoc documentation |
