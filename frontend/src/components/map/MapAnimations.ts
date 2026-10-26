import { Map as OLMap } from "ol";
import MultiPolygon from "ol/geom/MultiPolygon";
import type STACCollection from "../../types/STACCollection";
import Polygon from "ol/geom/Polygon";
import { fromLonLat } from "ol/proj";

function getPolygonForSTACCollection(stacCollection: STACCollection): Polygon {
  const coords = [];
  coords.push(fromLonLat(stacCollection.bbox.coordinates[0][0]));
  coords.push(fromLonLat(stacCollection.bbox.coordinates[0][2]));
  return new Polygon([
    [
      [coords[0][0], coords[0][1]],
      [coords[1][0], coords[0][1]],
      [coords[1][0], coords[1][1]],
      [coords[0][0], coords[1][1]],
      [coords[0][0], coords[0][1]],
    ],
  ]);
}

function getMultiPolygonForSTACCollection(
  stacCollections: STACCollection[],
): MultiPolygon {
  const polygons = stacCollections.map(getPolygonForSTACCollection);
  return new MultiPolygon(polygons);
}

export function animateViewToSelectedSTACCollection(
  map: OLMap,
  stacCollection: STACCollection,
): void {
  const stacCollectionGeoJSON = getPolygonForSTACCollection(stacCollection);
  map.getView().fit(stacCollectionGeoJSON, {
    duration: 1000,
    maxZoom: 10,
    padding: [64, 64, 64, 64 + (64 + 320) * 2],
  });
}

export function animateViewToAllSTACCollections(
  map: OLMap,
  stacCollections: STACCollection[],
): void {
  const stacCollectionMultiPolygon =
    getMultiPolygonForSTACCollection(stacCollections);
  map.getView().fit(stacCollectionMultiPolygon, {
    duration: 1000,
    maxZoom: 10,
    padding: [64, 64, 64, 64 + 64 + 320],
  });
}
