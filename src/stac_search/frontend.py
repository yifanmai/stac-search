import os

from fastapi import FastAPI

# TODO: Include this in the Python package
FRONTEND_DIST_PATH = "./frontend/dist"
FRONTEND_INDEX_FILENAME = "index.html"

def is_frontend_available() -> bool:
    print(f"Serving frontend from `{FRONTEND_DIST_PATH}`")
    return os.path.isfile(os.path.join(FRONTEND_DIST_PATH, "index.html"))


def setup_frontend(app: FastAPI):
    if is_frontend_available():
        app.frontend("/", directory=FRONTEND_DIST_PATH, fallback=FRONTEND_INDEX_FILENAME)
    else:
        print("WARNING: The frontend has not been built and will not be served.")
        print("To build the frontend, navigate to `./frontend/` and run `yarn build`.")
        print("Refer to the repository README.md for more details.")
