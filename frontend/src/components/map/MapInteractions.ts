import { click, platformModifierKeyOnly } from "ol/events/condition";
import ExtentInteraction from "ol/interaction/Extent";
import SelectInteraction from "ol/interaction/Select";
import { extentInteractionStyle, selectStyleFunction } from "./MapStyles";
import type Layer from "ol/layer/Layer";
import type STACCollection from "../../types/STACCollection";


export function createSelectSTACCollectionInteraction(stacCollectionsLayer: Layer, onSelectSTACCollection: (stacCollection: STACCollection) => void): SelectInteraction {
    const selectSTACCollectionInteraction = new SelectInteraction({
        condition: click,
        style: selectStyleFunction,
        layers: [stacCollectionsLayer],
        });
    
    selectSTACCollectionInteraction.on("select", (event) => {
            const selectedFeatures = event.target.getFeatures().getArray();
            if (selectedFeatures.length !== 1) {
              return;
            }
            const selectedFeature = selectedFeatures[0];
            const selectedFeatureSTACCollection =
              selectedFeature.getProperties()["stacCollection"];
            onSelectSTACCollection(selectedFeatureSTACCollection);  
          });
          return selectSTACCollectionInteraction;
        }
export const selectSTACItemInteraction = new SelectInteraction({
  condition: click,
  style: selectStyleFunction,
});

export const extentInteraction = new ExtentInteraction({
  condition: platformModifierKeyOnly,
  boxStyle: extentInteractionStyle,
});
