# responsible: finn
# event bus — manages websocket connections, channel subscriptions, and broadcasts

import json
import time
from collections import defaultdict

from fastapi import WebSocket


class EventBus:
    def __init__(self) -> None:
        self._connections: dict[str, WebSocket] = {}
        self._subscriptions: dict[str, set[str]] = defaultdict(set)  # channel → {conn_ids}
        self._conn_channels: dict[str, set[str]] = defaultdict(set)  # conn_id → {channels}

    async def connect(self, ws: WebSocket, conn_id: str) -> None:
        await ws.accept()
        self._connections[conn_id] = ws
        await self.emit_to(conn_id, "system", "connected", {"conn_id": conn_id})

    def disconnect(self, conn_id: str) -> None:
        for channel in self._conn_channels.pop(conn_id, set()):
            self._subscriptions[channel].discard(conn_id)
        self._connections.pop(conn_id, None)

    def subscribe(self, conn_id: str, channel: str) -> None:
        self._subscriptions[channel].add(conn_id)
        self._conn_channels[conn_id].add(channel)

    def unsubscribe(self, conn_id: str, channel: str) -> None:
        self._subscriptions[channel].discard(conn_id)
        self._conn_channels[conn_id].discard(channel)

    async def broadcast(self, channel: str, event: str, data: dict) -> None:
        """Send to all subscribers of a channel."""
        payload = self._pack(event, channel, data)
        dead: list[str] = []
        for conn_id in set(self._subscriptions.get(channel, set())):
            ws = self._connections.get(conn_id)
            if not ws:
                continue
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(conn_id)
        for conn_id in dead:
            self.disconnect(conn_id)

    async def broadcast_all(self, event: str, data: dict) -> None:
        """Send to every connected client regardless of subscriptions."""
        payload = self._pack(event, "*", data)
        dead: list[str] = []
        for conn_id, ws in list(self._connections.items()):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(conn_id)
        for conn_id in dead:
            self.disconnect(conn_id)

    async def emit_to(self, conn_id: str, channel: str, event: str, data: dict) -> None:
        """Send directly to a single connection."""
        ws = self._connections.get(conn_id)
        if not ws:
            return
        try:
            await ws.send_text(self._pack(event, channel, data))
        except Exception:
            self.disconnect(conn_id)

    @staticmethod
    def _pack(event: str, channel: str, data: dict) -> str:
        return json.dumps({"event": event, "channel": channel, "data": data, "ts": time.time()})

    @property
    def stats(self) -> dict:
        return {
            "connections": len(self._connections),
            "channels": {ch: len(subs) for ch, subs in self._subscriptions.items() if subs},
        }


bus = EventBus()
