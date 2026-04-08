// responsible: finn
// live data source definitions and shared types (mirror backend Pydantic models)

// ── source registry ───────────────────────────────────────────────────────────

export type SourceKey = "earthquakes" | "planes" | "satellites" | "boats" | "lightning";

export interface SourceDef {
  key:         SourceKey;
  label:       string;
  channel:     string;   // WS event bus channel
  description: string;
  color:       string;   // default point color
}

export const SOURCES: SourceDef[] = [
  { key: "earthquakes", label: "Earthquakes", channel: "earthquakes", description: "USGS · 60 s",    color: "rgba(239,68,68,0.9)"   },
  { key: "planes",      label: "Planes",      channel: "planes",      description: "OpenSky · 30 s", color: "rgba(59,130,246,0.9)"  },
  { key: "satellites",  label: "Satellites",  channel: "satellites",  description: "CelesTrak · 10 s",color: "rgba(168,85,247,0.9)" },
  { key: "boats",       label: "Boats",       channel: "boats",       description: "AIS stream",     color: "rgba(20,184,166,0.9)"  },
  { key: "lightning",   label: "Lightning",   channel: "lightning",   description: "Blitzortung",    color: "rgba(250,204,21,0.9)"  },
];

// ── record types (mirrors backend models) ─────────────────────────────────────

export interface EarthquakeItem {
  id:        string;
  magnitude: number | null;
  place:     string | null;
  lat:       number;
  lon:       number;
  depth_km:  number;
  alert:     string | null;
  tsunami:   boolean;
  time:      string;
  url:       string;
}

export interface PlaneItem {
  icao24:          string;
  callsign:        string | null;
  origin_country:  string | null;
  lat:             number | null;
  lon:             number | null;
  baro_altitude_m: number | null;
  geo_altitude_m:  number | null;
  velocity_ms:     number | null;
  heading_deg:     number | null;
  on_ground:       boolean;
}

export interface SatelliteItem {
  norad_id:     number;
  name:         string;
  lat:          number;
  lon:          number;
  altitude_km:  number;
  velocity_kms: number;
  computed_at:  string;
}

export interface BoatItem {
  mmsi:        string;
  name:        string | null;
  lat:         number;
  lon:         number;
  speed_kn:    number | null;
  heading_deg: number | null;
  nav_status:  number | null;
}

export interface LightningItem {
  lat:       number;
  lon:       number;
  polarity:  number | null;
  timestamp: string;
}
