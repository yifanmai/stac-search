import { Collection, Map as OLMap, View } from "ol";
import { fromLonLat, toLonLat } from "ol/proj.js";

import { click, platformModifierKeyOnly } from "ol/events/condition";
import { useEffect } from "react";
import { useRef } from "react";
import ExtentInteraction from 'ol/interaction/Extent';
import type STACCollection from "../types/STACCollection";
import VectorLayer from "ol/layer/Vector";
import GeoTIFFSource from "ol/source/GeoTIFF";
import Polygon from "ol/geom/Polygon";
import { MultiPolygon } from "ol/geom";
import Select from "ol/interaction/Select";
import type BoundingBox from "../types/BoundingBox";
import type STACItem from "../types/STACItem";
import type STACAsset from "../types/STACAsset";
import { isCOGAsset } from "../utilities/COG";
import { extentInteractionStyle, selectStyleFunction } from "./map/MapStyles";
import { createBaseLayer, createCOGLayer, createSTACCollectionsLayer, createSTACItemsLayer, updateSTACCollectionsLayer, updateSTACItemsLayer } from "./map/MapLayers";
import type WebGLTileLayer from "ol/layer/WebGLTile";


interface Props {
  stacCollections: STACCollection[];
  selectedSTACCollection: STACCollection | null;
  stacItems: STACItem[];
  stacAssets: STACAsset[];
  clearAreaOfInterest: boolean;
  onSelectResult: (stacCollection: STACCollection) => void;
  onSelectItem: (stacItem: STACItem) => void;
  onExtentChanged: (bbox: BoundingBox | null) => void;
}

interface OLMapState {
  map: OLMap;
  stacCollectionsLayer: VectorLayer;
  stacItemsLayer: VectorLayer;
  cogLayer: WebGLTileLayer,
}

// select interaction working on "click"
const selectInteraction = new Select({
  condition: click,
  style: selectStyleFunction,
});


const extentInteraction = new ExtentInteraction({
  condition: platformModifierKeyOnly,
  boxStyle: extentInteractionStyle,
});


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

function viewActiveSTACCollection(
  map: OLMap,
  stacCollection: STACCollection,
): void {
  const stacCollectionGeoJSON = getPolygonForSTACCollection(stacCollection);
  map
    .getView()
    .fit(stacCollectionGeoJSON, {
      duration: 1000,
      maxZoom: 10,
      padding: [64, 64, 64, 64 + (64 + 320) * 2],
    });
}

function viewAllSTACCollections(
  map: OLMap,
  stacCollections: STACCollection[],
): void {
  const stacCollectionMultiPolygon =
    getMultiPolygonForSTACCollection(stacCollections);
  map
    .getView()
    .fit(stacCollectionMultiPolygon, {
      duration: 1000,
      maxZoom: 10,
      padding: [64, 64, 64, 64 + 64 + 320],
    });
}

function Map({
  stacCollections,
  selectedSTACCollection,
  stacItems,
  clearAreaOfInterest,
  stacAssets,
  onSelectResult,
  onSelectItem,
  onExtentChanged,
}: Props) {
  const mapStateRef = useRef<OLMapState | null>(null);
  const stacCollectionsRef = useRef<STACCollection[]>(stacCollections);
  const stacItemsRef = useRef<STACItem[]>(stacItems);
  const ignoreNextEffect = useRef<boolean>(false);

  useEffect(() => {
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
      map.addLayer(stacItemsLayer)

      const cogLayer = createCOGLayer();
      map.addLayer(cogLayer);

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
          const bbox = toLonLat(event.extent.slice(0, 2)).concat(toLonLat(event.extent.slice(2, 4)));
          // Manually index into array to satisfy tuple length type checking
          onExtentChanged([bbox[0], bbox[1], bbox[2], bbox[3]]);
        }
      });

      mapStateRef.current = {
        map: map,
        stacCollectionsLayer: stacCollectionsLayer,
        stacItemsLayer: stacItemsLayer,
        cogLayer: cogLayer,
      };
    }

    if (!mapStateRef.current) {
      throw "Could not build map";
    }

    if (clearAreaOfInterest) {
      extentInteraction.setExtent(null);
      // Hack to prevent map after the area of interest is cleared
      ignoreNextEffect.current = true;
      return;
    }

    // Hack to prevent map after the area of interest is cleared
    if (ignoreNextEffect.current) {
      ignoreNextEffect.current = false;
      return;
    }

    updateSTACCollectionsLayer(
      mapStateRef.current.stacCollectionsLayer,
      stacCollections,
    );

    updateSTACItemsLayer(
      mapStateRef.current.stacItemsLayer,
      stacItems,
    )

    if (selectedSTACCollection) {
      for (const feature of mapStateRef.current.stacCollectionsLayer.getSource().getFeatures()) {
        if (feature.getProperties()["url"] == selectedSTACCollection["url"]) {
          selectInteraction.selectFeature(feature);
          break;
        }
      }
      viewActiveSTACCollection(mapStateRef.current.map, selectedSTACCollection);
    } else if (stacCollections.length > 0) {
      viewAllSTACCollections(mapStateRef.current.map, stacCollections);
    }

    if (stacAssets.length > 0) {
      const stacAsset = findDisplayableCOGAsset(stacAssets);
      const cogSource = new GeoTIFFSource({sources: [
        {
          url: stacAsset.url
        }
      ]});
      mapStateRef.current.cogLayer.setSource(cogSource);
      mapStateRef.current.cogLayer.setVisible(true);
    } else {
      mapStateRef.current.cogLayer.setVisible(false);
    }
  });

  return <div id="map"></div>;
}

function findDisplayableCOGAsset(stacAssets: STACAsset[]) {
  for (const stacAsset of stacAssets) {
    if (isCOGAsset(stacAsset) && stacAsset.id === "visible") {
      return stacAsset;
    }
  }
  return stacAssets[0];
}

export default Map;
