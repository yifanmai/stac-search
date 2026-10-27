
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";


function clamp(num: number, min: number, max: number) {
    return Math.max(min, Math.min(max, num));
}

// Valid range for EPSG:3857 https://epsg.io/3857
// const MAX_LNG = 20037508.34;
// const MAX_LAT = 20048966.10;

const MAX_LNG = 20000000;
const MAX_LAT = 20000000;

function clampCoordinatesToValidRange(
    input: number[],
    output?: number[],
    dimension?: number,
): number[] {
    const numDims = dimension ? dimension : 2;
    
    const result = output ? output : [];
    for (let i = 0; i < input.length; ++i) {
        if (i % numDims === 0) {
            result[i] = clamp(input[i], -MAX_LNG, MAX_LNG);
        } else if (i % numDims == 1) {
            result[i] = clamp(input[i], -MAX_LAT, MAX_LAT);
        } else {
            result[i] = input[i];
        }
    }
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
