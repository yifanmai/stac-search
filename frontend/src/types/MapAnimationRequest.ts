// Not using enum because of `erasableSyntaxOnly`
// See: https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly

export type MapAnimationRequest = string;

export const MapAnimationRequestValues = {
  ANIMATE_VIEW_TO_ALL_STAC_COLLECTIONS: "ANIMATE_VIEW_TO_ALL_STAC_COLLECTIONS",
  ANIMATE_VIEW_TO_SELECTED_STAC_COLLECTION:
    "ANIMATE_VIEW_TO_SELECTED_STAC_COLLECTION",
};
