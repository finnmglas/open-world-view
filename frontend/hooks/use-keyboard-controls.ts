"use client";

import { useEffect, useRef } from "react";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI } from "@/lib/globe-api";

const PAN_KEYS    = new Set(["w","a","s","d","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);
const ZOOM_KEYS   = new Set(["+","=","-","_"]);
const ROTATE_KEYS = new Set(["q","e"]);

function isTyping(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

export function useKeyboardControls() {
  const stateRef = useRef({ lat: 0, lon: 0, zoom: 12, bearing: 0 });

  useEffect(() => {
    const s = useViewStore.getState();
    stateRef.current = { lat: s.lat, lon: s.lon, zoom: s.zoom, bearing: s.bearing };
    return useViewStore.subscribe((s) => {
      stateRef.current = { lat: s.lat, lon: s.lon, zoom: s.zoom, bearing: s.bearing };
    });
  }, []);

  useEffect(() => {
    const held      = new Set<string>();
    const shiftHeld = { current: false };

    // Keys blocked by the sequence system until their keyup event fires.
    // Prevents e.g. holding "d" in "g→d (Dubai)" from also moving east.
    const seqBlocked = new Set<string>();

    const onSequenceConsumed = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      held.delete(key);          // drop it if already added this frame
      seqBlocked.add(key);       // block until keyup
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") { shiftHeld.current = true; return; }
      // Ignore keys the sequence system just consumed
      if (seqBlocked.has(e.key)) return;
      const relevant = PAN_KEYS.has(e.key) || ZOOM_KEYS.has(e.key) || ROTATE_KEYS.has(e.key);
      if (relevant) { e.preventDefault(); held.add(e.key); }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") { shiftHeld.current = false; return; }
      held.delete(e.key);
      seqBlocked.delete(e.key); // unblock once the key is physically released
    };

    const onBlur = () => { held.clear(); shiftHeld.current = false; seqBlocked.clear(); };

    let raf: number;

    const tick = () => {
      if (held.size > 0 && !isTyping()) {
        const { lat, lon, zoom, bearing } = stateRef.current;
        const mult = shiftHeld.current ? 4 : 1;

        const panSpeed    = (0.4 / Math.pow(2, zoom * 0.65)) * mult;
        const zoomSpeed   = 0.04 * mult;
        const rotateSpeed = 0.8 * mult; // degrees/frame

        let newLat     = lat;
        let newLon     = lon;
        let newZoom    = zoom;
        let newBearing = bearing;

        if (held.has("w") || held.has("ArrowUp"))    newLat     = Math.min(85,  lat + panSpeed);
        if (held.has("s") || held.has("ArrowDown"))  newLat     = Math.max(-85, lat - panSpeed);
        if (held.has("d") || held.has("ArrowRight")) newLon     = ((lon + panSpeed + 180) % 360) - 180;
        if (held.has("a") || held.has("ArrowLeft"))  newLon     = ((lon - panSpeed + 180) % 360) - 180;
        if (held.has("+") || held.has("="))          newZoom    = Math.min(20, zoom + zoomSpeed);
        if (held.has("-") || held.has("_"))          newZoom    = Math.max(0,  zoom - zoomSpeed);
        if (held.has("e"))                           newBearing = (bearing + rotateSpeed) % 360;
        if (held.has("q"))                           newBearing = (bearing - rotateSpeed + 360) % 360;

        const panMoved    = newLat !== lat || newLon !== lon || newZoom !== zoom;
        const rotated     = newBearing !== bearing;

        if (panMoved) {
          globeAPI.move(newLat, newLon, newZoom);
          const store = useViewStore.getState();
          if (newLat !== lat || newLon !== lon) store.setPosition(newLat, newLon);
          if (newZoom !== zoom)                 store.setZoom(newZoom);
        }

        if (rotated) {
          const delta = newBearing - bearing;
          globeAPI.rotate(delta);
          useViewStore.getState().setBearing(newBearing);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    window.addEventListener("keydown",           onKeyDown);
    window.addEventListener("keyup",             onKeyUp);
    window.addEventListener("blur",              onBlur);
    window.addEventListener("sequence-consumed", onSequenceConsumed);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown",           onKeyDown);
      window.removeEventListener("keyup",             onKeyUp);
      window.removeEventListener("blur",              onBlur);
      window.removeEventListener("sequence-consumed", onSequenceConsumed);
    };
  }, []);
}
