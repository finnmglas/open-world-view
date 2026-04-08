"use client"

// responsible: finn
// react hooks for the websocket event bus

import { useEffect, useRef, useState } from "react"
import { wsEventBus, WsEvent, WsStats } from "@/lib/ws"

/** Reactive snapshot of WsEventBus stats. Triggers bus.connect() on first mount. */
export function useWsStats(): WsStats {
  const [stats, setStats] = useState<WsStats>(() => wsEventBus.getStats())

  useEffect(() => {
    wsEventBus.connect()
    return wsEventBus.onStats(setStats)
  }, [])

  return stats
}

/**
 * Subscribe to a channel for the lifetime of the component.
 * Handler reference is stabilised via ref — no need to memoize at call site.
 */
export function useWsChannel(channel: string, handler: (event: WsEvent) => void): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const stable = (e: WsEvent) => handlerRef.current(e)
    return wsEventBus.subscribe(channel, stable)
  }, [channel])
}
