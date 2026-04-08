/**
 * Framework-agnostic globe camera singleton.
 *
 * Any globe backend (react-globe.gl, CesiumJS, …) calls globeAPI.register()
 * with concrete implementations of move / flyTo / rotate.
 * The rest of the app (keyboard controls, command palette, etc.) calls the
 * three public methods without knowing which renderer is active.
 */

export interface GlobeHandlers {
  move:   (lat: number, lon: number, zoom: number) => void;
  flyTo:  (lat: number, lon: number, zoom: number, durationMs?: number) => void;
  rotate: (delta: number) => void;
}

class GlobeAPI {
  private h: GlobeHandlers | null = null;

  register(handlers: GlobeHandlers) {
    this.h = handlers;
  }

  /** Instant repositioning — used by the keyboard RAF loop. */
  move(lat: number, lon: number, zoom: number) {
    this.h?.move(lat, lon, zoom);
  }

  /** Animated fly-to — used by chords and command palette. */
  flyTo(lat: number, lon: number, zoom: number, durationMs = 800) {
    this.h?.flyTo(lat, lon, zoom, durationMs);
  }

  /** Bearing rotation — used by Q/E keys. */
  rotate(delta: number) {
    this.h?.rotate(delta);
  }
}

export const globeAPI = new GlobeAPI();

// ---------------------------------------------------------------------------
// Shared zoom ↔ scale helpers (used by multiple backends)
// ---------------------------------------------------------------------------

/** react-globe.gl altitude (multiples of Earth radius) */
export function zoomToAltitude(zoom: number): number {
  return Math.max(0.05, 2.5 / Math.pow(1.4, zoom));
}

/** Cesium camera height in metres */
export function zoomToHeight(zoom: number): number {
  return Math.max(1000, 2e7 / Math.pow(2, zoom * 0.9));
}

export function heightToZoom(height: number): number {
  return Math.max(0, Math.log2(2e7 / Math.max(height, 1000)) / 0.9);
}
