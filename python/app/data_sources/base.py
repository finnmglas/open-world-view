# responsible: finn
# base classes for all live data sources

from __future__ import annotations

import asyncio
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from pydantic import BaseModel

from app.event_bus import EventBus

log = logging.getLogger(__name__)


# ── base record ───────────────────────────────────────────────────────────────

class DataRecord(BaseModel):
    """Pydantic base for every persistable data record."""
    model_config = {"use_enum_values": True}


# ── base source ───────────────────────────────────────────────────────────────

class BaseDataSource(ABC):
    """Common interface for all data sources. Sources are off by default."""
    name: str
    channel: str

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None

    # ── lifecycle ─────────────────────────────────────────────────────────────

    def start(self, bus: EventBus) -> None:
        """Spawn the background task. No-op if already running."""
        if self.is_running():
            return
        self._task = asyncio.create_task(self.safe_run(bus), name=self.name)
        log.info("[%s] started", self.name)

    def stop(self) -> None:
        """Cancel the background task. No-op if already stopped."""
        if self._task and not self._task.done():
            self._task.cancel()
            log.info("[%s] stopped", self.name)
        self._task = None

    def is_running(self) -> bool:
        return self._task is not None and not self._task.done()

    # ── abstract interface ────────────────────────────────────────────────────

    @abstractmethod
    async def safe_run(self, bus: EventBus) -> None:
        """Run forever, restarting after errors."""

    @abstractmethod
    def snapshot(self) -> dict:
        """Current status + latest cached records (for REST)."""

    @property
    @abstractmethod
    def status(self) -> dict:
        """Current status without records."""


# ── polling source ────────────────────────────────────────────────────────────

class PollingSource(BaseDataSource, ABC):
    """
    Fetches data on a fixed interval, caches the latest batch, and
    broadcasts an "update" event on each successful fetch.
    """
    poll_interval: float  # seconds

    def __init__(self) -> None:
        super().__init__()
        self._latest: list[DataRecord] = []
        self._last_fetch: datetime | None = None
        self._error: str | None = None

    @abstractmethod
    async def fetch(self) -> list[DataRecord]:
        """Fetch and return the latest batch. Raise on error."""

    async def safe_run(self, bus: EventBus) -> None:
        while True:
            try:
                items = await self.fetch()
                self._latest = items
                self._last_fetch = datetime.now(timezone.utc)
                self._error = None
                await bus.broadcast(self.channel, "update", {
                    "source": self.name,
                    "count": len(items),
                    "items": [r.model_dump(mode="json") for r in items],
                    "fetched_at": self._last_fetch.isoformat(),
                })
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                self._error = str(exc)
                log.error("[%s] fetch error: %s", self.name, exc)
                await bus.broadcast(self.channel, "error", {
                    "source": self.name,
                    "error": str(exc),
                })
            await asyncio.sleep(self.poll_interval)

    @property
    def status(self) -> dict:
        return {
            "running": self.is_running(),
            "type": "polling",
            "poll_interval_s": self.poll_interval,
            "last_fetch": self._last_fetch.isoformat() if self._last_fetch else None,
            "error": self._error,
            "count": len(self._latest),
        }

    def snapshot(self) -> dict:
        return {
            **self.status,
            "source": self.name,
            "channel": self.channel,
            "items": [r.model_dump(mode="json") for r in self._latest],
        }


# ── streaming source ──────────────────────────────────────────────────────────

class StreamingSource(BaseDataSource, ABC):
    """
    Maintains a persistent external WebSocket connection.
    Keeps a rolling window of recent records in memory.
    Reconnects automatically on error.
    """
    _WINDOW: int = 500

    def __init__(self) -> None:
        super().__init__()
        self._latest: list[DataRecord] = []
        self._total: int = 0
        self._last_event: datetime | None = None
        self._error: str | None = None

    @abstractmethod
    async def stream(self, bus: EventBus) -> None:
        """Connect and process events. Raise/return to trigger reconnect."""

    def _push(self, record: DataRecord) -> None:
        self._latest.append(record)
        if len(self._latest) > self._WINDOW:
            self._latest = self._latest[-self._WINDOW:]
        self._total += 1
        self._last_event = datetime.now(timezone.utc)

    async def safe_run(self, bus: EventBus) -> None:
        while True:
            try:
                await self.stream(bus)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                self._error = str(exc)
                log.error("[%s] stream error: %s — reconnecting in 5 s", self.name, exc)
                await asyncio.sleep(5)

    @property
    def status(self) -> dict:
        return {
            "running": self.is_running(),
            "type": "streaming",
            "total_received": self._total,
            "last_event": self._last_event.isoformat() if self._last_event else None,
            "error": self._error,
            "count": len(self._latest),
        }

    def snapshot(self) -> dict:
        return {
            **self.status,
            "source": self.name,
            "channel": self.channel,
            "items": [r.model_dump(mode="json") for r in self._latest],
        }
