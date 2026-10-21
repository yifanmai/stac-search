import os
from typing import Any, Dict, List, Optional, Tuple


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from geojson_pydantic import Polygon
from psycopg.types import TypeInfo
from pydantic import BaseModel
import psycopg

from stac_search.psycopg_adapters import register_adapters
from stac_search.config import get_settings


class STACCollection(BaseModel):
    url: str
    title: str
    description: str
    bbox: Polygon


BoundingBox = Tuple[float, float, float, float]


app = FastAPI(title="STAC Collections")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> psycopg.Connection:
    return psycopg.connect(get_settings().postgis_connection_string)


def fetch_stac_collections_by_bbox(bbox_coords: List[float]) -> List[STACCollection]:
    query_template = """SELECT
        url,
        title,
        description,
        bbox
    FROM
        stac_collections
    WHERE 
        ST_Intersects(bbox, %(bbox_polygon)s)"""
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


def build_sql_query(query_text: str, bbox: Optional[BoundingBox]) -> str:
    columns = ["url",
        "title",
        "description",
        "bbox"]
    tables = ["stac_collections"]
    if query_text:
        tables.extend([
            "websearch_to_tsquery('english', %(query_text)s) textsearch_query",
            "to_tsvector('english', title || ' ' || description) textsearch_vector",
        ])
    conditions = []
    if query_text:
        conditions.append("textsearch_vector @@ textsearch_query")
    if bbox:
        conditions.append("ST_Intersects(bbox, %(bbox_polygon)s)")
    order_by_clause = "ORDER BY ts_rank_cd(textsearch_vector, textsearch_query) DESC" if query_text else ""
    query_template = f"""SELECT {', '.join(columns)} FROM {', '.join(tables)} WHERE {' AND '.join(conditions)} {order_by_clause} LIMIT 100 ;"""
    return query_template


def build_sql_params(query_text: str, bbox: Optional[BoundingBox]) -> Dict:
    params = {}
    if query_text:
        params["query_text"] = query_text
    if bbox:
        params["bbox_polygon"] = Polygon.create(coordinates=
            [[(bbox[0], bbox[1]),
            (bbox[2], bbox[1]),
            (bbox[2], bbox[3]),
            (bbox[0], bbox[3]),
            (bbox[0], bbox[1]),]]
        )
    return params


def fetch_stac_collections(query_text: str, bbox: Optional[BoundingBox])-> List[STACCollection]:
    query_template = build_sql_query(query_text, bbox)
    query_params = build_sql_params(query_text, bbox)
    print(query_template)
    print(query_params)
    stac_collections = []
    with get_connection() as conn:
        info = TypeInfo.fetch(conn, "geometry")
        register_adapters(info, conn)
        with conn.cursor() as cur:
            cur.execute(query_template, query_params)
            for url, title, description, bbox in cur:
                stac_collections.append(STACCollection(url=url, title=title, description=description, bbox=bbox))
    return stac_collections


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
    return fetch_stac_collections(q, parsed_bbox)
    # if bbox:
    #     bbox_parts = bbox.split(",")
    #     if len(bbox_parts) != 4:
    #         raise Exception("Need exactly four bounding box coords")
    #     try:
    #         bbox_coords = tuple(float(bbox_part) for bbox_part in bbox_parts)
    #     except Exception as e:
    #         raise Exception("Could not parse bbox coords as floats") from e
    #     return fetch_stac_collections_by_bbox(bbox_coords)
    # elif q:
    #     return fetch_stac_collections_by_text_query(q)
    # else:
    #     raise Exception("Unknown")
