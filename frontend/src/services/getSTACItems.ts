import apiBaseURL from "../config/apiBaseURL";
import type STACItem from "../types/STACItem";

const SEARCH_URL = "stac/collection/items";

export default async function getSTACItems(
  stacCollectionURL: string,
  signal: AbortSignal,
): Promise<STACItem[] | null> {
  try {
    const params = new URLSearchParams();
    params.append("url", stacCollectionURL);
    // if (searchQuery.bbox) {
    //   params.append("bbox", searchQuery.bbox.join(","));
    // }
    const searchResults = await fetch(`${apiBaseURL()}${SEARCH_URL}?${params}`, { signal });
    return searchResults.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Search API request aborted");
      return null;
    } else {
      throw error;
    }
  }
}
