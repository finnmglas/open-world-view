"use client";

import { useEffect, useRef } from "react";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI } from "@/lib/globe-api";

const PAN_KEYS    = new Set(["w","a","s","d","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);
const ZOOM_KEYS   = new Set(["+","=","-","_"," ","c"]);  // " " = Space
const TILT_KEYS   = new Set(["2","x"]);
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
  const stateRef = useRef({ lat: 0, lon: 0, zoom: 12, bearing: 0, pitch: -45 });

  useEffect(() => {
    const s = useViewStore.getState();
    stateRef.current = { lat: s.lat, lon: s.lon, zoom: s.zoom, bearing: s.bearing, pitch: s.pitch };
    return useViewStore.subscribe((s) => {
      stateRef.current = { lat: s.lat, lon: s.lon, zoom: s.zoom, bearing: s.bearing, pitch: s.pitch };
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
      held.delete(key);       // drop it if already added this frame
      seqBlocked.add(key);    // block until keyup
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") { shiftHeld.current = true; return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;   // never intercept modified keys
      if (seqBlocked.has(e.key)) return;
      const relevant =
        PAN_KEYS.has(e.key)    ||
        ZOOM_KEYS.has(e.key)   ||
        TILT_KEYS.has(e.key)   ||
        ROTATE_KEYS.has(e.key);
      if (relevant) { e.preventDefault(); held.add(e.key); }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") { shiftHeld.current = false; return; }
      held.delete(e.key);
      seqBlocked.delete(e.key);
    };

    const onBlur = () => { held.clear(); shiftHeld.current = false; seqBlocked.clear(); };

    let raf: number;

    const tick = () => {
      if (held.size > 0 && !isTyping()) {
        const { lat, lon, zoom, bearing, pitch } = stateRef.current;
        const mult = shiftHeld.current ? 4 : 1;

        const panSpeed    = (0.4 / Math.pow(2, zoom * 0.65)) * mult;
        const zoomSpeed   = 0.04 * mult;
        const rotateSpeed = 0.8  * mult; // degrees/frame
        const tiltSpeed   = 0.5  * mult; // degrees/frame

        let newLat     = lat;
        let newLon     = lon;
        let newZoom    = zoom;
        let newBearing = bearing;
        let newPitch   = pitch;

        // N/S — 3-D Rodrigues rotation via globeAPI so poles are crossed cleanly.
        // panNS calls setPosition internally, which updates stateRef synchronously
        // via the zustand subscription, so E/W below reads the post-NS position.
        if (held.has("w") || held.has("ArrowUp"))   globeAPI.panNS( panSpeed);
        if (held.has("s") || held.has("ArrowDown"))  globeAPI.panNS(-panSpeed);

        // E/W — read from stateRef (updated by panNS if it just ran)
        const curLat = stateRef.current.lat;
        const curLon = stateRef.current.lon;
        if (held.has("d") || held.has("ArrowRight")) newLon = ((curLon + panSpeed + 180) % 360) - 180;
        if (held.has("a") || held.has("ArrowLeft"))  newLon = ((curLon - panSpeed + 180) % 360) - 180;
        if (newLon !== lon) newLat = curLat;  // carry updated lat into panMoved check

        // Zoom — Space zooms in; C zooms out (shift on either = 4× speed)
        if (held.has("+") || held.has("=") || held.has(" "))
          newZoom = Math.min(20, zoom + zoomSpeed);
        if (held.has("-") || held.has("_") || held.has("c"))
          newZoom = Math.max(0,  zoom - zoomSpeed);

        // Rotate (bearing)
        if (held.has("e")) newBearing = (bearing + rotateSpeed) % 360;
        if (held.has("q")) newBearing = (bearing - rotateSpeed + 360) % 360;

        // Tilt (pitch elevation)
        // 2 = tilt up (toward zenith / space); x = tilt down (toward nadir)
        if (held.has("2")) newPitch = Math.min(90,  pitch + tiltSpeed);
        if (held.has("x")) newPitch = Math.max(-90, pitch - tiltSpeed);

        // panNS already called globeAPI + setPosition for N/S.
        // Here we only need to push E/W and zoom changes.
        const ewMoved   = newLon !== lon;
        const zoomMoved = newZoom !== zoom;
        const rotated   = newBearing !== bearing;
        const tilted    = newPitch !== pitch;

        if (ewMoved || zoomMoved) {
          const activeLat = stateRef.current.lat;
          const activeLon = ewMoved ? newLon : stateRef.current.lon;
          globeAPI.move(activeLat, activeLon, newZoom);
          const store = useViewStore.getState();
          if (ewMoved)   store.setPosition(activeLat, activeLon);
          if (zoomMoved) store.setZoom(newZoom);
        }

        if (rotated) {
          globeAPI.rotate(newBearing - bearing);
          useViewStore.getState().setBearing(newBearing);
        }

        if (tilted) {
          globeAPI.tilt(newPitch - pitch);
          useViewStore.getState().setPitch(newPitch);
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
