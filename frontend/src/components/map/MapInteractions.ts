import { click, platformModifierKeyOnly } from "ol/events/condition";
import ExtentInteraction from "ol/interaction/Extent";
import SelectInteraction from "ol/interaction/Select";
import { extentInteractionStyle, selectStyleFunction } from "./MapStyles";


export function createSelectSTACCollectionInteraction(): SelectInteraction {
    return new SelectInteraction({
        condition: click,
        style: selectStyleFunction,
        });
    }

export const selectSTACItemInteraction = new SelectInteraction({
  condition: click,
  style: selectStyleFunction,
});

export const extentInteraction = new ExtentInteraction({
  condition: platformModifierKeyOnly,
  boxStyle: extentInteractionStyle,
});
