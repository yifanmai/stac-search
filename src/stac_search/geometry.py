from typing import Iterable

from geojson_pydantic import GeometryCollection, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon
from geojson_pydantic.geometries import Geometry
from geojson_pydantic.types import Position, Position2D

from stac_search.models import BoundingBox


def combine_bboxes(bboxes: BoundingBox) -> BoundingBox:
    return (min([bbox[0] for bbox in bboxes]), 
            min([bbox[1] for bbox in bboxes]),
            max([bbox[2] for bbox in bboxes]), 
            max([bbox[3] for bbox in bboxes]),)


def bbox_for_positions(positions: Iterable[Position]) -> BoundingBox:
    return (min([position.longitude for position in positions]), 
            min([position.latitude for position in positions]),
            max([position.longitude for position in positions]), 
            max([position.latitude for position in positions]),)


def geometry_to_bounding_box(geometry: Geometry) -> BoundingBox:
    if isinstance(geometry, Polygon):
        return bbox_for_positions(geometry.coordinates[0])
    elif isinstance(geometry, MultiPolygon):
        return combine_bboxes([bbox_for_positions(polygon_coords[0]) for polygon_coords in geometry.coordinates])
    elif isinstance(geometry, GeometryCollection):
        return combine_bboxes([geometry_to_bounding_box(child_geometry) for child_geometry in geometry.geometries])
    else:
        raise Exception("Not an area type")
