"use client";

// responsible: finn
// zustand store for live data source state + data arrays

import { create } from "zustand";
import {
  SourceKey,
  EarthquakeItem,
  PlaneItem,
  SatelliteItem,
  BoatItem,
  LightningItem,
} from "@/lib/live-data";

const LIGHTNING_WINDOW = 300; // keep last N strikes

interface DataSourcesState {
  // user-toggled on/off
  enabled: Partial<Record<SourceKey, boolean>>;
  // backend confirmed running
  running: Partial<Record<SourceKey, boolean>>;
  // data arrays
  earthquakes: EarthquakeItem[];
  planes:      PlaneItem[];
  satellites:  SatelliteItem[];
  boats:       BoatItem[];
  lightning:   LightningItem[];

  // actions
  setRunning:    (key: SourceKey, value: boolean) => void;
  setEarthquakes:(items: EarthquakeItem[]) => void;
  setPlanes:     (items: PlaneItem[]) => void;
  setSatellites: (items: SatelliteItem[]) => void;
  pushBoat:      (item: BoatItem) => void;
  pushLightning: (item: LightningItem) => void;
  clearSource:   (key: SourceKey) => void;
  toggleSource:  (key: SourceKey) => Promise<void>;
}

export const useDataSources = create<DataSourcesState>((set, get) => ({
  enabled:    {},
  running:    {},
  earthquakes: [],
  planes:      [],
  satellites:  [],
  boats:       [],
  lightning:   [],

  setRunning: (key, value) =>
    set((s) => ({ running: { ...s.running, [key]: value } })),

  setEarthquakes: (items) => set({ earthquakes: items }),
  setPlanes:      (items) => set({ planes: items }),
  setSatellites:  (items) => set({ satellites: items }),

  pushBoat: (item) =>
    set((s) => {
      const idx = s.boats.findIndex((b) => b.mmsi === item.mmsi);
      if (idx >= 0) {
        const next = [...s.boats];
        next[idx] = item;
        return { boats: next };
      }
      return { boats: [...s.boats, item] };
    }),

  pushLightning: (item) =>
    set((s) => ({
      lightning:
        s.lightning.length < LIGHTNING_WINDOW
          ? [...s.lightning, item]
          : [...s.lightning.slice(1), item],
    })),

  clearSource: (key) => {
    const reset: Partial<DataSourcesState> = {};
    if (key === "earthquakes") reset.earthquakes = [];
    if (key === "planes")      reset.planes      = [];
    if (key === "satellites")  reset.satellites  = [];
    if (key === "boats")       reset.boats       = [];
    if (key === "lightning")   reset.lightning   = [];
    set(reset);
  },

  toggleSource: async (key) => {
    const { enabled, clearSource, setRunning } = get();
    const nowEnabled = !enabled[key];

    set((s) => ({ enabled: { ...s.enabled, [key]: nowEnabled } }));

    try {
      const action = nowEnabled ? "start" : "stop";
      const res = await fetch(`/api/data/${key}/${action}`, { method: "POST" });
      if (res.ok) {
        setRunning(key, nowEnabled);
        if (!nowEnabled) clearSource(key);
      } else {
        // revert toggle on failure
        set((s) => ({ enabled: { ...s.enabled, [key]: !nowEnabled } }));
      }
    } catch {
      set((s) => ({ enabled: { ...s.enabled, [key]: !nowEnabled } }));
    }
  },
}));
