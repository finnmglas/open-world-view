import type { MutableRefObject } from "react";

function zoomToAltitude(zoom: number): number {
  return Math.max(0.05, 2.5 / Math.pow(1.4, zoom));
}

/**
 * Singleton that holds a reference to the mounted Globe instance.
 *
 * Why a singleton instead of React state/context?
 * The Globe camera is an imperative WebGL object. Any path that goes through
 * React state triggers re-renders and batched effects, which queue multiple
 * overlapping pointOfView() animations and cause the "snap back" jitter.
 * By talking to the globe directly we skip that entirely.
 */
class GlobeAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _ref: MutableRefObject<any> | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(ref: MutableRefObject<any>) {
    this._ref = ref;
  }

  /** Instant camera repositioning — for keyboard/RAF-driven movement (0 ms). */
  move(lat: number, lon: number, zoom: number) {
    this._ref?.current?.pointOfView(
      { lat, lng: lon, altitude: zoomToAltitude(zoom) },
      0,
    );
  }

  /** Smooth animated fly-to — for command palette, chord go-to sequences. */
  flyTo(lat: number, lon: number, zoom: number, duration = 800) {
    this._ref?.current?.pointOfView(
      { lat, lng: lon, altitude: zoomToAltitude(zoom) },
      duration,
    );
  }
}

export const globeAPI = new GlobeAPI();
export { zoomToAltitude };
