# responsible: finn
# data endpoints — source control (start/stop) + REST snapshots

from fastapi import FastAPI, HTTPException

from app.data_sources import registry
from app.event_bus import bus


def register_data_eps(app: FastAPI) -> None:

    @app.get("/data")
    async def sources_overview():
        """List all sources with their current status. None run until started."""
        return {
            name: {"channel": src.channel, **src.status}
            for name, src in registry.items()
        }

    @app.get("/data/{source}")
    async def get_source_snapshot(source: str):
        """Latest cached records for a source (empty until started)."""
        src = _get_or_404(source)
        return src.snapshot()

    @app.post("/data/{source}/start")
    async def start_source(source: str):
        """Start a data source. No-op if already running."""
        src = _get_or_404(source)
        if src.is_running():
            return {"status": "already_running", "source": source}
        src.start(bus)
        return {"status": "started", "source": source, "channel": src.channel}

    @app.post("/data/{source}/stop")
    async def stop_source(source: str):
        """Stop a running data source."""
        src = _get_or_404(source)
        if not src.is_running():
            return {"status": "already_stopped", "source": source}
        src.stop()
        return {"status": "stopped", "source": source}


def _get_or_404(source: str):
    src = registry.get(source)
    if not src:
        raise HTTPException(
            status_code=404,
            detail=f"Source '{source}' not found. Available: {list(registry)}",
        )
    return src
