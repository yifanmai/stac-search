from typing import Tuple

from geojson_pydantic import Polygon
from pydantic import BaseModel


class STACCollection(BaseModel):
    url: str
    title: str
    description: str
    bbox: Polygon


BoundingBox = Tuple[float, float, float, float]
