import { click, platformModifierKeyOnly } from "ol/events/condition";
import ExtentInteraction from "ol/interaction/Extent";
import SelectInteraction from "ol/interaction/Select";
import { extentInteractionStyle, selectedSTACCollectionStyleFunction } from "./MapStyles";
import type Layer from "ol/layer/Layer";
import type STACCollection from "../../types/STACCollection";
import { toLonLat } from "ol/proj";
import type BoundingBox from "../../types/BoundingBox";
import type STACItem from "../../types/STACItem";
import type VectorLayer from "ol/layer/Vector";

export function createSelectSTACCollectionInteraction(
  stacCollectionsLayer: Layer,
  onSelectSTACCollection: (stacCollection: STACCollection) => void,
): SelectInteraction {
  const selectInteraction = new SelectInteraction({
    condition: click,
    style: selectedSTACCollectionStyleFunction,
    layers: [stacCollectionsLayer],
  });

  selectInteraction.on("select", (event) => {
    const selectedFeatures = event.target.getFeatures().getArray();
    console.log(selectedFeatures);
    if (selectedFeatures.length !== 1) {
      return;
    }
    const selectedFeature = selectedFeatures[0];
    const selectedFeatureSTACCollection =
      selectedFeature.getProperties()["stacCollection"];
    onSelectSTACCollection(selectedFeatureSTACCollection);
  });
  return selectInteraction;
}

export function createSelectSTACItemInteraction(
  stacItemLayer: Layer,
  onSelectSTACItem: (stacItem: STACItem) => void,
): SelectInteraction {
  const selectInteraction = new SelectInteraction({
    condition: click,
    style: selectedSTACCollectionStyleFunction,
    layers: [stacItemLayer],
  });

  selectInteraction.on("select", (event) => {
    const selectedFeatures = event.target.getFeatures().getArray();
    if (selectedFeatures.length !== 1) {
      return;
    }
    const selectedFeature = selectedFeatures[0];
    const selectedFeatureSTACItem = selectedFeature.getProperties()["stacItem"];
    onSelectSTACItem(selectedFeatureSTACItem);
  });
  return selectInteraction;
}

export function createExtentInteraction(
  onExtentChanged: (bbox: BoundingBox | null) => void,
): ExtentInteraction {
  const extentInteraction = new ExtentInteraction({
    condition: platformModifierKeyOnly,
    boxStyle: extentInteractionStyle,
  });

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
  return extentInteraction;
}

export function updateSelectSTACCollectionInteraction(
  selectedSTACCollection: STACCollection | null,
  selectSTACCollectionInteraction: SelectInteraction,
  stacCollectionsLayer: VectorLayer,
): void {
  if (!selectedSTACCollection) {
    return;
  }
  const interactionSelectedSTACCollections = selectSTACCollectionInteraction.getFeatures().getArray().map((feature) => feature.getProperties()["stacCollection"]);
  if (interactionSelectedSTACCollections.length === 1 && interactionSelectedSTACCollections[0] === selectedSTACCollection) {
    return;
  }
  const selectedFeature = stacCollectionsLayer.getSource()?.getFeaturesCollection()?.getArray().find((feature) => feature.getProperties()["stacCollection"] === selectedSTACCollection);
  console.log(stacCollectionsLayer.getSource()?.getFeaturesCollection()?.getArray());
  if (!selectedFeature) {
    return;
  }
  // Manipulate the FeatureCollection directly instead of the SelectInteraction to avoid firing SelectInteraction events
  const selectInteractionFeatures = selectSTACCollectionInteraction.getFeatures();
  selectInteractionFeatures.clear();
  selectInteractionFeatures.push(selectedFeature);
}
