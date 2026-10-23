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
from stac_search.models import BoundingBox, STACAsset, STACCollection, STACItem
from stac_search.psycopg_adapters import register_adapters


def build_sql_query(query_text: str, bbox: Optional[BoundingBox]) -> str:
    columns = ["url", "title", "description", "bbox"]
    tables = ["stac_collections"]
    if query_text:
        tables.extend(
            [
                "websearch_to_tsquery('english', %(query_text)s) textsearch_query",
                "to_tsvector('english', title || ' ' || description) textsearch_vector",
            ]
        )
    conditions = []
    if query_text:
        conditions.append("textsearch_vector @@ textsearch_query")
    if bbox:
        conditions.append("ST_Intersects(bbox, %(bbox_polygon)s)")
    order_by_clause = (
        "ORDER BY ts_rank_cd(textsearch_vector, textsearch_query) DESC"
        if query_text
        else ""
    )
    query_template = f"""SELECT {", ".join(columns)} FROM {", ".join(tables)} WHERE {" AND ".join(conditions)} {order_by_clause} LIMIT 100 ;"""
    return query_template


def build_sql_params(query_text: str, bbox: Optional[BoundingBox]) -> Dict:
    params = {}
    if query_text:
        params["query_text"] = query_text
    if bbox:
        params["bbox_polygon"] = Polygon.create(
            coordinates=[
                [
                    (bbox[0], bbox[1]),
                    (bbox[2], bbox[1]),
                    (bbox[2], bbox[3]),
                    (bbox[0], bbox[3]),
                    (bbox[0], bbox[1]),
                ]
            ]
        )
    return params


def get_stac_items_in_collection(
    conn: psycopg.Connection, collection_url: str
) -> List[STACCollection]:
    query = "SELECT url, title, description, bbox, geometry FROM stac_items WHERE parent_collection_url = %(parent_collection_url)s LIMIT 100 ;"
    query_params = {"parent_collection_url": collection_url}
    stac_collections = []
    with conn.cursor() as cur:
        cur.execute(query, query_params)
        for url, title, description, bbox, geometry in cur:
            stac_collections.append(
                STACItem(
                    url=url,
                    title=title,
                    description=description,
                    bbox=bbox,
                    geometry=geometry,
                )
            )
    return stac_collections


def get_stac_assets_in_item(conn: psycopg.Connection, item_url: str) -> List[STACAsset]:
    query = "SELECT url, id, title, description, media_type FROM stac_item_assets WHERE parent_item_url = %(parent_item_url)s LIMIT 100 ;"
    query_params = {"parent_item_url": item_url}
    stac_collections = []
    with conn.cursor() as cur:
        cur.execute(query, query_params)
        for url, id, title, description, media_type in cur:
            stac_collections.append(
                STACAsset(
                    url=url,
                    id=id,
                    title=title,
                    description=description,
                    media_type=media_type,
                )
            )
    return stac_collections
