# responsible: finn
# fastapi app endpoints main thing for api

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"healthy": True}


@app.get("/ping")
def ping():
    return {"pong": True, "message": "Backend is ALIVE and connected to the frontend!"}