"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI, zoomToAltitude } from "@/lib/globe-api";

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

  // Register the globe ref with the singleton so any code can move it.
  useEffect(() => {
    if (globeRef.current) globeAPI.register(globeRef);
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

  const points = [
    { id: "observer", lat, lng: lon,       size: 0.35, color: "rgba(99,102,241,1)" },
    ...(targetLat !== null && targetLon !== null
      ? [{ id: "target", lat: targetLat, lng: targetLon, size: 0.3, color: "rgba(251,113,133,1)" }]
      : []),
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
          pointAltitude={0.01}
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
