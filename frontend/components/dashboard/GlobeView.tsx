"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI, zoomToAltitude } from "@/lib/globe-api";
import { useDataSources } from "@/hooks/use-data-sources";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false }) as React.ComponentType<any>;

const EARTH_DAY  = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_BUMP = "//unpkg.com/three-globe/example/img/earth-topology.png";
const NIGHT_SKY  = "//unpkg.com/three-globe/example/img/night-sky.png";

function altitudeToZoom(alt: number): number {
  return Math.log(2.5 / Math.max(alt, 0.01)) / Math.log(1.4);
}

export function GlobeView() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // Initial camera values — read once at mount, then the globe owns its camera.
  // All updates go through globeAPI (direct imperative calls), not React state,
  // which is what was causing the "snap back" jitter.
  const initLat  = useViewStore.getState().lat;
  const initLon  = useViewStore.getState().lon;
  const initZoom = useViewStore.getState().zoom;

  const targetLat   = useViewStore((s) => s.targetLat);
  const targetLon   = useViewStore((s) => s.targetLon);
  const setPosition = useViewStore((s) => s.setPosition);
  const setZoom     = useViewStore((s) => s.setZoom);

  // Register handler-based globeAPI so keyboard controls / chord sequences work.
  useEffect(() => {
    if (!globeRef.current) return;
    const ref = globeRef; // stable capture

    globeAPI.register({
      move: (lat, lon, zoom) => {
        ref.current?.pointOfView({ lat, lng: lon, altitude: zoomToAltitude(zoom) }, 0);
      },
      flyTo: (lat, lon, zoom, durationMs = 800) => {
        ref.current?.pointOfView({ lat, lng: lon, altitude: zoomToAltitude(zoom) }, durationMs);
      },
      rotate: (delta) => {
        const globe = ref.current;
        if (!globe) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const camera   = globe.camera()   as { position: { x:number;y:number;z:number }; up: { x:number;y:number;z:number } };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const controls = globe.controls() as { update: () => void };
        const rad = (delta * Math.PI) / 180;
        const cosR = Math.cos(rad), sinR = Math.sin(rad);
        const { x: px, y: py, z: pz } = camera.position;
        const len = Math.sqrt(px*px + py*py + pz*pz);
        if (len === 0) return;
        const ax = -px/len, ay = -py/len, az = -pz/len;
        const rot = (vx: number, vy: number, vz: number) => {
          const d = ax*vx + ay*vy + az*vz;
          return {
            x: vx*cosR + (ay*vz - az*vy)*sinR + ax*d*(1-cosR),
            y: vy*cosR + (az*vx - ax*vz)*sinR + ay*d*(1-cosR),
            z: vz*cosR + (ax*vy - ay*vx)*sinR + az*d*(1-cosR),
          };
        };
        const { x, y, z } = rot(camera.up.x, camera.up.y, camera.up.z);
        camera.up.x = x; camera.up.y = y; camera.up.z = z;
        controls.update();
      },

      panNS: (degrees) => {
        const globe = ref.current;
        if (!globe) return;
        const { lat, lng: lon, altitude } = globe.pointOfView();
        const latR = lat * Math.PI / 180;
        const lonR = lon * Math.PI / 180;

        // Camera position unit vector (ECEF, radius = 1)
        const px = Math.cos(latR) * Math.cos(lonR);
        const py = Math.sin(latR);
        const pz = Math.cos(latR) * Math.sin(lonR);

        // Geographic east axis at this position: ey = 0 always
        const ex = -Math.sin(lonR);
        const ez =  Math.cos(lonR);

        // Rodrigues rotation around east axis
        const angle = degrees * Math.PI / 180;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const dot  = ex * px + ez * pz;          // e · p  (ey = 0)
        const cx   = -ez * py;                   // (e × p).x
        const cy   =  ez * px - ex * pz;         // (e × p).y
        const cz   =  ex * py;                   // (e × p).z

        const nx = px * cosA + cx * sinA + ex * dot * (1 - cosA);
        const ny = py * cosA + cy * sinA;         // ey = 0 → no e*(e·p) term
        const nz = pz * cosA + cz * sinA + ez * dot * (1 - cosA);

        const newLat = Math.asin(Math.max(-1, Math.min(1, ny))) * 180 / Math.PI;
        const newLon = Math.atan2(nz, nx) * 180 / Math.PI;

        globe.pointOfView({ lat: newLat, lng: newLon, altitude }, 0);
        setPosition(newLat, newLon);
      },

      tilt: (delta) => {
        // Orbit the camera around the "right" axis (perpendicular to both the
        // camera-to-origin direction and the camera's up vector) using Rodrigues.
        const globe = ref.current;
        if (!globe) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const camera   = globe.camera()   as { position: { x:number;y:number;z:number }; up: { x:number;y:number;z:number } };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const controls = globe.controls() as { update: () => void };
        const rad = (delta * Math.PI) / 180;
        const cosR = Math.cos(rad), sinR = Math.sin(rad);

        const { x: px, y: py, z: pz } = camera.position;
        const len = Math.sqrt(px*px + py*py + pz*pz);
        if (len === 0) return;
        // Forward vector: camera → origin (normalised)
        const fx = -px/len, fy = -py/len, fz = -pz/len;
        const { x: ux, y: uy, z: uz } = camera.up;
        // Right = forward × up (tilt axis)
        const rx = fy*uz - fz*uy, ry = fz*ux - fx*uz, rz = fx*uy - fy*ux;
        const rLen = Math.sqrt(rx*rx + ry*ry + rz*rz);
        if (rLen === 0) return;
        const ax = rx/rLen, ay = ry/rLen, az = rz/rLen;

        const rotVec = (vx: number, vy: number, vz: number) => {
          const d = ax*vx + ay*vy + az*vz;
          return {
            x: vx*cosR + (ay*vz - az*vy)*sinR + ax*d*(1-cosR),
            y: vy*cosR + (az*vx - ax*vz)*sinR + ay*d*(1-cosR),
            z: vz*cosR + (ax*vy - ay*vx)*sinR + az*d*(1-cosR),
          };
        };

        // Rotate both position and up to preserve orientation
        const newPos = rotVec(px, py, pz);
        camera.position.x = newPos.x;
        camera.position.y = newPos.y;
        camera.position.z = newPos.z;
        const newUp = rotVec(ux, uy, uz);
        camera.up.x = newUp.x;
        camera.up.y = newUp.y;
        camera.up.z = newUp.z;
        controls.update();
      },
    });
  });

  // Container size tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setDimensions({ w: el.offsetWidth, h: el.offsetHeight }),
    );
    ro.observe(el);
    setDimensions({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // User dragged or scrolled the globe → sync to store (for ViewStatePanel etc.)
  // No risk of loop here because we no longer have a store→globe useEffect.
  const handleZoom = useCallback(
    ({ lat, lng, altitude }: { lat: number; lng: number; altitude: number }) => {
      setPosition(lat, lng);
      setZoom(altitudeToZoom(altitude));
    },
    [setPosition, setZoom],
  );

  // Click → fly camera to clicked point and move observer marker
  const handleGlobeClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      const zoom = useViewStore.getState().zoom;
      globeAPI.flyTo(lat, lng, zoom);
      setPosition(lat, lng);
    },
    [setPosition],
  );

  // Read current store position for the observer dot (reactive)
  const lat = useViewStore((s) => s.lat);
  const lon = useViewStore((s) => s.lon);

  // Live data from all active sources
  const { enabled, earthquakes, planes, satellites, boats, lightning } = useDataSources();
  const zoom = useViewStore((s) => s.zoom);

  const livePoints = useMemo(() => {
    // Viewport culling: only render points within the visible spherical cap.
    // The globe camera altitude (in Earth-radii) determines how much of the
    // sphere is visible. Points further than the horizon angle are hidden.
    const altitude  = zoomToAltitude(zoom);                          // Earth-radii
    const horizonDeg = Math.acos(1 / (1 + altitude)) * 180 / Math.PI; // degrees of arc
    const visibleDeg = horizonDeg * 1.05;                             // 5% margin

    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);

    function inView(pLat: number, pLng: number): boolean {
      // Great-circle angular distance via dot product (faster than haversine for a threshold test)
      const pLatR = pLat * Math.PI / 180;
      const pLonR = pLng * Math.PI / 180;
      const dot =
        sinLat * Math.sin(pLatR) +
        cosLat * Math.cos(pLatR) * Math.cos(pLonR - lonRad);
      // dot = cos(angular_distance); threshold = cos(visibleDeg)
      return dot >= Math.cos(visibleDeg * Math.PI / 180);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pts: any[] = [];

    if (enabled.earthquakes) {
      for (const eq of earthquakes) {
        if (eq.lat == null || eq.lon == null) continue;
        if (!inView(eq.lat, eq.lon)) continue;
        const mag = eq.magnitude ?? 1;
        const alertColor =
          eq.alert === "red"    ? "rgba(239,68,68,0.9)"   :
          eq.alert === "orange" ? "rgba(249,115,22,0.9)"  :
          eq.alert === "yellow" ? "rgba(234,179,8,0.9)"   :
                                  "rgba(239,68,68,0.7)";
        pts.push({ id: `eq-${eq.id}`, lat: eq.lat, lng: eq.lon,
          size: Math.max(0.1, mag * 0.08), altitude: 0.005, color: alertColor });
      }
    }

    if (enabled.planes) {
      for (const pl of planes) {
        if (pl.lat == null || pl.lon == null || pl.on_ground) continue;
        if (!inView(pl.lat, pl.lon)) continue;
        const altKm = (pl.baro_altitude_m ?? 10000) / 1000;
        pts.push({ id: `pl-${pl.icao24}`, lat: pl.lat, lng: pl.lon,
          size: 0.12, altitude: altKm / 6371, color: "rgba(59,130,246,0.85)" });
      }
    }

    if (enabled.satellites) {
      for (const sat of satellites) {
        if (!inView(sat.lat, sat.lon)) continue;
        pts.push({ id: `sat-${sat.norad_id}`, lat: sat.lat, lng: sat.lon,
          size: 0.12, altitude: sat.altitude_km / 6371, color: "rgba(168,85,247,0.85)" });
      }
    }

    if (enabled.boats) {
      for (const boat of boats) {
        if (!inView(boat.lat, boat.lon)) continue;
        pts.push({ id: `boat-${boat.mmsi}`, lat: boat.lat, lng: boat.lon,
          size: 0.12, altitude: 0.001, color: "rgba(20,184,166,0.85)" });
      }
    }

    if (enabled.lightning) {
      for (const strike of lightning) {
        if (!inView(strike.lat, strike.lon)) continue;
        const pol = strike.polarity ?? 0;
        const color = pol < 0 ? "rgba(250,204,21,0.9)" : "rgba(251,191,36,0.7)";
        pts.push({ id: `lt-${strike.timestamp}-${strike.lat}`, lat: strike.lat, lng: strike.lon,
          size: 0.08, altitude: 0.001, color });
      }
    }

    return pts;
  }, [enabled, earthquakes, planes, satellites, boats, lightning, lat, lon, zoom]);

  const points = [
    { id: "observer", lat, lng: lon,       size: 0.35, altitude: 0.01, color: "rgba(99,102,241,1)" },
    ...(targetLat !== null && targetLon !== null
      ? [{ id: "target", lat: targetLat, lng: targetLon, size: 0.3, altitude: 0.01, color: "rgba(251,113,133,1)" }]
      : []),
    ...livePoints,
  ];

  const arcs =
    targetLat !== null && targetLon !== null
      ? [{
          startLat: lat, startLng: lon,
          endLat: targetLat, endLng: targetLon,
          color: ["rgba(99,102,241,0.6)", "rgba(251,113,133,0.6)"],
        }]
      : [];

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      {dimensions.w > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.w}
          height={dimensions.h}
          globeImageUrl={EARTH_DAY}
          bumpImageUrl={EARTH_BUMP}
          backgroundImageUrl={NIGHT_SKY}
          showAtmosphere
          atmosphereColor="rgba(100,140,255,0.8)"
          atmosphereAltitude={0.18}
          pointsData={points}
          pointAltitude="altitude"
          pointRadius="size"
          pointColor="color"
          pointsMerge={false}
          arcsData={arcs}
          arcColor="color"
          arcAltitude={0.3}
          arcStroke={0.5}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          onGlobeClick={handleGlobeClick}
          onZoom={handleZoom}
          pointOfView={{ lat: initLat, lng: initLon, altitude: zoomToAltitude(initZoom) }}
        />
      )}
    </div>
  );
}
