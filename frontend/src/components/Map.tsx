import { Map as OLMap, View } from "ol";
import { useEffect, type RefObject } from "react";
import { useRef } from "react";
import type STACCollection from "../types/STACCollection";
import VectorLayer from "ol/layer/Vector";
import type BoundingBox from "../types/BoundingBox";
import type STACItem from "../types/STACItem";
import type STACAsset from "../types/STACAsset";
import {
  createBaseLayer,
  createCOGLayer,
  createSTACCollectionsLayer,
  createSTACItemsLayer,
  updateSTACAssetsLayer,
  updateSTACCollectionsLayer,
  updateSTACItemsLayer,
} from "./map/MapLayers";
import type WebGLTileLayer from "ol/layer/WebGLTile";
import {
  type MapAnimationRequest,
} from "../types/MapAnimationRequest";
import {
  performMapAnimations,
} from "./map/MapAnimations";
import { createSelectSTACCollectionInteraction, createSelectSTACItemInteraction } from "./map/MapInteractions";

interface Props {
  stacCollections: STACCollection[];
  stacItems: STACItem[];
  stacAssets: STACAsset[];
  selectedSTACCollection: STACCollection | null;
  mapAnimationRequest: MapAnimationRequest | null;
  clearExtentRequest: boolean;
  onSelectSTACCollection: (stacCollection: STACCollection) => void;
  onSelectSTACItem: (stacItem: STACItem) => void;
  onExtentChanged: (bbox: BoundingBox | null) => void;
  onMapAnimationStarted: () => void;
}

interface OLMapState {
  map: OLMap;
  stacCollectionsLayer: VectorLayer;
  stacItemsLayer: VectorLayer;
  stacAssetsLayer: WebGLTileLayer;
}

function createMap(onSelectSTACCollection: (stacCollection: STACCollection) => void, onSelectSTACItem: (stacItem: STACItem) => void): OLMapState {
  const map = new OLMap({
        target: "map",
        view: new View({
          center: [0, 0],
          zoom: 1,
        }),
      });
      map.addLayer(createBaseLayer());
      const stacCollectionsLayer = createSTACCollectionsLayer();
      map.addLayer(stacCollectionsLayer);
      const stacItemsLayer = createSTACItemsLayer();
      map.addLayer(stacItemsLayer);
      const stacAssetsLayer = createCOGLayer();
      map.addLayer(stacAssetsLayer);

      const selectSTACCollectionInteraction = createSelectSTACCollectionInteraction(stacCollectionsLayer, onSelectSTACCollection);
      map.addInteraction(selectSTACCollectionInteraction);

      const selectSTACItemInteraction = createSelectSTACItemInteraction(stacItemsLayer, onSelectSTACItem);
      map.addInteraction(selectSTACItemInteraction);

      return {
        map: map,
        stacCollectionsLayer: stacCollectionsLayer,
        stacItemsLayer: stacItemsLayer,
        stacAssetsLayer: stacAssetsLayer,
      };
}

function getOrCreateMap(mapStateRef: RefObject<OLMapState | null>, onSelectSTACCollection: (stacCollection: STACCollection) => void, onSelectSTACItem: (stacItem: STACItem) => void): OLMapState {
  if (mapStateRef.current) return mapStateRef.current;
  const newMapState = createMap(onSelectSTACCollection, onSelectSTACItem);
  mapStateRef.current = newMapState;
  return newMapState;
}

function Map({
  stacCollections,
  stacItems,
  stacAssets,
  selectedSTACCollection,
  mapAnimationRequest,
  onSelectSTACCollection,
  onSelectSTACItem,
  onMapAnimationStarted,
  onExtentChanged,
}: Props) {
  const mapStateRef = useRef<OLMapState | null>(null);

  useEffect(() => {
    const mapState = getOrCreateMap(mapStateRef, onSelectSTACCollection, onSelectSTACItem);

    // Update layers
    updateSTACCollectionsLayer(
      mapState.stacCollectionsLayer,
      stacCollections,
    );
    updateSTACItemsLayer(mapState.stacItemsLayer, stacItems);
    updateSTACAssetsLayer(mapState.stacAssetsLayer, stacAssets);

    if (selectedSTACCollection !== null) {
      // for (const feature of mapStateRef.current.stacCollectionsLayer
      //   .getSource()
      //   .getFeatures()) {
      //   if (feature.getProperties()["url"] == selectedSTACCollection["url"]) {
      //     selectInteraction.selectFeature(feature);
      //     break;
      //   }
      // }
    }

    // Animate map view (if requested)
    performMapAnimations(mapState.map, mapAnimationRequest, stacCollections, selectedSTACCollection, onMapAnimationStarted);
  });

  return <div id="map"></div>;
}

export default Map;
