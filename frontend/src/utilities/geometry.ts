import type {
  GeometryObject,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from "geojson";

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

// Valid range for EPSG:4326
const MAX_LNG = 180;
const MAX_LAT = 90;

function clampCoordinatesToValidRange(coordinates: Position): Position {
  return coordinates.map((x, index) => {
    if (index === 0) {
      return clamp(x, -MAX_LNG, MAX_LNG);
    } else if (index === 1) {
      return clamp(x, -MAX_LAT, MAX_LAT);
    } else {
      return x;
    }
  });
}

function clampNestedCoordinatesToValidRange(
  coordinates: Position[],
): Position[] {
  return coordinates.map((x) => clampCoordinatesToValidRange(x));
}

function clampNestedNestedCoordinatesToValidRange(
  coordinates: Position[][],
): Position[][] {
  return coordinates.map((x) => clampNestedCoordinatesToValidRange(x));
}

function clampNextedNestedNestedCoordinatesToValidRange(
  coordinates: Position[][][],
): Position[][][] {
  return coordinates.map((x) => clampNestedNestedCoordinatesToValidRange(x));
}

export function clampGeometryToValidRange(
  geometry: GeometryObject,
): GeometryObject {
  // Mutates geometry so that coordinates are in the valid range for EPSG:4326
  if (geometry.type === "Point") {
    return {
      type: geometry.type,
      coordinates: clampCoordinatesToValidRange(
        (geometry as Point).coordinates,
      ),
    };
  } else if (geometry.type === "MultiPoint") {
    return {
      type: geometry.type,
      coordinates: clampNestedCoordinatesToValidRange(
        (geometry as MultiPoint).coordinates,
      ),
    };
  } else if (geometry.type === "LineString") {
    return {
      type: geometry.type,
      coordinates: clampNestedCoordinatesToValidRange(
        (geometry as LineString).coordinates,
      ),
    };
  } else if (geometry.type === "MultiLineString") {
    return {
      type: geometry.type,
      coordinates: clampNestedNestedCoordinatesToValidRange(
        (geometry as MultiLineString).coordinates,
      ),
    };
  } else if (geometry.type === "Polygon") {
    return {
      type: geometry.type,
      coordinates: clampNestedNestedCoordinatesToValidRange(
        (geometry as Polygon).coordinates,
      ),
    };
  } else if (geometry.type === "MultiPolygon") {
    return {
      type: geometry.type,
      coordinates: clampNextedNestedNestedCoordinatesToValidRange(
        (geometry as MultiPolygon).coordinates,
      ),
    };
  } else {
    throw `Unknown geometry type ${geometry.type}`;
  }
}
