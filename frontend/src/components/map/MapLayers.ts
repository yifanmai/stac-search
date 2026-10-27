import { apply as applyOLMapboxStyle } from "ol-mapbox-style";
import { resultStyleFunction } from "./MapStyles";
import Collection from "ol/Collection";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON.js";
import LayerGroup from "ol/layer/Group";
import type STACCollection from "../../types/STACCollection";
import type STACItem from "../../types/STACItem";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import WebGLTileLayer from "ol/layer/WebGLTile";
import { isCOGAsset } from "../../utilities/COG";
import GeoTIFFSource from "ol/source/GeoTIFF";
import type STACAsset from "../../types/STACAsset";
import { clampFeatureGeometryToValidRange } from "../../utilities/geometry";

export function createBaseLayer(): LayerGroup {
  const openFreeMapLayerGroup = new LayerGroup();
  applyOLMapboxStyle(
    openFreeMapLayerGroup,
    "https://tiles.openfreemap.org/styles/positron",
  );
  return openFreeMapLayerGroup;
}

export function createSTACCollectionsLayer(): VectorLayer {
  const stacCollectionsFeatures = new Collection<Feature>();
  const vectorSource = new VectorSource({
    features: stacCollectionsFeatures,
  });
  const stacCollectionsLayer = new VectorLayer({
    source: vectorSource,
    style: resultStyleFunction,
    declutter: true,
  });
  return stacCollectionsLayer;
}

export function createSTACItemsLayer(): VectorLayer {
  const stacItemsFeatures = new Collection<Feature>();
  const stacItemsSource = new VectorSource({
    features: stacItemsFeatures,
  });
  const stacItemsLayer = new VectorLayer({
    source: stacItemsSource,
    // style: stacItemStyleFunction,
    declutter: true,
  });
  return stacItemsLayer;
}

export function createSTACAssetsLayer(): WebGLTileLayer {
  return new WebGLTileLayer({ source: undefined });
}

function areArraysEqual<Type>(array1: Type[], array2: Type[]): boolean {
  if (array1.length !== array2.length) return false;
  return array1.every((v, index) => v === array2[index]);
}


export function updateSTACCollectionsLayer(
  layer: VectorLayer,
  stacCollections: STACCollection[],
): void {
  const source = layer.getSource();
  if (!source) {
    throw "STAC Collections layer has no source";
  }
  const sourceFeatures = source.getFeaturesCollection();
  if (sourceFeatures === null) {
    throw "STAC Collections layer has no source features";
  }
  const stacCollectionsFromFeatures = sourceFeatures.getArray().map((feature:Feature )=> feature.getProperties()["stacCollection"])
  if (areArraysEqual(stacCollections, stacCollectionsFromFeatures)) {
    return;
  }
  sourceFeatures.clear();
  sourceFeatures.extend(stacCollections.map(getFeatureForSTACCollection));
}

export function updateSTACItemsLayer(
  layer: VectorLayer,
  stacItems: STACItem[],
): void {
  const source = layer.getSource();
  if (!source) {
    throw "STAC Items layer has no source";
  }
  const sourceFeatures = source.getFeaturesCollection();
  if (sourceFeatures === null) {
    throw "STAC Items layer has no source features";
  }
  sourceFeatures.clear();
  sourceFeatures.extend(stacItems.map(getFeatureForSTACItem));
}

export function updateSTACAssetsLayer(
  layer: WebGLTileLayer,
  stacAssets: STACAsset[],
): void {
  if (stacAssets.length > 0) {
    const stacAsset = findDisplayableCOGAsset(stacAssets);
    const cogSource = new GeoTIFFSource({
      sources: [
        {
          url: stacAsset.url,
        },
      ],
    });
    layer.setSource(cogSource);
  } else {
    layer.setSource(null);
  }
}

function findDisplayableCOGAsset(stacAssets: STACAsset[]) {
  for (const stacAsset of stacAssets) {
    if (isCOGAsset(stacAsset) && stacAsset.id === "visible") {
      return stacAsset;
    }
  }
  return stacAssets[0];
}

function getFeatureForSTACCollection(stacCollection: STACCollection): Feature {
  const feature = new GeoJSON().readFeature(
    {
      type: "Feature",
      geometry: stacCollection.bbox,
      properties: {
        type: "collection",
        title: stacCollection.title,
        url: stacCollection.url,
        stacCollection: stacCollection,
      },
    },
    { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" },
  ) as Feature;
  clampFeatureGeometryToValidRange(feature);
  return feature
}

function getFeatureForSTACItem(stacItem: STACItem): Feature {
  const geometry = stacItem.geometry;
  const feature = new GeoJSON().readFeature(
    {
      type: "Feature",
      geometry: geometry,
      properties: {
        type: "item",
        title: stacItem.title,
        url: stacItem.url,
        stacItem: stacItem,
      },
    },

    { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" },
  ) as Feature;
  // readFeature() can return Feature or Feature[]
  // but this function should only return Feature
  // TODO: Remove this once the upstream return type is changed
  clampFeatureGeometryToValidRange(feature);
  return feature
}
