# responsible: finn
# fastapi app — registers all api modules

from fastapi import FastAPI

from app.api_modules.general import register_general_eps
from app.api_modules.test import register_test_eps
from app.api_modules.ws import register_ws_eps

app = FastAPI()

register_general_eps(app)
register_test_eps(app)
register_ws_eps(app)
