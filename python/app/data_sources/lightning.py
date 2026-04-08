# responsible: finn
# data source: lightning — blitzortung.org community WebSocket feed
# docs: https://www.blitzortung.org  (unofficial/community protocol — may change)
# auth: none
# future table: lightning
#
# Protocol notes (reverse-engineered from open-source blitzortung clients):
#   - Connect to one of the regional WS servers below
#   - Server streams JSON objects; each is a lightning strike
#   - Fields: time (nanoseconds epoch), lat (float°), lon (float°),
#             alt (m), pol (polarity: +1/-1), sta (station count)
#   - No subscription message needed; strikes flow immediately on connect
#   - Servers rotate; if one drops, safe_run reconnects via the next one

from __future__ import annotations

import json
from datetime import datetime, timezone
from itertools import cycle

import websockets

from app.data_sources.base import DataRecord, StreamingSource
from app.event_bus import EventBus

# Regional WebSocket endpoints — rotated on each reconnect
_WS_SERVERS = [
    "wss://ws.blitzortung.org:8060/",
    "wss://ws.blitzortung.org:8061/",
    "wss://ws.blitzortung.org:8062/",
    "wss://ws.blitzortung.org:8080/",
    "wss://ws.blitzortung.org:8081/",
    "wss://ws.blitzortung.org:8082/",
]

_server_cycle = cycle(_WS_SERVERS)


class LightningRecord(DataRecord):
    # future table: lightning
    lat: float
    lon: float
    altitude_m: int | None
    polarity: int | None          # +1 = positive, -1 = negative
    station_count: int | None     # number of stations that detected the strike
    timestamp: datetime


class LightningSource(StreamingSource):
    name = "lightning"
    channel = "lightning"
    _WINDOW = 1000  # keep more strikes — they arrive fast

    async def stream(self, bus: EventBus) -> None:
        url = next(_server_cycle)
        async with websockets.connect(
            url,
            ping_interval=20,
            ping_timeout=30,
            open_timeout=10,
        ) as ws:
            async for raw in ws:
                try:
                    data = json.loads(raw)
                except Exception:
                    continue

                lat = data.get("lat")
                lon = data.get("lon")
                if lat is None or lon is None:
                    continue

                ts_ns = data.get("time", 0)
                record = LightningRecord(
                    lat=lat,
                    lon=lon,
                    altitude_m=data.get("alt"),
                    polarity=data.get("pol"),
                    station_count=data.get("sta"),
                    timestamp=datetime.fromtimestamp(ts_ns / 1e9, tz=timezone.utc) if ts_ns else datetime.now(timezone.utc),
                )
                self._push(record)
                await bus.broadcast(self.channel, "strike", record.model_dump(mode="json"))
