import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.db.base import Base, engine
from app.db.seed import create_admin_if_empty
from app.routers import auth, health, history, predict, reports
from app.services.model import ModelService
from prometheus_fastapi_instrumentator import Instrumentator

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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await create_admin_if_empty()
    yield


app = FastAPI(
    title="WasteLens API",
    root_path="/api",
    version=os.getenv("VERSION", "0.0.0"),
    description="WasteLens API — AI-powered waste classification. Upload an image to get instant sorting recommendations.",
    contact={"name": "Antoine", "url": "https://github.com/NovaStarmax/WasteLens"},
    license_info={"name": "MIT"},
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

Instrumentator().instrument(app).expose(app)

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
app.include_router(reports.router)
app.include_router(history.router)

logger.info("WasteLens API started — env=%s, version=%s", os.getenv("ENVIRONMENT"), os.getenv("VERSION"))
