// responsible: finn
// websocket event bus — singleton client with auto-reconnect and channel subscriptions

export type WsStatus = "connecting" | "connected" | "disconnected" | "reconnecting"

export interface WsEvent {
  event: string
  channel: string
  data: Record<string, unknown>
  ts: number
}

export interface WsStats {
  status: WsStatus
  messagesReceived: number
  reconnects: number
  lastEvent: WsEvent | null
  latencyMs: number | null
  connectedAt: number | null
  subscriptions: string[]
}

type ChannelHandler = (event: WsEvent) => void
type StatsListener = (stats: WsStats) => void

const INITIAL_STATS: WsStats = {
  status: "disconnected",
  messagesReceived: 0,
  reconnects: 0,
  lastEvent: null,
  latencyMs: null,
  connectedAt: null,
  subscriptions: [],
}

class WsEventBus {
  private ws: WebSocket | null = null
  private readonly url: string
  private handlers = new Map<string, Set<ChannelHandler>>()
  private globalHandlers = new Set<ChannelHandler>()
  private statsListeners = new Set<StatsListener>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1_000
  private readonly maxDelay = 30_000
  private pendingChannels = new Set<string>()
  private stats: WsStats = { ...INITIAL_STATS }

  constructor(url: string) {
    this.url = url
  }

  // ── public API ──────────────────────────────────────────────────────────────

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.patch({ status: "connecting" })
    // Resolve URL at connection time — always client-side (called from useEffect)
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
    const url = `${proto}//${window.location.host}${this.url}`
    this.ws = new WebSocket(url)
    this.ws.onopen = this.onOpen
    this.ws.onmessage = this.onMessage
    this.ws.onclose = this.onClose
    this.ws.onerror = () => this.ws?.close()
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.patch({ status: "disconnected" })
  }

  /** Subscribe to a channel. Returns an unsubscribe function. */
  subscribe(channel: string, handler: ChannelHandler): () => void {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set())
    this.handlers.get(channel)!.add(handler)
    this.pendingChannels.add(channel)
    this.patch({ subscriptions: [...this.pendingChannels] })
    if (this.ws?.readyState === WebSocket.OPEN) this.send({ action: "subscribe", channel })
    return () => this.removeHandler(channel, handler)
  }

  /** Listen to every event on every channel. Returns an unsubscribe function. */
  onAny(handler: ChannelHandler): () => void {
    this.globalHandlers.add(handler)
    return () => this.globalHandlers.delete(handler)
  }

  /** Register a stats listener — called immediately with current snapshot. Returns unsubscribe. */
  onStats(listener: StatsListener): () => void {
    this.statsListeners.add(listener)
    listener({ ...this.stats })
    return () => this.statsListeners.delete(listener)
  }

  /** Fire a ping to measure round-trip latency. */
  ping(): void {
    this.send({ action: "ping", ts: Date.now() })
  }

  /** Broadcast an event on a channel — server distributes to subscribers. */
  emit(channel: string, event: string, data: Record<string, unknown>): void {
    this.send({ action: "broadcast", channel, event, data })
  }

  getStats(): WsStats {
    return { ...this.stats }
  }

  // ── internals ────────────────────────────────────────────────────────────────

  private onOpen = () => {
    this.reconnectDelay = 1_000
    this.patch({ status: "connected", connectedAt: Date.now() })
    for (const channel of this.pendingChannels) this.send({ action: "subscribe", channel })
  }

  private onMessage = (e: MessageEvent) => {
    const event: WsEvent = JSON.parse(e.data as string)
    const updates: Partial<WsStats> = {
      messagesReceived: this.stats.messagesReceived + 1,
      lastEvent: event,
    }
    if (event.event === "pong" && typeof event.data.ts === "number") {
      updates.latencyMs = Date.now() - event.data.ts
    }
    this.patch(updates)
    this.handlers.get(event.channel)?.forEach((h) => h(event))
    this.globalHandlers.forEach((h) => h(event))
  }

  private onClose = () => {
    this.patch({ status: "reconnecting" })
    this.reconnectTimer = setTimeout(() => {
      this.patch({ reconnects: this.stats.reconnects + 1 })
      this.connect()
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay)
  }

  private removeHandler(channel: string, handler: ChannelHandler): void {
    this.handlers.get(channel)?.delete(handler)
    if (this.handlers.get(channel)?.size === 0) {
      this.handlers.delete(channel)
      this.pendingChannels.delete(channel)
      this.patch({ subscriptions: [...this.pendingChannels] })
      this.send({ action: "unsubscribe", channel })
    }
  }

  private send(payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload))
  }

  private patch(updates: Partial<WsStats>): void {
    this.stats = { ...this.stats, ...updates }
    this.statsListeners.forEach((l) => l({ ...this.stats }))
  }
}

export const wsEventBus = new WsEventBus("/ws")
