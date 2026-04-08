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

  /**
   * Rotate the globe view bearing by `delta` degrees (positive = clockwise).
   *
   * Achieved by rotating the camera's "up" vector around the axis that points
   * from the camera toward the globe center (the view direction). This keeps
   * the camera at the same lat/lon/altitude while spinning North on screen.
   *
   * Uses the Rodrigues rotation formula — no Three.js import needed.
   */
  rotate(delta: number) {
    const globe = this._ref?.current;
    if (!globe) return;

    const camera   = globe.camera()   as { position: Vec3; up: Vec3 };
    const controls = globe.controls() as { update: () => void };

    const rad  = (delta * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    // Axis = unit vector from camera toward globe center ( −normalize(position) )
    const { x: px, y: py, z: pz } = camera.position;
    const len = Math.sqrt(px * px + py * py + pz * pz);
    if (len === 0) return;
    const ax = -px / len, ay = -py / len, az = -pz / len;

    const rot = (vx: number, vy: number, vz: number) => {
      const dot = ax * vx + ay * vy + az * vz;
      return {
        x: vx * cosR + (ay * vz - az * vy) * sinR + ax * dot * (1 - cosR),
        y: vy * cosR + (az * vx - ax * vz) * sinR + ay * dot * (1 - cosR),
        z: vz * cosR + (ax * vy - ay * vx) * sinR + az * dot * (1 - cosR),
      };
    };

    const { x, y, z } = rot(camera.up.x, camera.up.y, camera.up.z);
    camera.up.x = x; camera.up.y = y; camera.up.z = z;
    controls.update();
  }
}

type Vec3 = { x: number; y: number; z: number };

export const globeAPI = new GlobeAPI();
export { zoomToAltitude };
