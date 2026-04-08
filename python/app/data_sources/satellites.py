# responsible: finn
# data source: satellites — CelesTrak TLE + sgp4 position computation
# docs: https://celestrak.org/  |  https://pypi.org/project/sgp4/
# auth: none
# future table: satellites

from __future__ import annotations

import asyncio
import math
import time
from datetime import datetime, timezone

import httpx
from sgp4.api import Satrec, jday

from app.data_sources.base import DataRecord, PollingSource

# Top-100 visually brightest satellites + space stations (ISS, Tiangong, etc.)
_TLE_URLS = [
    "https://celestrak.org/pub/TLE/visual.txt",
    "https://celestrak.org/pub/TLE/stations.txt",
]
_TLE_TTL = 6 * 3600  # seconds — refresh TLE data every 6 hours


# ── geodetic helpers ──────────────────────────────────────────────────────────

def _gmst_rad(dt: datetime) -> float:
    """
    Greenwich Mean Sidereal Time in radians (IAU formula).
    Accurate to ~0.1 arcsec within a century of J2000.
    """
    year, month, day = dt.year, dt.month, dt.day
    if month <= 2:
        year -= 1
        month += 12
    A = year // 100
    B = 2 - A + A // 4
    JD = (
        int(365.25 * (year + 4716))
        + int(30.6001 * (month + 1))
        + day + B - 1524.5
        + (dt.hour + dt.minute / 60.0 + (dt.second + dt.microsecond / 1e6) / 3600.0) / 24.0
    )
    T = (JD - 2451545.0) / 36525.0
    theta = (
        280.46061837
        + 360.98564736629 * (JD - 2451545.0)
        + T * T * (0.000387933 - T / 38710000.0)
    )
    return math.radians(theta % 360.0)


def _teme_to_geodetic(r_km: tuple, gmst: float) -> tuple[float, float, float]:
    """
    Convert a TEME position vector (km) to WGS-84 (lat_deg, lon_deg, alt_km).
    Uses Bowring's iterative method (5 iterations, sub-metre accuracy).
    """
    x, y, z = r_km
    # TEME → ECEF: rotate around z-axis by GMST
    cg, sg = math.cos(gmst), math.sin(gmst)
    xe, ye, ze = x * cg + y * sg, -x * sg + y * cg, z

    # ECEF → WGS-84 geodetic
    a  = 6378.137               # semi-major axis, km
    e2 = 6.6943799901414e-3     # first eccentricity squared (WGS-84)
    p  = math.sqrt(xe ** 2 + ye ** 2)
    lon = math.atan2(ye, xe)
    lat = math.atan2(ze, p * (1.0 - e2))
    for _ in range(5):
        sl = math.sin(lat)
        N  = a / math.sqrt(1.0 - e2 * sl * sl)
        lat = math.atan2(ze + e2 * N * sl, p)

    sl, cl = math.sin(lat), math.cos(lat)
    N = a / math.sqrt(1.0 - e2 * sl * sl)
    alt = (p / cl - N) if abs(cl) > 1e-6 else (abs(ze) / abs(sl) - N * (1.0 - e2))

    return math.degrees(lat), math.degrees(lon), alt


# ── model ─────────────────────────────────────────────────────────────────────

class SatelliteRecord(DataRecord):
    # future table: satellites
    norad_id: int
    name: str
    lat: float
    lon: float
    altitude_km: float
    velocity_kms: float
    computed_at: datetime


# ── source ────────────────────────────────────────────────────────────────────

class SatelliteSource(PollingSource):
    name = "satellites"
    channel = "satellites"
    poll_interval = 10.0  # recompute positions every 10 s; TLE raw data is cached

    def __init__(self) -> None:
        super().__init__()
        self._sats: list[Satrec] = []
        self._names: list[str] = []
        self._tle_fetched_at: float = 0.0  # monotonic seconds

    async def _refresh_tle(self) -> None:
        """Download TLE files and build sgp4 Satrec objects."""
        async with httpx.AsyncClient(timeout=30) as client:
            responses = await asyncio.gather(*[client.get(u) for u in _TLE_URLS])

        combined = "\n".join(r.text for r in responses)
        lines = [l.strip() for l in combined.splitlines() if l.strip()]

        sats: list[Satrec] = []
        names: list[str] = []
        for i in range(0, len(lines) - 2, 3):
            n, l1, l2 = lines[i], lines[i + 1], lines[i + 2]
            if not (l1.startswith("1 ") and l2.startswith("2 ")):
                continue
            try:
                sats.append(Satrec.twoline2rv(l1, l2))
                names.append(n)
            except Exception:
                pass

        # Deduplicate by NORAD ID (stations.txt overlaps visual.txt)
        seen: set[int] = set()
        self._sats, self._names = [], []
        for sat, nm in zip(sats, names):
            if sat.satnum not in seen:
                seen.add(sat.satnum)
                self._sats.append(sat)
                self._names.append(nm)

        self._tle_fetched_at = time.monotonic()

    async def fetch(self) -> list[SatelliteRecord]:
        if time.monotonic() - self._tle_fetched_at > _TLE_TTL:
            await self._refresh_tle()

        now = datetime.now(timezone.utc)
        jd, fr = jday(
            now.year, now.month, now.day,
            now.hour, now.minute, now.second + now.microsecond / 1e6,
        )
        gmst = _gmst_rad(now)

        records: list[SatelliteRecord] = []
        for sat, nm in zip(self._sats, self._names):
            try:
                e, r, v = sat.sgp4(jd, fr)
                if e != 0:
                    continue
                lat, lon, alt_km = _teme_to_geodetic(r, gmst)
                vel = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
                records.append(SatelliteRecord(
                    norad_id=sat.satnum,
                    name=nm,
                    lat=round(lat, 4),
                    lon=round(lon, 4),
                    altitude_km=round(alt_km, 2),
                    velocity_kms=round(vel, 4),
                    computed_at=now,
                ))
            except Exception:
                pass
        return records
