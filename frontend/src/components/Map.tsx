import { Map as OLMap, View } from "ol";
import { useEffect } from "react";
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
    if (!mapStateRef.current) {
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

      mapStateRef.current = {
        map: map,
        stacCollectionsLayer: stacCollectionsLayer,
        stacItemsLayer: stacItemsLayer,
        stacAssetsLayer: stacAssetsLayer,
      };
    }

    if (!mapStateRef.current) {
      throw "Could not build map";
    }

    // Update layers
    updateSTACCollectionsLayer(
      mapStateRef.current.stacCollectionsLayer,
      stacCollections,
    );
    updateSTACItemsLayer(mapStateRef.current.stacItemsLayer, stacItems);
    updateSTACAssetsLayer(mapStateRef.current.stacAssetsLayer, stacAssets);

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

    // Aniamte map view (if requested)
    performMapAnimations(mapStateRef.current.map, mapAnimationRequest, stacCollections, selectedSTACCollection, onMapAnimationStarted);
  });

  return <div id="map"></div>;
}

export default Map;
