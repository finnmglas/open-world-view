# responsible: finn
# app config - loaded from .env via pydantic-settings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # postgres
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "app_db"
    postgres_user: str = "app_user"
    postgres_password: str = "password"

    # qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str = ""

    # redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    # data sources — optional, sources requiring keys are skipped if unset
    aisstream_api_key: str = ""   # https://aisstream.io  (free, AIS boats)

    @property
    def postgres_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = {"env_file": ".env"}


settings = Settings()
