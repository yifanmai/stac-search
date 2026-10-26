
import { apply as applyOLMapboxStyle } from "ol-mapbox-style";
import LayerGroup from "ol/layer/Group";

export function baseLayerGroup(): LayerGroup{
          const openFreeMapLayerGroup = new LayerGroup();
      applyOLMapboxStyle(
        openFreeMapLayerGroup,
        "https://tiles.openfreemap.org/styles/positron",
      );
      return openFreeMapLayerGroup;
}