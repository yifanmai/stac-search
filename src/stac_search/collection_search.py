import psycopg
from geojson_pydantic import Polygon
from psycopg.types import TypeInfo

from stac_search.models import BoundingBox, STACCollection
from stac_search.psycopg_adapters import register_adapters


def build_sql_query(query_text: str, bbox: BoundingBox | None) -> str:
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


def build_sql_params(query_text: str, bbox: BoundingBox | None) -> dict:
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


def search_stac_collections(
    conn: psycopg.Connection, query_text: str, bbox: BoundingBox | None
) -> list[STACCollection]:
    query_template = build_sql_query(query_text, bbox)
    query_params = build_sql_params(query_text, bbox)
    stac_collections = []
    info = TypeInfo.fetch(conn, "geometry")
    register_adapters(info, conn)
    with conn.cursor() as cur:
        cur.execute(query_template, query_params)
        for url, title, description, bbox in cur:
            stac_collections.append(
                STACCollection(url=url, title=title, description=description, bbox=bbox)
            )
    return stac_collections
