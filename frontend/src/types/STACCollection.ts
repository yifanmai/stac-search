import type { Polygon } from 'geojson';

export default interface STACCollection {
  url: string,
  title: string;
  description: string;
  bbox: Polygon;
}
