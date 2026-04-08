"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ObservationMode = "idle" | "free" | "follow" | "orbit" | "survey" | "slew";

export type ViewState = {
  // --- Hydration ---
  hasHydrated: boolean;

  // --- Geographic position ---
  lat: number;          // decimal degrees, -90 to 90
  lon: number;          // decimal degrees, -180 to 180
  alt: number;          // altitude above ground level, meters

  // --- Camera orientation (intrinsic Euler angles) ---
  pitch: number;        // degrees: -90 (nadir) to +90 (zenith)
  roll: number;         // degrees: -180 to 180
  yaw: number;          // degrees: 0–360, clockwise from north

  // --- Map/scene view ---
  zoom: number;         // map zoom level (0–24)
  bearing: number;      // compass bearing the camera faces, 0–360°

  // --- Optics ---
  fov: number;          // horizontal field of view, degrees
  focalLength: number;  // focal length, mm
  aperture: number;     // f-stop (e.g. 2.8)

  // --- Sensor / imager ---
  sensorWidth: number;  // physical sensor width, mm
  sensorHeight: number; // physical sensor height, mm
  imageWidth: number;   // output image width, px
  imageHeight: number;  // output image height, px

  // --- Derived observation quality ---
  gsd: number;          // ground sample distance, m/px
  agl: number;          // above-ground-level height, meters
  slantRange: number;   // line-of-sight distance to target, meters

  // --- Look-at / target ---
  targetLat: number | null;
  targetLon: number | null;
  targetAlt: number | null; // MSL, meters
  targetAzimuth: number;    // horizontal bearing to target, degrees
  targetElevation: number;  // vertical angle to target, degrees (negative = below horizon)

  // --- Observation mode & tracking ---
  observationMode: ObservationMode;
  isTracking: boolean;
  trackingTargetId: string | null;

  // --- Time ---
  timestamp: number;    // unix ms – time of observation
  utcOffset: number;    // hours offset from UTC

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  setHasHydrated: (value: boolean) => void;

  setPosition: (lat: number, lon: number, alt?: number) => void;
  setAlt: (alt: number) => void;

  setOrientation: (pitch: number, roll: number, yaw: number) => void;
  setPitch: (pitch: number) => void;
  setRoll: (roll: number) => void;
  setYaw: (yaw: number) => void;

  setZoom: (zoom: number) => void;
  setBearing: (bearing: number) => void;

  setFov: (fov: number) => void;
  setFocalLength: (focalLength: number) => void;
  setAperture: (aperture: number) => void;

  setSensor: (width: number, height: number) => void;
  setImageSize: (width: number, height: number) => void;

  setGsd: (gsd: number) => void;
  setAgl: (agl: number) => void;
  setSlantRange: (slantRange: number) => void;

  setTarget: (
    lat: number | null,
    lon: number | null,
    alt?: number | null,
    azimuth?: number,
    elevation?: number,
  ) => void;
  clearTarget: () => void;

  setObservationMode: (mode: ObservationMode) => void;
  setTracking: (isTracking: boolean, targetId?: string | null) => void;

  setTimestamp: (timestamp: number) => void;
  setUtcOffset: (utcOffset: number) => void;

  reset: () => void;
};

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const defaults: Omit<
  ViewState,
  | "setHasHydrated"
  | "setPosition" | "setAlt"
  | "setOrientation" | "setPitch" | "setRoll" | "setYaw"
  | "setZoom" | "setBearing"
  | "setFov" | "setFocalLength" | "setAperture"
  | "setSensor" | "setImageSize"
  | "setGsd" | "setAgl" | "setSlantRange"
  | "setTarget" | "clearTarget"
  | "setObservationMode" | "setTracking"
  | "setTimestamp" | "setUtcOffset"
  | "reset"
> = {
  hasHydrated: false,

  lat: 48.8566,
  lon: 2.3522,
  alt: 500,

  pitch: -45,
  roll: 0,
  yaw: 0,

  zoom: 12,
  bearing: 0,

  fov: 60,
  focalLength: 35,
  aperture: 2.8,

  sensorWidth: 36,
  sensorHeight: 24,
  imageWidth: 4096,
  imageHeight: 2730,

  gsd: 0.3,
  agl: 500,
  slantRange: 707,

  targetLat: null,
  targetLon: null,
  targetAlt: null,
  targetAzimuth: 0,
  targetElevation: -45,

  observationMode: "idle",
  isTracking: false,
  trackingTargetId: null,

  timestamp: Date.now(),
  utcOffset: 0,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      ...defaults,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setPosition: (lat, lon, alt) =>
        set((s) => ({ lat, lon, alt: alt ?? s.alt })),
      setAlt: (alt) => set({ alt }),

      setOrientation: (pitch, roll, yaw) => set({ pitch, roll, yaw }),
      setPitch: (pitch) => set({ pitch }),
      setRoll: (roll) => set({ roll }),
      setYaw: (yaw) => set({ yaw }),

      setZoom: (zoom) => set({ zoom }),
      setBearing: (bearing) => set({ bearing }),

      setFov: (fov) => set({ fov }),
      setFocalLength: (focalLength) => set({ focalLength }),
      setAperture: (aperture) => set({ aperture }),

      setSensor: (sensorWidth, sensorHeight) => set({ sensorWidth, sensorHeight }),
      setImageSize: (imageWidth, imageHeight) => set({ imageWidth, imageHeight }),

      setGsd: (gsd) => set({ gsd }),
      setAgl: (agl) => set({ agl }),
      setSlantRange: (slantRange) => set({ slantRange }),

      setTarget: (targetLat, targetLon, targetAlt = null, targetAzimuth = 0, targetElevation = -45) =>
        set({ targetLat, targetLon, targetAlt, targetAzimuth, targetElevation }),
      clearTarget: () =>
        set({
          targetLat: null,
          targetLon: null,
          targetAlt: null,
          targetAzimuth: 0,
          targetElevation: -45,
        }),

      setObservationMode: (observationMode) => set({ observationMode }),
      setTracking: (isTracking, trackingTargetId = null) =>
        set({ isTracking, trackingTargetId }),

      setTimestamp: (timestamp) => set({ timestamp }),
      setUtcOffset: (utcOffset) => set({ utcOffset }),

      reset: () => set({ ...defaults, hasHydrated: true }),
    }),
    {
      name: "owv-view-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // don't persist ephemeral / computed fields
      partialize: (s) => ({
        lat: s.lat,
        lon: s.lon,
        alt: s.alt,
        pitch: s.pitch,
        roll: s.roll,
        yaw: s.yaw,
        zoom: s.zoom,
        bearing: s.bearing,
        fov: s.fov,
        focalLength: s.focalLength,
        aperture: s.aperture,
        sensorWidth: s.sensorWidth,
        sensorHeight: s.sensorHeight,
        imageWidth: s.imageWidth,
        imageHeight: s.imageHeight,
        observationMode: s.observationMode,
        utcOffset: s.utcOffset,
      }),
    },
  ),
);
