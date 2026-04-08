# responsible: finn
# qdrant vector db connection

from qdrant_client import AsyncQdrantClient

from app.config import settings

_client: AsyncQdrantClient | None = None


def get_qdrant() -> AsyncQdrantClient:
    global _client
    if _client is None:
        _client = AsyncQdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            api_key=settings.qdrant_api_key or None,
            https=False,
        )
    return _client


async def ping_qdrant() -> bool:
    client = get_qdrant()
    await client.get_collections()
    return True
