"use client";

import { useEffect, useRef } from "react";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI } from "@/lib/globe-api";

const PAN_KEYS  = new Set(["w","a","s","d","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);
const ZOOM_KEYS = new Set(["+","=","-","_"]);

function isTyping(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

export function useKeyboardControls() {
  // Mirror store state into a ref so the RAF loop has no stale closures.
  const stateRef = useRef({ lat: 0, lon: 0, zoom: 12 });

  useEffect(() => {
    const { lat, lon, zoom } = useViewStore.getState();
    stateRef.current = { lat, lon, zoom };
    return useViewStore.subscribe((s) => {
      stateRef.current = { lat: s.lat, lon: s.lon, zoom: s.zoom };
    });
  }, []);

  useEffect(() => {
    const held      = new Set<string>();
    const shiftHeld = { current: false };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") { shiftHeld.current = true; return; }
      if (PAN_KEYS.has(e.key) || ZOOM_KEYS.has(e.key)) {
        e.preventDefault();
        held.add(e.key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") { shiftHeld.current = false; return; }
      held.delete(e.key);
    };
    const onBlur = () => { held.clear(); shiftHeld.current = false; };

    let raf: number;

    const tick = () => {
      if (held.size > 0 && !isTyping()) {
        const { lat, lon, zoom } = stateRef.current;
        const mult = shiftHeld.current ? 4 : 1;

        // Pan speed scales with zoom: fast when zoomed out, precise when zoomed in
        const panSpeed  = (0.4 / Math.pow(2, zoom * 0.65)) * mult;
        const zoomSpeed = 0.04 * mult;

        let newLat  = lat;
        let newLon  = lon;
        let newZoom = zoom;

        if (held.has("w") || held.has("ArrowUp"))    newLat  = Math.min(85,  lat + panSpeed);
        if (held.has("s") || held.has("ArrowDown"))  newLat  = Math.max(-85, lat - panSpeed);
        if (held.has("d") || held.has("ArrowRight")) newLon  = ((lon + panSpeed + 180) % 360) - 180;
        if (held.has("a") || held.has("ArrowLeft"))  newLon  = ((lon - panSpeed + 180) % 360) - 180;
        if (held.has("+") || held.has("="))          newZoom = Math.min(20, zoom + zoomSpeed);
        if (held.has("-") || held.has("_"))          newZoom = Math.max(0,  zoom - zoomSpeed);

        const moved = newLat !== lat || newLon !== lon || newZoom !== zoom;

        if (moved) {
          // Move the globe camera immediately (0 ms — no queued animations).
          // This is the key fix: bypassing React state avoids the "snap back"
          // caused by overlapping 600 ms pointOfView animations.
          globeAPI.move(newLat, newLon, newZoom);

          // Also update the store so ViewStatePanel stays in sync.
          const store = useViewStore.getState();
          if (newLat !== lat || newLon !== lon) store.setPosition(newLat, newLon);
          if (newZoom !== zoom)                 store.setZoom(newZoom);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    window.addEventListener("blur",    onBlur);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
      window.removeEventListener("blur",    onBlur);
    };
  }, []);
}
