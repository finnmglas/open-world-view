# responsible: finn
# data source: boats — aisstream.io AIS WebSocket feed
# docs: https://aisstream.io/documentation
# auth: AISSTREAM_API_KEY (free at aisstream.io) — source skipped if unset
# future table: boats

from __future__ import annotations

import json
from datetime import datetime, timezone

import websockets

from app.config import settings
from app.data_sources.base import DataRecord, StreamingSource
from app.event_bus import EventBus

_WS_URL = "wss://stream.aisstream.io/v0/stream"

# Global bounding box — entire world
_SUBSCRIPTION = {
    "APIKey": "",          # filled in at connection time
    "BoundingBoxes": [[[-90, -180], [90, 180]]],
    "FilterMessageTypes": ["PositionReport", "StandardClassBPositionReport"],
}


class BoatRecord(DataRecord):
    # future table: boats
    mmsi: str
    name: str | None
    lat: float
    lon: float
    speed_kn: float | None
    heading_deg: float | None
    course_deg: float | None
    nav_status: int | None    # 0=underway engine, 1=at anchor, 5=moored, …
    observed_at: datetime


class BoatSource(StreamingSource):
    name = "boats"
    channel = "boats"

    async def stream(self, bus: EventBus) -> None:
        sub = {**_SUBSCRIPTION, "APIKey": settings.aisstream_api_key}
        async with websockets.connect(_WS_URL, ping_interval=20, ping_timeout=30) as ws:
            await ws.send(json.dumps(sub))
            async for raw in ws:
                try:
                    msg = json.loads(raw)
                except Exception:
                    continue

                msg_type = msg.get("MessageType", "")
                meta = msg.get("MetaData", {})
                inner = msg.get("Message", {}).get(msg_type, {})

                lat = meta.get("latitude")
                lon = meta.get("longitude")
                if lat is None or lon is None:
                    continue

                # TrueHeading 511 means "not available"
                raw_hdg = inner.get("TrueHeading")
                heading = raw_hdg if raw_hdg not in (None, 511) else None

                record = BoatRecord(
                    mmsi=str(meta.get("MMSI", "")),
                    name=(meta.get("ShipName") or "").strip() or None,
                    lat=lat,
                    lon=lon,
                    speed_kn=inner.get("Sog"),
                    heading_deg=heading,
                    course_deg=inner.get("Cog"),
                    nav_status=inner.get("NavigationalStatus"),
                    observed_at=datetime.now(timezone.utc),
                )
                self._push(record)
                await bus.broadcast(self.channel, "vessel", record.model_dump(mode="json"))
