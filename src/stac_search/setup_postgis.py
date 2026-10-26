from collections.abc import Mapping
from pathlib import Path

import psycopg
from geojson_pydantic.geometries import Geometry
from psycopg.types import TypeInfo
from pydantic import TypeAdapter
from pydantic_settings import BaseSettings, SettingsConfigDict

from stac_search.geometry import bbox_to_polygon, geometry_to_bounding_box
from stac_search.psycopg_adapters import register_adapters
from stac_search.traverse_files import (
    get_collection_paths_recursively,
    get_item_paths,
    get_root_catalog_paths,
    maybe_load_json_object_from_file,
)

CATALOGS_DIR_PATH = Path("/home/yifanmai/oss/stac-catalogs-2026-10-22")

ENV_PREFIX = "STAC_SEARCH_"


# TODO: Deduplicate this with config.py
class DatabaseSettings(BaseSettings):
    postgis_connection_string: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix=ENV_PREFIX,
        # NOTE: This doesn't seem to do anything...
        cli_exit_on_error=True,
    )


def load_into_postgis(conn: psycopg.Connection):
    for root_catalog_path in get_root_catalog_paths(CATALOGS_DIR_PATH):
        root_catalog = maybe_load_json_object_from_file(root_catalog_path)
        slug = root_catalog_path.parent.name
        root_catalog_url = get_crawl_target_url(root_catalog)
        try:
            load_root_catalog_into_postgis(
                conn=conn,
                root_catalog=root_catalog,
                slug=slug,
                root_catalog_url=root_catalog_url,
            )
            for collection_path in get_collection_paths_recursively(root_catalog_path):
                collection = maybe_load_json_object_from_file(collection_path)
                collection_url = get_crawl_target_url(collection)
                load_collection_into_postgis(
                    conn=conn,
                    collection=collection,
                    root_catalog_url=root_catalog_url,
                    collection_url=collection_url,
                )
                for item_path in get_item_paths(collection_path):
                    item = maybe_load_json_object_from_file(item_path)
                    if not item:
                        continue
                    load_item_into_postgis(
                        conn, item, parent_collection_url=collection_url
                    )
        except Exception as e:
            print(f"ERROR: could not load root catalog {slug}")
            print(e)


def get_crawl_target_url(stac_object: Mapping):
    for link in stac_object["links"]:
        if link["rel"] == "crawl-target":
            return link["href"]
    raise Exception("Could not find crawl target URL")


def load_root_catalog_into_postgis(
    conn: psycopg.Connection, root_catalog: Mapping, slug: str, root_catalog_url: str
) -> None:
    id = root_catalog["id"]
    params = {
        "url": root_catalog_url,
        "id": id,
        "slug": slug,
        "title": root_catalog.get("title", id),
        "description": root_catalog.get("description", ""),
    }
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO
                stac_root_catalogs (url, slug, id, title, description)
            VALUES (%(url)s, %(slug)s, %(id)s, %(title)s, %(description)s)
            ON CONFLICT DO NOTHING""",
            params,
        )


def load_collection_into_postgis(
    conn: psycopg.Connection,
    collection: Mapping,
    root_catalog_url: str,
    collection_url: str,
) -> None:
    id = collection["id"]
    bbox = collection["extent"]["spatial"]["bbox"][0]
    bbox_polygon = bbox_to_polygon(bbox)
    params = {
        "url": collection_url,
        "id": id,
        "title": collection.get("title", id),
        "description": collection.get("description", ""),
        "bbox": bbox_polygon,
        "root_catalog_url": root_catalog_url,
    }
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO
                stac_collections (url, id, title, description, bbox, root_catalog_url)
            VALUES (%(url)s, %(id)s, %(title)s, %(description)s, %(bbox)s, %(root_catalog_url)s)
            ON CONFLICT DO NOTHING""",
            params,
        )


def load_item_into_postgis(
    conn: psycopg.Connection, item: Mapping, parent_collection_url: str
) -> None:
    url = get_crawl_target_url(item)
    id = item["id"]

    if item.get("geometry"):
        geometry = TypeAdapter(Geometry).validate_python(item["geometry"])
    elif item.get("bbox"):
        geometry = bbox_to_polygon(item["bbox"])
    else:
        raise Exception("Item has no bbox or geometry")

    if item.get("bbox"):
        bbox = item["bbox"]
    else:
        bbox = geometry_to_bounding_box(geometry)

    bbox_polygon = bbox_to_polygon(bbox)

    params = {
        "url": url,
        "id": item["id"],
        "title": item.get("title", id),
        "description": item.get("description", ""),
        "bbox": bbox_polygon,
        "geometry": geometry,
        "parent_collection_url": parent_collection_url,
    }
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO
                stac_items (url, id, title, description, bbox, geometry, parent_collection_url)
            VALUES (%(url)s, %(id)s, %(title)s, %(description)s, %(bbox)s, %(geometry)s, %(parent_collection_url)s)
            ON CONFLICT DO NOTHING""",
            params,
        )
    for asset_id, asset in item.get("assets", {}).items():
        load_item_asset_into_postgis(conn, asset, id=asset_id, parent_item_url=url)


def load_item_asset_into_postgis(
    conn: psycopg.Connection, asset: Mapping, id: str, parent_item_url: str
) -> None:
    params = {
        "url": asset["href"],
        "id": id,
        "title": asset.get("title", id),
        "description": asset.get("description", ""),
        "media_type": asset.get("type", ""),
        "parent_item_url": parent_item_url,
    }
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO
                stac_item_assets (url, id, title, description, media_type, parent_item_url)
            VALUES (%(url)s, %(id)s, %(title)s, %(description)s, %(media_type)s, %(parent_item_url)s)
            ON CONFLICT DO NOTHING""",
            params,
        )


def create_tables(conn: psycopg.Connection) -> None:
    with conn.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stac_root_catalogs(
                url text PRIMARY KEY,
                slug text NOT NULL,
                id text NOT NULL,
                title text NOT NULL,
                description text NOT NULL
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stac_collections(
                url text PRIMARY KEY,
                id text NOT NULL,
                title text NOT NULL,
                description text NOT NULL,
                bbox geometry NOT NULL,
                root_catalog_url text NOT NULL REFERENCES stac_root_catalogs(url)
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stac_items(
                url text PRIMARY KEY,
                id text NOT NULL,
                title text NOT NULL,
                description text NOT NULL,
                bbox geometry NOT NULL,
                geometry geometry NOT NULL,
                parent_collection_url text NOT NULL REFERENCES stac_collections(url)
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stac_item_assets(
                url text PRIMARY KEY,
                id text NOT NULL,
                title text NOT NULL,
                description text NOT NULL,
                media_type text NOT NULL,
                parent_item_url text NOT NULL REFERENCES stac_items(url)
            );
        """)


def main():
    settings = DatabaseSettings()
    with psycopg.connect(settings.postgis_connection_string, autocommit=True) as conn:
        type_info = TypeInfo.fetch(conn, "geometry")
        register_adapters(type_info, conn)
        create_tables(conn)
        load_into_postgis(conn)


if __name__ == "__main__":
    main()
