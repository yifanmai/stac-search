import type { FeatureLike } from "ol/Feature";
import Text from "ol/style/Text";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

export const stacCollectionStyleFunction = (
  feature: FeatureLike,
  _index: number, // eslint-disable-line @typescript-eslint/no-unused-vars
): Style => {
  return new Style({
    stroke: new Stroke({
      color: "#3399CC",
      width: 2.5,
    }),
    text: new Text({
      declutterMode: "declutter",
      overflow: true,
      font: "12px Calibri,sans-serif",
      fill: new Fill({
        color: "#3399CC",
      }),
      stroke: new Stroke({
        color: "#fff",
        width: 3,
      }),
      text: feature.getProperties()["title"],
    }),
  });
};

export const selectedSTACCollectionStyleFunction = (
  feature: FeatureLike,
  _index: number, // eslint-disable-line @typescript-eslint/no-unused-vars
): Style => {
  return new Style({
    stroke: new Stroke({
      color: "#ff0000",
      width: 2.5,
    }),
    text: new Text({
      declutterMode: "declutter",
      overflow: true,
      font: "12px Calibri,sans-serif",
      fill: new Fill({
        color: "#ff0000",
      }),
      stroke: new Stroke({
        color: "#fff",
        width: 3,
      }),
      text: feature.getProperties()["title"],
    }),
  });
};

export const stacItemStyleFunction = (
  feature: FeatureLike,
  _index: number, // eslint-disable-line @typescript-eslint/no-unused-vars
): Style => {
  return new Style({
    stroke: new Stroke({
      color: "#333",
      width: 1,
    }),
    fill: new Fill({
      color: [255, 255, 255, 0.1],
    }),
    text: new Text({
      declutterMode: "declutter",
      overflow: false,
      font: "12px Calibri,sans-serif",
      fill: new Fill({
        color: "#3399CC",
      }),
      stroke: new Stroke({
        color: "#fff",
        width: 3,
      }),
      text: feature.getProperties()["title"],
    }),
  });
};

export const extentInteractionStyle = new Style({
  stroke: new Stroke({
    color: [255, 255, 255, 0.8],
    width: 2.5,
  }),
  // fill: new Fill({
  //   color: [255, 255, 255, ],
  // }),
});
