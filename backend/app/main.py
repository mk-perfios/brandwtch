from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables
from app.api.routes import auth, orgs, brands, mentions, analytics, alerts, monitor


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(orgs.router,     prefix="/api/orgs",     tags=["orgs"])
app.include_router(brands.router,   prefix="/api/brands",   tags=["brands"])
app.include_router(mentions.router, prefix="/api/mentions", tags=["mentions"])
app.include_router(analytics.router,prefix="/api/analytics",tags=["analytics"])
app.include_router(alerts.router,   prefix="/api/alerts",   tags=["alerts"])
app.include_router(monitor.router,  prefix="/api/monitor",  tags=["monitor"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
