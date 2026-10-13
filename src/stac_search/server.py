import os
from typing import Any, List, Optional
from geojson_pydantic import Polygon
import psycopg
from fastapi import FastAPI
from psycopg.types import TypeInfo
from pydantic import BaseModel

from geospatial_data_index.geojson_pydantic_adapter import register_adapters
from fastapi.middleware.cors import CORSMiddleware


class STACCollection(BaseModel):
    url: str
    title: str
    description: str
    bbox: Polygon

app = FastAPI(title="STAC Collections")

# app.frontend("/", directory="/home/yifanmai/oss/geospatial-data-vite/dist")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> psycopg.Connection:
    connection_string = os.getenv("POSTGIS_CONNECTION_STRING")
    if not connection_string:
        raise Exception("No connection string found")
    return psycopg.connect(connection_string)

def fetch_stac_collections_by_bbox(bbox_coords: List[float]) -> List[STACCollection]:
    query_template = """SELECT
        url,
        title,
        description,
        bbox
    FROM
        stac_collections
    WHERE 
        ST_Overlaps(bbox, %(bbox_polygon)s)"""
    bbox_polygon = Polygon.create(coordinates=
                    [[(bbox_coords[0], bbox_coords[1]),
                    (bbox_coords[2], bbox_coords[1]),
                    (bbox_coords[2], bbox_coords[3]),
                    (bbox_coords[0], bbox_coords[3]),
                    (bbox_coords[0], bbox_coords[1]),]]
                )
    stac_collections = []
    with get_connection() as conn:
        type_info = TypeInfo.fetch(conn, "geometry")
        register_adapters(type_info, conn)
        with conn.cursor() as cur:
            cur.execute(query_template, {"bbox_polygon": bbox_polygon})
            for url, title, description, bbox in cur:
                stac_collections.append(STACCollection(url=url, title=title, description=description, bbox=bbox))
    return stac_collections


def fetch_stac_collections_by_text_query(query: str)-> List[STACCollection]:
    query_template = """SELECT
        url,
        title,
        description,
        bbox
    FROM
        stac_collections,
        websearch_to_tsquery('english', %(query)s) textsearch_query,
        to_tsvector('english', title || ' ' || description) textsearch_vector
    WHERE 
        textsearch_vector @@ textsearch_query
    ORDER BY
        ts_rank_cd(textsearch_vector, textsearch_query) DESC;"""
    stac_collections = []
    with get_connection() as conn:
        info = TypeInfo.fetch(conn, "geometry")
        register_adapters(info, conn)
        with conn.cursor() as cur:
            cur.execute(query_template, {"query": query})
            for url, title, description, bbox in cur:
                stac_collections.append(STACCollection(url=url, title=title, description=description, bbox=bbox))
    return stac_collections

@app.get("/stac/collection")
def get_stac_collection(q: Optional[str] = None, bbox: Optional[str] = None) -> List[Any]:
    if bbox:
        bbox_parts = bbox.split(",")
        if len(bbox_parts) != 4:
            raise Exception("Need exactly four bounding box coords")
        try:
            bbox_coords = tuple(float(bbox_part) for bbox_part in bbox_parts)
        except Exception as e:
            raise Exception("Could not parse bbox coords as floats") from e
        return fetch_stac_collections_by_bbox(bbox_coords)
    elif q:
        return fetch_stac_collections_by_text_query(q)
    else:
        raise Exception("Unknown")