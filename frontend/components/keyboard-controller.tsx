"use client";

import { useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useKeyboardControls } from "@/hooks/use-keyboard-controls";
import { useKeySequence } from "@/hooks/use-key-sequence";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI } from "@/lib/globe-api";

// ---------------------------------------------------------------------------
// Go-to destinations for "g + <key>" sequences
// ---------------------------------------------------------------------------
const DESTINATIONS: Record<string, { label: string; lat: number; lon: number; zoom?: number }> = {
  p: { label: "Paris",     lat: 48.8566,   lon:   2.3522,  zoom: 11 },
  l: { label: "London",    lat: 51.5074,   lon:  -0.1278,  zoom: 11 },
  n: { label: "New York",  lat: 40.7128,   lon: -74.0060,  zoom: 11 },
  t: { label: "Tokyo",     lat: 35.6762,   lon: 139.6503,  zoom: 11 },
  s: { label: "Sydney",    lat: -33.8688,  lon: 151.2093,  zoom: 11 },
  b: { label: "Berlin",    lat: 52.5200,   lon:  13.4050,  zoom: 11 },
  d: { label: "Dubai",     lat: 25.2048,   lon:  55.2708,  zoom: 11 },
  r: { label: "Rio",       lat: -22.9068,  lon: -43.1729,  zoom: 11 },
  m: { label: "Mumbai",    lat: 19.0760,   lon:  72.8777,  zoom: 11 },
  k: { label: "Nairobi",   lat: -1.2921,   lon:  36.8219,  zoom: 11 },
  c: { label: "Cape Town", lat: -33.9249,  lon:  18.4241,  zoom: 11 },
  i: { label: "Istanbul",  lat: 41.0082,   lon:  28.9784,  zoom: 11 },
  h: { label: "Home",      lat: 48.8566,   lon:   2.3522,  zoom:  4 },
};

// ---------------------------------------------------------------------------
// Props for optional callbacks the layout can inject
// ---------------------------------------------------------------------------
interface KeyboardControllerProps {
  onOpenCommandPalette: () => void;
  onTogglePanels: () => void;
}

export function KeyboardController({
  onOpenCommandPalette,
  onTogglePanels,
}: KeyboardControllerProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const setPosition = useViewStore((s) => s.setPosition);
  const setZoom     = useViewStore((s) => s.setZoom);

  // WASD / arrow smooth navigation
  useKeyboardControls();

  // Build chord map for "g + <key>" fly-to sequences
  const sequences = useMemo(() => {
    const map: Record<string, () => void> = {};
    for (const [key, dest] of Object.entries(DESTINATIONS)) {
      map[`g${key}`] = () => {
        const zoom = dest.zoom ?? 11;
        globeAPI.flyTo(dest.lat, dest.lon, zoom);
        setPosition(dest.lat, dest.lon);
        setZoom(zoom);
      };
    }
    return map;
  }, [setPosition, setZoom]);

  const { buffer } = useKeySequence(sequences);

  // Show a small sequence hint in the DOM via a custom event so the overlay
  // component can react without prop-drilling.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sequence-buffer", { detail: buffer }));
  }, [buffer]);

  // Global shortcut handler for Ctrl+K, Ctrl+D, ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);

      // Ctrl+K — command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // Ctrl+D — toggle dark/light mode
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        return;
      }

      if (typing) return;

      // ? — toggle side panels
      if (e.key === "?") {
        e.preventDefault();
        onTogglePanels();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedTheme, setTheme, onOpenCommandPalette, onTogglePanels]);

  // Expose DESTINATIONS for other components to consume (e.g. command palette)
  return null;
}

// Re-export so consumers can build command lists without importing this file
export { DESTINATIONS };
