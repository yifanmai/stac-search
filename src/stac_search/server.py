import os
from typing import Any, Dict, List, Optional, Tuple


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from geojson_pydantic import Polygon
from psycopg.types import TypeInfo
from pydantic import BaseModel
import psycopg

from stac_search.config import get_settings
from stac_search.psycopg_adapters import register_adapters
from stac_search.collection_search import search_stac_collections
from stac_search.types import BoundingBox, STACCollection


app = FastAPI(title="STAC Collections")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> psycopg.Connection:
    return psycopg.connect(get_settings().postgis_connection_string)


@app.get("/stac/collection")
def get_stac_collection(q: str = None, bbox: Optional[str] = None) -> List[Any]:
    parsed_bbox: Optional[BoundingBox] = None
    if bbox:
        bbox_parts = bbox.split(",")
        if len(bbox_parts) != 4:
            raise ValueError("Need exactly four bounding box coords")
        try:
            parsed_bbox = tuple(float(bbox_part) for bbox_part in bbox_parts)
        except Exception as e:
            raise ValueError("Could not parse bbox coords as floats") from e
    with get_connection() as conn:
            return search_stac_collections(conn, q, parsed_bbox)


