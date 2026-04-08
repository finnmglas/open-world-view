"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useViewStore } from "@/hooks/view-store";

// Dynamically imported — three.js / WebGL cannot run server-side.
// react-globe.gl is installed in the docker container; ts-expect-error covers local dev
// where the package isn't yet in node_modules.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Globe = dynamic(
  // @ts-expect-error — installed via docker, not local node_modules
  () => import("react-globe.gl"),
  { ssr: false },
) as React.ComponentType<any>;

// Textures served directly from the three-globe package on unpkg — no token needed
const EARTH_DAY   = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_BUMP  = "//unpkg.com/three-globe/example/img/earth-topology.png";
const NIGHT_SKY   = "//unpkg.com/three-globe/example/img/night-sky.png";

/** Map-zoom level → globe camera altitude (multiples of Earth radius) */
function zoomToAltitude(zoom: number): number {
  // zoom 0 ≈ 2.5 (full globe), zoom 12 ≈ 0.05 (city)
  return Math.max(0.05, 2.5 / Math.pow(1.4, zoom));
}

/** Globe altitude back to approximate zoom */
function altitudeToZoom(alt: number): number {
  return Math.log(2.5 / Math.max(alt, 0.01)) / Math.log(1.4);
}

export function GlobeView() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  const lat         = useViewStore((s) => s.lat);
  const lon         = useViewStore((s) => s.lon);
  const zoom        = useViewStore((s) => s.zoom);
  const targetLat   = useViewStore((s) => s.targetLat);
  const targetLon   = useViewStore((s) => s.targetLon);
  const setPosition = useViewStore((s) => s.setPosition);
  const setZoom     = useViewStore((s) => s.setZoom);

  // When true, the *globe* just updated the store — skip the effect that would
  // animate the camera back to the (now identical) stored position, which is
  // what causes the "snapping back" during free drag.
  const skipNextSync = useRef(false);

  // Track container size
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

  // Animate camera only for *external* store changes (e.g. programmatic flyTo).
  // When the globe itself was the source of the change we skip to avoid fighting
  // the user's drag gesture.
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    if (!globeRef.current) return;
    globeRef.current.pointOfView(
      { lat, lng: lon, altitude: zoomToAltitude(zoom) },
      600,
    );
  }, [lat, lon, zoom]);

  // User panned or zoomed the globe → push full POV into the store.
  // onZoom fires with { lat, lng, altitude } = the camera's current look-at point.
  const handleZoom = useCallback(
    ({ lat: pLat, lng: pLng, altitude }: { lat: number; lng: number; altitude: number }) => {
      skipNextSync.current = true;
      setPosition(pLat, pLng);
      setZoom(altitudeToZoom(altitude));
    },
    [setPosition, setZoom],
  );

  // Click to reposition observer
  const handleGlobeClick = useCallback(
    ({ lat: clickLat, lng: clickLng }: { lat: number; lng: number }) => {
      setPosition(clickLat, clickLng);
    },
    [setPosition],
  );

  // Observer + target markers
  const points = [
    {
      id: "observer",
      lat,
      lng: lon,
      size: 0.35,
      color: "rgba(99,102,241,1)",   // indigo — matches our accent
    },
    ...(targetLat !== null && targetLon !== null
      ? [{ id: "target", lat: targetLat, lng: targetLon, size: 0.3, color: "rgba(251,113,133,1)" }]
      : []),
  ];

  // Arc between observer and target
  const arcs =
    targetLat !== null && targetLon !== null
      ? [
          {
            startLat: lat,
            startLng: lon,
            endLat: targetLat,
            endLng: targetLon,
            color: ["rgba(99,102,241,0.6)", "rgba(251,113,133,0.6)"],
          },
        ]
      : [];

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      {dimensions.w > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.w}
          height={dimensions.h}
          // Earth
          globeImageUrl={EARTH_DAY}
          bumpImageUrl={EARTH_BUMP}
          // Space
          backgroundImageUrl={NIGHT_SKY}
          // Atmosphere
          showAtmosphere
          atmosphereColor="rgba(100,140,255,0.8)"
          atmosphereAltitude={0.18}
          // Observer + target points
          pointsData={points}
          pointAltitude={0.01}
          pointRadius="size"
          pointColor="color"
          pointsMerge={false}
          // Arc: observer → target
          arcsData={arcs}
          arcColor="color"
          arcAltitude={0.3}
          arcStroke={0.5}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          // Interaction
          onGlobeClick={handleGlobeClick}
          onZoom={handleZoom}
          // Initial camera
          pointOfView={{ lat, lng: lon, altitude: zoomToAltitude(zoom) }}
        />
      )}
    </div>
  );
}
