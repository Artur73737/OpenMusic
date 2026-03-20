"""HTTP API server for frontend integration."""

import logging
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from music_mcp.config.settings import get_settings
from music_mcp.services.composition_service import CompositionService
from music_mcp.services.nvidia_client import NvidiaClient

settings = get_settings()

log_level_int = getattr(logging, settings.log_level.upper(), logging.INFO)

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(log_level_int),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

nvidia_client: NvidiaClient
composition_service: CompositionService


class GenerateRequest(BaseModel):
    prompt: str
    model: str | None = None
    duration_seconds: int | None = None
    bpm: int | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nvidia_client, composition_service

    logger.info("api_server_starting", version=settings.mcp_server_version)

    nvidia_client = NvidiaClient(settings)
    composition_service = CompositionService(nvidia_client)

    logger.info("services_initialized")

    yield

    await nvidia_client.aclose()
    logger.info("api_server_shutdown")


app = FastAPI(
    title="Music MCP API",
    version=settings.mcp_server_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.mcp_server_version}


@app.post("/v1/generate_melody")
async def generate_melody(request: GenerateRequest):
    try:
        result = await composition_service.generate_melody(
            request.prompt,
            request.model,
            request.duration_seconds,
            request.bpm,
        )
        return result
    except Exception as e:
        logger.error("generate_melody_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/v1/generate_rhythm")
async def generate_rhythm(request: GenerateRequest):
    try:
        result = await composition_service.generate_rhythm(
            request.prompt,
            request.model,
            request.duration_seconds,
            request.bpm,
        )
        return result
    except Exception as e:
        logger.error("generate_rhythm_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/v1/generate_composition")
async def generate_composition(request: GenerateRequest):
    try:
        result = await composition_service.generate_composition(
            request.prompt,
            request.model,
            request.duration_seconds,
            request.bpm,
        )
        return result
    except Exception as e:
        logger.error("generate_composition_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


def main():
    uvicorn.run(
        "music_mcp.api_server:app",
        host="127.0.0.1",
        port=8001,
        reload=False,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
