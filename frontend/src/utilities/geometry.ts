
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

function clampCoordinatesToValidRange(
    input: number[],
    output?: number[],
    dimension?: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    stride?: number // eslint-disable-line @typescript-eslint/no-unused-vars
): number[] {
    const result = output ? output : [];
    result[0] = Math.max(-180, Math.min(180, input[0]));
    result[1] = Math.max(-180, Math.min(180, input[0]));
    if (input.length > 2) result[2] = input[2];
    return result;
}

export function clampGeometryToValidRange(geometry: Geometry): void {
    // Mutates geometry so that coordinates are in the valid range for EPSG:4326
    geometry.applyTransform(clampCoordinatesToValidRange);
}

export function clampFeatureGeometryToValidRange(feature: Feature<Geometry>): void {
    // Mutates geometry so that coordinates are in the valid range for EPSG:4326
    const geometry = feature.getGeometry()
    if (!geometry) return;
    clampGeometryToValidRange(geometry);
}
