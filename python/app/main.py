# responsible: finn
# fastapi app — registers all api modules
# data sources are off by default; start them via POST /data/{source}/start

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api_modules.data import register_data_eps
from app.api_modules.general import register_general_eps
from app.api_modules.test import register_test_eps
from app.api_modules.ws import register_ws_eps
from app.data_sources import registry

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("Available data sources: %s (all stopped — start via POST /data/{source}/start)", list(registry))
    yield
    # Graceful shutdown — cancel any sources the user started
    for src in registry.values():
        src.stop()


app = FastAPI(lifespan=lifespan)

register_general_eps(app)
register_test_eps(app)
register_ws_eps(app)
register_data_eps(app)
