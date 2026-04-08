"use client";

import { useViewStore } from "@/hooks/view-store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type RowProps = { label: string; value: React.ReactNode; unit?: string };

function Row({ label, value, unit }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <span className="text-xs text-muted-foreground font-mono shrink-0">{label}</span>
      <span className="text-xs font-mono text-foreground tabular-nums">
        {value}
        {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

type SectionProps = { title: string; children: React.ReactNode };

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

function fmt(n: number | null, decimals = 4): string {
  if (n === null) return "—";
  return n.toFixed(decimals);
}

export function ViewStatePanel() {
  const s = useViewStore();

  if (!s.hasHydrated) {
    return (
      <div className="w-full max-w-2xl rounded border border-border bg-card p-6">
        <p className="text-xs font-mono text-muted-foreground animate-pulse">
          hydrating store…
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded border border-border bg-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          view store
        </p>
        <Badge
          variant={s.isTracking ? "default" : "secondary"}
          className="text-[10px] font-mono uppercase"
        >
          {s.observationMode}
          {s.isTracking && s.trackingTargetId && ` · ${s.trackingTargetId}`}
        </Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {/* Position */}
        <Section title="Position">
          <Row label="lat" value={fmt(s.lat, 6)} unit="°" />
          <Row label="lon" value={fmt(s.lon, 6)} unit="°" />
          <Row label="alt" value={fmt(s.alt, 1)} unit="m MSL" />
          <Row label="agl" value={fmt(s.agl, 1)} unit="m AGL" />
        </Section>

        {/* Orientation */}
        <Section title="Orientation">
          <Row label="pitch" value={fmt(s.pitch, 2)} unit="°" />
          <Row label="roll" value={fmt(s.roll, 2)} unit="°" />
          <Row label="yaw" value={fmt(s.yaw, 2)} unit="°" />
          <Row label="bearing" value={fmt(s.bearing, 2)} unit="°" />
        </Section>

        {/* View */}
        <Section title="View">
          <Row label="zoom" value={fmt(s.zoom, 2)} />
          <Row label="fov" value={fmt(s.fov, 1)} unit="°" />
          <Row label="slant range" value={fmt(s.slantRange, 1)} unit="m" />
          <Row label="gsd" value={fmt(s.gsd, 4)} unit="m/px" />
        </Section>

        {/* Optics */}
        <Section title="Optics">
          <Row label="focal length" value={fmt(s.focalLength, 1)} unit="mm" />
          <Row label="aperture" value={`f/${fmt(s.aperture, 1)}`} />
          <Row label="sensor" value={`${fmt(s.sensorWidth, 1)} × ${fmt(s.sensorHeight, 1)}`} unit="mm" />
          <Row label="image" value={`${s.imageWidth} × ${s.imageHeight}`} unit="px" />
        </Section>

        {/* Target */}
        <Section title="Target">
          <Row label="lat" value={fmt(s.targetLat, 6)} unit="°" />
          <Row label="lon" value={fmt(s.targetLon, 6)} unit="°" />
          <Row label="alt" value={fmt(s.targetAlt, 1)} unit="m" />
          <Row label="azimuth" value={fmt(s.targetAzimuth, 2)} unit="°" />
          <Row label="elevation" value={fmt(s.targetElevation, 2)} unit="°" />
        </Section>

        {/* Time */}
        <Section title="Time">
          <Row
            label="timestamp"
            value={new Date(s.timestamp).toISOString().replace("T", " ").slice(0, 19)}
            unit="UTC"
          />
          <Row label="utc offset" value={fmt(s.utcOffset, 1)} unit="h" />
        </Section>
      </div>
    </div>
  );
}
