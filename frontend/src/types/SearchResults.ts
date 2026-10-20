import type { BoundingBox } from "./BoundingBox";

export default interface SearchResults {
  url: string;
  title: string;
  description: string;
  bbox: BoundingBox;
}
