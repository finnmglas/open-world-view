"use client";

// responsible: finn
// Manages WS subscriptions for all active live data sources.
// Mount this hook exactly once (in ViewSettingsPanel which is always visible).

import { useEffect, useRef } from "react";
import { wsEventBus, WsEvent } from "@/lib/ws";
import { useDataSources } from "@/hooks/use-data-sources";
import { SourceKey, SOURCES } from "@/lib/live-data";

export function useLiveSources() {
  const { enabled, setRunning, setEarthquakes, setPlanes, setSatellites, pushBoat, pushLightning } =
    useDataSources();

  // unsubscribe refs per channel — avoids re-subscribing on every render
  const unsubsRef = useRef<Partial<Record<SourceKey, () => void>>>({});

  // Sync running state from backend on mount
  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((data: Record<string, { running: boolean }>) => {
        for (const key of Object.keys(data) as SourceKey[]) {
          if (data[key]?.running !== undefined) setRunning(key, data[key].running);
        }
      })
      .catch(() => {/* ignore — backend may not be up */});
  }, [setRunning]);

  // Subscribe / unsubscribe per source as enabled changes.
  // wsEventBus.subscribe() sends the WS subscribe message automatically
  // and its returned unsub sends unsubscribe when the last handler drops.
  useEffect(() => {
    for (const src of SOURCES) {
      const key = src.key;
      const isEnabled = !!enabled[key];
      const alreadySubscribed = !!unsubsRef.current[key];

      if (isEnabled && !alreadySubscribed) {
        const handler = (e: WsEvent) => {
          // Polling sources: data = { count, items: [...] }
          // Streaming sources (boats, lightning): data is the record itself
          if (key === "earthquakes" && e.event === "update")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setEarthquakes((e.data as any).items ?? []);
          else if (key === "planes" && e.event === "update")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPlanes((e.data as any).items ?? []);
          else if (key === "satellites" && e.event === "update")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setSatellites((e.data as any).items ?? []);
          else if (key === "boats" && e.event === "vessel")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pushBoat(e.data as any);
          else if (key === "lightning" && e.event === "strike")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pushLightning(e.data as any);
        };
        unsubsRef.current[key] = wsEventBus.subscribe(src.channel, handler);
      }

      if (!isEnabled && alreadySubscribed) {
        unsubsRef.current[key]?.();
        delete unsubsRef.current[key];
      }
    }
  }, [enabled, setEarthquakes, setPlanes, setSatellites, pushBoat, pushLightning]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      for (const unsub of Object.values(unsubsRef.current)) unsub?.();
      unsubsRef.current = {};
    };
  }, []);
}
