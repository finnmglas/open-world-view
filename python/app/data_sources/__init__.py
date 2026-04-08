# responsible: finn
# data source registry — sources that need unconfigured API keys are skipped

from app.config import settings
from app.data_sources.base import BaseDataSource
from app.data_sources.earthquakes import EarthquakeSource
from app.data_sources.lightning import LightningSource
from app.data_sources.planes import PlaneSource
from app.data_sources.satellites import SatelliteSource

registry: dict[str, BaseDataSource] = {
    "earthquakes": EarthquakeSource(),
    "planes":      PlaneSource(),
    "satellites":  SatelliteSource(),
    "lightning":   LightningSource(),
}

# Boats require an aisstream.io API key — skip gracefully if not configured
if settings.aisstream_api_key:
    from app.data_sources.boats import BoatSource
    registry["boats"] = BoatSource()
