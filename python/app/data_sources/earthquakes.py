# responsible: finn
# data source: earthquakes — USGS real-time GeoJSON feed
# docs: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
# auth: none
# future table: earthquakes

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from app.data_sources.base import DataRecord, PollingSource

# Last hour of all magnitudes (updates every minute on USGS side)
_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"


class EarthquakeRecord(DataRecord):
    # future table: earthquakes
    id: str
    magnitude: float | None
    place: str | None
    time: datetime
    lat: float
    lon: float
    depth_km: float
    alert: str | None = None      # green / yellow / orange / red
    tsunami: bool = False
    url: str


class EarthquakeSource(PollingSource):
    name = "earthquakes"
    channel = "earthquakes"
    poll_interval = 60.0  # USGS updates every ~1 min

    async def fetch(self) -> list[EarthquakeRecord]:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(_FEED_URL)
        r.raise_for_status()
        features = r.json()["features"]
        records: list[EarthquakeRecord] = []
        for f in features:
            p = f["properties"]
            coords = f["geometry"]["coordinates"]
            records.append(EarthquakeRecord(
                id=f["id"],
                magnitude=p.get("mag"),
                place=p.get("place"),
                time=datetime.fromtimestamp(p["time"] / 1000, tz=timezone.utc),
                lat=coords[1],
                lon=coords[0],
                depth_km=coords[2],
                alert=p.get("alert"),
                tsunami=bool(p.get("tsunami")),
                url=p.get("url", ""),
            ))
        return records
