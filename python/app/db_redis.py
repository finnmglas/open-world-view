# responsible: finn
# redis cache connection

import redis.asyncio as aioredis

from app.config import settings

_pool: aioredis.ConnectionPool | None = None


def get_redis_pool() -> aioredis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = aioredis.ConnectionPool.from_url(
            f"redis://:{settings.redis_password}@{settings.redis_host}:{settings.redis_port}",
            decode_responses=True,
        )
    return _pool


def get_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=get_redis_pool())


async def ping_redis() -> bool:
    r = get_redis()
    return await r.ping()
