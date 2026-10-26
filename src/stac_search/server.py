from typing import Any

import psycopg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from psycopg.types import TypeInfo

from stac_search.collection_search import search_stac_collections
from stac_search.config import get_settings
from stac_search.frontend import setup_frontend
from stac_search.item_search import (
    get_stac_assets_in_item,
    get_stac_items_in_collection,
)
from stac_search.models import BoundingBox
from stac_search.psycopg_adapters import register_adapters

app = FastAPI(title="STAC Collections")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


setup_frontend(app)


def get_connection() -> psycopg.Connection:
    return psycopg.connect(get_settings().postgis_connection_string)


@app.get("/stac/collection")
def get_stac_collection(q: str = None, bbox: str | None = None) -> list[Any]:
    parsed_bbox: BoundingBox | None = None
    if bbox:
        bbox_parts = bbox.split(",")
        if len(bbox_parts) != 4:
            raise ValueError("Need exactly four bounding box coords")
        try:
            parsed_bbox = tuple(float(bbox_part) for bbox_part in bbox_parts)
        except Exception as e:
            raise ValueError("Could not parse bbox coords as floats") from e
    with get_connection() as conn:
        info = TypeInfo.fetch(conn, "geometry")
        register_adapters(info, conn)
        return search_stac_collections(conn, q, parsed_bbox)


@app.get("/stac/collection/items")
def get_stac_collection_items(url: str) -> list[Any]:
    with get_connection() as conn:
        info = TypeInfo.fetch(conn, "geometry")
        register_adapters(info, conn)
        return get_stac_items_in_collection(conn, url)


@app.get("/stac/collection/items/assets")
def get_assets(url: str) -> list[Any]:
    with get_connection() as conn:
        info = TypeInfo.fetch(conn, "geometry")
        register_adapters(info, conn)
        return get_stac_assets_in_item(conn, url)
