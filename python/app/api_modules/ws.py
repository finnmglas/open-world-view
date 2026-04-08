# responsible: finn
# websocket endpoints — event bus gateway + stats

import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.event_bus import bus


def register_ws_eps(app: FastAPI) -> None:

    @app.websocket("/ws")
    async def websocket_endpoint(ws: WebSocket) -> None:
        conn_id = str(uuid.uuid4())[:8]
        await bus.connect(ws, conn_id)
        try:
            while True:
                msg = await ws.receive_json()
                action = msg.get("action")

                if action == "subscribe":
                    channel = msg.get("channel", "")
                    bus.subscribe(conn_id, channel)
                    await bus.emit_to(conn_id, "system", "subscribed", {"channel": channel})

                elif action == "unsubscribe":
                    channel = msg.get("channel", "")
                    bus.unsubscribe(conn_id, channel)
                    await bus.emit_to(conn_id, "system", "unsubscribed", {"channel": channel})

                elif action == "ping":
                    await bus.emit_to(conn_id, "system", "pong", {"ts": msg.get("ts")})

                elif action == "broadcast":
                    await bus.broadcast(
                        msg.get("channel", ""),
                        msg.get("event", "message"),
                        msg.get("data", {}),
                    )

        except WebSocketDisconnect:
            bus.disconnect(conn_id)

    @app.get("/ws/stats")
    def ws_stats() -> dict:
        return bus.stats
