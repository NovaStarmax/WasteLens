# WasteLens

AI-powered waste classification application. Upload an image and get instant sorting recommendations across 6 waste categories: cardboard, glass, metal, paper, plastic, and trash.

## Stack
- Model: ResNet18 (transfer learning, PyTorch)
- API: FastAPI
- Frontend: React
- MLOps: GitHub Actions, Docker, Coolify
- Monitoring: Grafana

## Project structure
- `api/` — FastAPI backend exposing the model
- `app/` — Frontend web application
- `model/` — Training scripts and model evaluation
- `.github/` — CI/CD workflows and PR template