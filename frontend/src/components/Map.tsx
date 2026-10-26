import { Map as OLMap, View } from "ol";
import { toLonLat } from "ol/proj.js";

import { click, platformModifierKeyOnly } from "ol/events/condition";
import { useEffect } from "react";
import { useRef } from "react";
import ExtentInteraction from "ol/interaction/Extent";
import type STACCollection from "../types/STACCollection";
import VectorLayer from "ol/layer/Vector";
import SelectInteraction from "ol/interaction/Select";
import type BoundingBox from "../types/BoundingBox";
import type STACItem from "../types/STACItem";
import type STACAsset from "../types/STACAsset";
import { extentInteractionStyle, selectStyleFunction } from "./map/MapStyles";
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
import MapAnimationRequest from "../types/MapAnimationRequest";
import {
  animateViewToAllSTACCollections,
  animateViewToSelectedSTACCollection,
} from "./map/MapAnimations";

interface Props {
  stacCollections: STACCollection[];
  stacItems: STACItem[];
  stacAssets: STACAsset[];
  selectedSTACCollection: STACCollection | null;
  mapAnimationRequest: MapAnimationRequest | null;
  clearExtentRequest: boolean;
  onSelectResult: (stacCollection: STACCollection) => void;
  onSelectItem: (stacItem: STACItem) => void;
  onExtentChanged: (bbox: BoundingBox | null) => void;
  onMapAnimationStarted: () => void;
}

interface OLMapState {
  map: OLMap;
  stacCollectionsLayer: VectorLayer;
  stacItemsLayer: VectorLayer;
  stacAssetsLayer: WebGLTileLayer;
}

// select interaction working on "click"
const selectInteraction = new SelectInteraction({
  condition: click,
  style: selectStyleFunction,
});

const extentInteraction = new ExtentInteraction({
  condition: platformModifierKeyOnly,
  boxStyle: extentInteractionStyle,
});

function Map({
  stacCollections,
  stacItems,
  stacAssets,
  selectedSTACCollection,
  mapAnimationRequest,
  onSelectResult,
  onSelectItem,
  onMapAnimationStarted,
  onExtentChanged,
}: Props) {
  const mapStateRef = useRef<OLMapState | null>(null);
  const stacCollectionsRef = useRef<STACCollection[]>(stacCollections);
  const stacItemsRef = useRef<STACItem[]>(stacItems);

  useEffect(() => {
    console.log(mapAnimationRequest);

    // We need to do this, because otherwise the closure scope captures
    // a stale stacCollections.
    // See the comments in the `selectInteraction` handler.
    stacCollectionsRef.current = stacCollections;
    stacItemsRef.current = stacItems;

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

      map.addInteraction(selectInteraction);
      selectInteraction.on("select", (event) => {
        const selectedFeatures = event.target.getFeatures().getArray();
        if (selectedFeatures.length !== 1) {
          return;
        }
        const selectedFeature = selectedFeatures[0];
        const selectedFeatureType = selectedFeature.getProperties()["type"];
        if (selectedFeatureType === "collection") {
          const selectedSTACCollectionURL =
            selectedFeature.getProperties()["url"];
          if (
            selectedSTACCollection &&
            selectedSTACCollection.url === selectedSTACCollectionURL
          ) {
            return;
          }
          // We have to use `stacCollectionsRef.current` here as a level of indirection.
          // If we used `stacCollections` directly, it will captures the value of `stacCollections`
          // at the time of creation of the `selectInteraction` handler, which means that
          // we will get a stale value of `stacCollections` rather than the current one.
          // We avoid this by using indirection.
          for (const stacCollection of stacCollectionsRef.current) {
            if (stacCollection.url == selectedSTACCollectionURL) {
              onSelectResult(stacCollection);
              return;
            }
          }
        } else if (selectedFeatureType === "item") {
          const selectedSTACItemURL = selectedFeature.getProperties()["url"];
          // See the comments above regarding using indirection to avoid closure capture.
          for (const stacItem of stacItemsRef.current) {
            if (stacItem.url == selectedSTACItemURL) {
              onSelectItem(stacItem);
              return;
            }
          }
        }
      });

      map.addInteraction(extentInteraction);
      extentInteraction.on("extentchanged", (event) => {
        if (event.extent === null) {
          onExtentChanged(null);
        } else {
          const bbox = toLonLat(event.extent.slice(0, 2)).concat(
            toLonLat(event.extent.slice(2, 4)),
          );
          // Manually index into array to satisfy tuple length type checking
          onExtentChanged([bbox[0], bbox[1], bbox[2], bbox[3]]);
        }
      });

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

    updateSTACCollectionsLayer(
      mapStateRef.current.stacCollectionsLayer,
      stacCollections,
    );

    updateSTACItemsLayer(mapStateRef.current.stacItemsLayer, stacItems);

    updateSTACAssetsLayer(mapStateRef.current.stacAssetsLayer, stacAssets);

    if (mapAnimationRequest !== null) {
      if (
        mapAnimationRequest ===
        MapAnimationRequest.ANIMATE_VIEW_TO_ALL_STAC_COLLECTIONS
      ) {
        animateViewToAllSTACCollections(
          mapStateRef.current.map,
          stacCollections,
        );
      } else if (
        mapAnimationRequest ===
        MapAnimationRequest.ANIMATE_VIEW_TO_SELECTED_STAC_COLLECTION
      ) {
        for (const feature of mapStateRef.current.stacCollectionsLayer
          .getSource()
          .getFeatures()) {
          if (feature.getProperties()["url"] == selectedSTACCollection["url"]) {
            selectInteraction.selectFeature(feature);
            break;
          }
        }
        animateViewToSelectedSTACCollection(
          mapStateRef.current.map,
          selectedSTACCollection,
        );
      }
      onMapAnimationStarted();
    }
  });

  return <div id="map"></div>;
}

export default Map;
