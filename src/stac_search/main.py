import sys

import uvicorn

from pydantic_settings import CliApp
from pydantic import ValidationError
from stac_search.config import Settings, set_settings, build_settings_error_message


def main():
    try:
        settings = CliApp.run(Settings)
    except ValidationError as validation_error:
        print("Error:")
        print(build_settings_error_message(validation_error))
        sys.exit(1)
        
    set_settings(settings)
    config = uvicorn.Config("stac_search.server:app", port=settings.port, log_level="info")
    server = uvicorn.Server(config)
    server.run()


if __name__ == "__main__":
    main()
