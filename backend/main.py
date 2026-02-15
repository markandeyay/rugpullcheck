"""
FastAPI application entry point.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx

from config import settings
from models import AnalyzeRequest, AnalyzeResponse
from analyzer import analyze_token
from cache import get_cached, set_cached


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.http_client.aclose()


app = FastAPI(
    title="RugCheck API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://rugcheck-chi.vercel.app",
        settings.frontend_url,
    ],
    allow_origin_regex=r"https://rugcheck.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    cache_key = f"{request.chain}:{request.token_address.lower()}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        result = await analyze_token(
            chain=request.chain,
            token_address=request.token_address,
            http_client=app.state.http_client,
        )
        set_cached(cache_key, result)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/{chain}/{token_address}", response_model=AnalyzeResponse)
async def get_report(chain: str, token_address: str):
    cache_key = f"{chain}:{token_address.lower()}"
    cached = get_cached(cache_key)
    if cached:
        return cached
    try:
        result = await analyze_token(
            chain=chain,
            token_address=token_address,
            http_client=app.state.http_client,
        )
        set_cached(cache_key, result)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.backend_port, reload=True)
