# responsible: finn
# fastapi app endpoints main thing for api

from fastapi import FastAPI

from app.db import ping_db
from app.db_vectors import ping_qdrant
from app.db_redis import ping_redis

app = FastAPI()


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"healthy": True}


@app.get("/ping")
def ping():
    return {"pong": True, "message": "Backend is ALIVE and connected to the frontend!"}


# --- data layer connectivity checks ---

@app.get("/test/db")
async def test_db():
    ok = await ping_db()
    return {"postgres": ok}


@app.get("/test/vectors")
async def test_vectors():
    ok = await ping_qdrant()
    return {"qdrant": ok}


@app.get("/test/cache")
async def test_cache():
    ok = await ping_redis()
    return {"redis": ok}


@app.get("/test/all")
async def test_all():
    results = {}
    for name, fn in [("postgres", ping_db), ("qdrant", ping_qdrant), ("redis", ping_redis)]:
        try:
            results[name] = await fn()
        except Exception as e:
            results[name] = {"error": str(e)}
    return results
