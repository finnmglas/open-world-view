# responsible: finn
# test endpoints: verify data layer connectivity

from fastapi import FastAPI

from app.db import ping_db
from app.db_vectors import ping_qdrant
from app.db_redis import ping_redis


def register_test_eps(app: FastAPI):

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
