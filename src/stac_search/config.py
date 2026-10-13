from typing import Optional

from pydantic import ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_PREFIX = "STAC_SEARCH_"

class Settings(BaseSettings):
    postgis_connection_string: str
    port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix=ENV_PREFIX,
        # NOTE: This doesn't seem to do anything...
        cli_exit_on_error=True,
    )



SETTINGS: Optional[Settings] = None


def set_settings(settings: Settings) -> None:
    global SETTINGS
    SETTINGS = settings


def get_settings() -> Settings:
    if SETTINGS is None:
        raise Exception("Cannot use settings before they have been initialized")
    return SETTINGS


def build_settings_error_message(validation_error: ValidationError) -> str:
    lines = []
    for error in validation_error.errors():
        error_location: str = ".".join(error["loc"])
        error_message: str = error["msg"]

        line = f"--{error_location} or {ENV_PREFIX}{error_location.upper()}: {error_message}"
        lines.append(line)
    return "\n\n".join(lines)
