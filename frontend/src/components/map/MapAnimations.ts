import { Feature, Map as OLMap } from "ol";
import MultiPolygon from "ol/geom/MultiPolygon";
import type STACCollection from "../../types/STACCollection";
import Polygon from "ol/geom/Polygon";
import {
  MapAnimationRequestValues,
  type MapAnimationRequest,
} from "../../types/MapAnimationRequest";
import type VectorLayer from "ol/layer/Vector";

function animateViewToSelectedSTACCollection(
  map: OLMap,
  selectedSTACCollection: STACCollection,
  stacCollectionsLayer: VectorLayer,
): void {
  const features: Feature[] =
    stacCollectionsLayer.getSource()?.getFeatures() || [];
  for (const feature of features) {
    if (feature.getProperties()["stacCollection"] === selectedSTACCollection) {
      const geometry = feature.getGeometry();
      if (geometry && geometry.getType() === "Polygon") {
        map.getView().fit(geometry as Polygon, {
          duration: 1000,
          maxZoom: 10,
          padding: [64, 64, 64, 64 + (64 + 320) * 2],
        });
        return;
      }
    }
  }
}

function animateViewToAllSTACCollections(
  map: OLMap,
  stacCollectionsLayer: VectorLayer,
): void {
  map.getView().fit(getVectorLayerGeometry(stacCollectionsLayer), {
    duration: 1000,
    maxZoom: 10,
    padding: [64, 64, 64, 64 + 64 + 320],
  });
}

function getVectorLayerGeometry(vectorLayer: VectorLayer): MultiPolygon {
  const features: Feature[] = vectorLayer.getSource()?.getFeatures() || [];
  const polygons: Polygon[] = [];
  for (const feature of features) {
    const geometry = feature.getGeometry() as Polygon;
    if (geometry && geometry.getType() === "Polygon") {
      polygons.push(geometry);
    }
  }
  return new MultiPolygon(polygons);
}

export function performMapAnimations(
  map: OLMap,
  mapAnimationRequest: MapAnimationRequest | null,
  selectedSTACCollection: STACCollection | null,
  stacCollectionsLayer: VectorLayer,
  onMapAnimationStarted: () => void,
) {
  if (mapAnimationRequest) {
    if (
      mapAnimationRequest ===
      MapAnimationRequestValues.ANIMATE_VIEW_TO_ALL_STAC_COLLECTIONS
    ) {
      animateViewToAllSTACCollections(map, stacCollectionsLayer);
    } else if (
      mapAnimationRequest ===
      MapAnimationRequestValues.ANIMATE_VIEW_TO_SELECTED_STAC_COLLECTION
    ) {
      if (selectedSTACCollection) {
        animateViewToSelectedSTACCollection(
          map,
          selectedSTACCollection,
          stacCollectionsLayer,
        );
      }
    }
    onMapAnimationStarted();
  }
}
