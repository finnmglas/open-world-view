# responsible: finn
# general endpoints: root, health, ping

from fastapi import FastAPI


def register_general_eps(app: FastAPI):

    @app.get("/")
    def root():
        return {"status": "ok"}

    @app.get("/health")
    def health():
        return {"healthy": True}

    @app.get("/ping")
    def ping():
        return {"pong": True, "message": "Backend is ALIVE and connected to the frontend!"}
