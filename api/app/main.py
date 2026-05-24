import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, health, predict
from app.services.model import ModelService

# Load environment variables from .env before anything else reads os.getenv
load_dotenv(Path(__file__).parent.parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# CORS origins come from .env as a comma-separated string
cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

@asynccontextmanager
async def lifespan(app: FastAPI):
    ModelService.get_instance().load()
    yield


app = FastAPI(
    title="WasteLens API",
    version=os.getenv("VERSION", "0.0.0"),
    description="WasteLens API — AI-powered waste classification. Upload an image to get instant sorting recommendations.",
    contact={"name": "Antoine", "url": "https://github.com/NovaStarmax/WasteLens"},
    license_info={"name": "MIT"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(predict.router)

logger.info("WasteLens API started — env=%s, version=%s", os.getenv("ENVIRONMENT"), os.getenv("VERSION"))
