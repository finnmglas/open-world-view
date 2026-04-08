# responsible: finn
# data source: planes — OpenSky Network ADS-B state vectors
# docs: https://openskynetwork.github.io/opensky-api/rest.html
# auth: none (anonymous, 400 req/day, 10 s cooldown)
# future table: planes

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from app.data_sources.base import DataRecord, PollingSource

_API_URL = "https://opensky-network.org/api/states/all"

# Index map for the OpenSky states array
_F = {
    "icao24": 0, "callsign": 1, "origin_country": 2,
    "time_position": 3, "last_contact": 4,
    "lon": 5, "lat": 6, "baro_altitude_m": 7, "on_ground": 8,
    "velocity_ms": 9, "heading_deg": 10, "vertical_rate_ms": 11,
    "sensors": 12, "geo_altitude_m": 13, "squawk": 14,
    "spi": 15, "position_source": 16,
}


class PlaneRecord(DataRecord):
    # future table: planes
    icao24: str
    callsign: str | None
    origin_country: str | None
    lat: float | None
    lon: float | None
    baro_altitude_m: float | None
    geo_altitude_m: float | None
    velocity_ms: float | None
    heading_deg: float | None
    vertical_rate_ms: float | None
    on_ground: bool
    squawk: str | None
    observed_at: datetime


class PlaneSource(PollingSource):
    name = "planes"
    channel = "planes"
    poll_interval = 30.0  # stay comfortably within anon rate limits

    async def fetch(self) -> list[PlaneRecord]:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(_API_URL)
        r.raise_for_status()
        data = r.json()
        now = datetime.now(timezone.utc)
        records: list[PlaneRecord] = []
        for s in data.get("states") or []:
            # skip if no position
            if s[_F["lat"]] is None or s[_F["lon"]] is None:
                continue
            last_contact_ts = s[_F["last_contact"]]
            records.append(PlaneRecord(
                icao24=s[_F["icao24"]],
                callsign=(s[_F["callsign"]] or "").strip() or None,
                origin_country=s[_F["origin_country"]],
                lat=s[_F["lat"]],
                lon=s[_F["lon"]],
                baro_altitude_m=s[_F["baro_altitude_m"]],
                geo_altitude_m=s[_F["geo_altitude_m"]],
                velocity_ms=s[_F["velocity_ms"]],
                heading_deg=s[_F["heading_deg"]],
                vertical_rate_ms=s[_F["vertical_rate_ms"]],
                on_ground=bool(s[_F["on_ground"]]),
                squawk=s[_F["squawk"]],
                observed_at=(
                    datetime.fromtimestamp(last_contact_ts, tz=timezone.utc)
                    if last_contact_ts else now
                ),
            ))
        return records
