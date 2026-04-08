"use client"

// responsible: finn
// websocket debug card — live event bus stats for the dashboard

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useWsStats } from "@/hooks/use-ws"
import { wsEventBus, WsStatus } from "@/lib/ws"

// ── sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: WsStatus }) {
  const cls: Record<WsStatus, string> = {
    connected:    "bg-green-400",
    connecting:   "bg-yellow-400 animate-pulse",
    reconnecting: "bg-orange-400 animate-pulse",
    disconnected: "bg-red-500",
  }
  return <span className={`inline-block size-2 rounded-full ${cls[status]}`} />
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-xs text-muted-foreground font-mono shrink-0">{label}</span>
      <span className="text-xs font-mono text-foreground tabular-nums">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
        {title}
      </p>
      {children}
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1_000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function formatUtc(unixSec: number): string {
  return new Date(unixSec * 1_000).toISOString().replace("T", " ").slice(11, 19) + " UTC"
}

// ── main component ────────────────────────────────────────────────────────────

export function WsDebugCard() {
  const stats = useWsStats()
  const [now, setNow] = useState(() => Date.now())

  // Tick every second so "connected for" updates live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [])

  const handlePing = useCallback(() => wsEventBus.ping(), [])

  const connectedFor =
    stats.status === "connected" && stats.connectedAt != null
      ? formatDuration(now - stats.connectedAt)
      : "—"

  return (
    <div className="w-full max-w-2xl rounded border border-border bg-card p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          websocket bus
        </p>
        <div className="flex items-center gap-2">
          <StatusDot status={stats.status} />
          <Badge variant="outline" className="text-[10px] font-mono uppercase">
            {stats.status}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Connection */}
      <Section title="Connection">
        <Row label="connected for" value={connectedFor} />
        <Row label="reconnects"    value={stats.reconnects} />
        <Row label="endpoint"      value="/ws" />
      </Section>

      {/* Traffic */}
      <Section title="Traffic">
        <Row label="messages rx" value={stats.messagesReceived} />
        <Row
          label="latency"
          value={
            <span className="flex items-center gap-1.5 justify-end">
              <span>{stats.latencyMs != null ? `${stats.latencyMs} ms` : "—"}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-4 px-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                onClick={handlePing}
                disabled={stats.status !== "connected"}
              >
                ping
              </Button>
            </span>
          }
        />
      </Section>

      {/* Active subscriptions */}
      {stats.subscriptions.length > 0 && (
        <Section title="Subscriptions">
          <div className="flex flex-wrap gap-1 mt-1">
            {stats.subscriptions.map((ch) => (
              <Badge key={ch} variant="secondary" className="text-[10px] font-mono">
                {ch}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Last event */}
      {stats.lastEvent && (
        <Section title="Last Event">
          <Row label="channel" value={stats.lastEvent.channel} />
          <Row label="event"   value={stats.lastEvent.event} />
          <Row label="at"      value={formatUtc(stats.lastEvent.ts)} />
          {Object.keys(stats.lastEvent.data).length > 0 && (
            <div className="mt-1.5 rounded bg-muted/40 px-2 py-1.5 font-mono text-[10px] text-muted-foreground break-all">
              {JSON.stringify(stats.lastEvent.data)}
            </div>
          )}
        </Section>
      )}

    </div>
  )
}
