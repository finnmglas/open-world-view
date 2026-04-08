"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useViewStore, type GlobeType } from "@/hooks/view-store";
import { useDataSources } from "@/hooks/use-data-sources";
import { useLiveSources } from "@/hooks/use-live-sources";
import { SOURCES } from "@/lib/live-data";

const GLOBE_OPTIONS: { value: GlobeType; label: string; description: string }[] = [
  { value: "cesium",  label: "CesiumJS",       description: "3D photorealistic globe" },
  { value: "globe",   label: "react-globe.gl",  description: "Three.js WebGL globe"   },
];

export function ViewSettingsPanel() {
  const globeType    = useViewStore((s) => s.globeType);
  const setGlobeType = useViewStore((s) => s.setGlobeType);

  const { enabled, running, toggleSource } = useDataSources();

  // Mount WS subscriptions + backend sync exactly once here
  useLiveSources();

  return (
    <div className="rounded border border-border bg-card p-4 shadow-2xl space-y-4">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        View Settings
      </p>

      {/* Globe renderer */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Globe renderer</label>
        <Select
          value={globeType}
          onValueChange={(v) => setGlobeType(v as GlobeType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GLOBE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="font-medium">{opt.label}</span>
                <span className="ml-2 text-muted-foreground text-xs">{opt.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Live data sources */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
          Live data
        </p>
        {SOURCES.map((src) => {
          const isEnabled = !!enabled[src.key];
          const isRunning = !!running[src.key];

          return (
            <button
              key={src.key}
              onClick={() => toggleSource(src.key)}
              className={[
                "flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                isEnabled
                  ? "bg-muted/60 hover:bg-muted"
                  : "hover:bg-muted/30",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* status dot */}
                <span
                  className="size-2 shrink-0 rounded-full transition-colors"
                  style={{ backgroundColor: isRunning ? src.color : "rgba(100,100,100,0.4)" }}
                />
                <span className={isEnabled ? "text-foreground" : "text-muted-foreground"}>
                  {src.label}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/50 shrink-0">
                {src.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
