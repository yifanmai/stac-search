import type { GeometryObject, Polygon } from "geojson";

export default interface STACItem {
  url: string;
  id: string;
  title: string;
  description: string;
  bbox: Polygon;
  geometry: GeometryObject;
}
