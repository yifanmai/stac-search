from dataclasses import dataclass
import json
from pathlib import Path
from typing import Iterator, Mapping



def maybe_load_json_object_from_file(path: Path) -> Mapping:
    try:
        with path.open("r") as f:
            return json.load(f)
    except json.decoder.JSONDecodeError as e:
        return None

def get_root_catalog_paths(catalogs_dir_path: Path) -> Iterator[Path]:
    for catalog_directory in catalogs_dir_path.iterdir():
        if not catalog_directory.is_dir():
            continue
        file_entries = [entry for entry in catalog_directory.iterdir() if entry.is_file()]
        if len(file_entries) == 1:
            yield file_entries[0]

def get_collection_paths_recursively(catalog_path: Path) -> Iterator[Path]:
    catalog = maybe_load_json_object_from_file(catalog_path)
    if not catalog:
        return
    if catalog["type"] == "Collection":
        yield catalog_path
    for link in catalog["links"]:
        if link["rel"] == "child":
            child_path = catalog_path.parent.joinpath(link["href"])
            if not child_path.exists():
                continue
            yield from get_collection_paths_recursively(child_path)

def get_item_paths(collection_path: Path) -> Iterator[Path]:
    collection = maybe_load_json_object_from_file(collection_path)
    if not collection:
        return
    for link in collection["links"]:
        if link["rel"] == "item":
            item_path = collection_path.parent.joinpath(link["href"])
            if not item_path.exists():
                continue
            yield collection_path.parent.joinpath(link["href"])
