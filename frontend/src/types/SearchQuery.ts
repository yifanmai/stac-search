import type BoundingBox from "./BoundingBox";

export default interface SearchQuery {
  queryText: string;
  bbox: BoundingBox | null;
}
