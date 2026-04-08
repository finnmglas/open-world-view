"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useViewStore, type GlobeType } from "@/hooks/view-store";

const GLOBE_OPTIONS: { value: GlobeType; label: string; description: string }[] = [
  { value: "cesium",  label: "CesiumJS",       description: "3D photorealistic globe" },
  { value: "globe",   label: "react-globe.gl",  description: "Three.js WebGL globe"   },
];

export function ViewSettingsPanel() {
  const globeType    = useViewStore((s) => s.globeType);
  const setGlobeType = useViewStore((s) => s.setGlobeType);

  return (
    <div className="rounded border border-border bg-card p-4 shadow-2xl">
      <p className="mb-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        View Settings
      </p>

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
    </div>
  );
}
