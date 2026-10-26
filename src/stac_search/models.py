
from geojson_pydantic import Polygon
from geojson_pydantic.geometries import Geometry
from pydantic import BaseModel


class STACCollection(BaseModel):
    url: str
    title: str
    description: str
    bbox: Polygon


class STACItem(BaseModel):
    url: str
    title: str
    description: str
    bbox: Polygon
    geometry: Geometry


class STACAsset(BaseModel):
    url: str
    id: str
    title: str
    description: str
    media_type: str


BoundingBox = tuple[float, float, float, float]
