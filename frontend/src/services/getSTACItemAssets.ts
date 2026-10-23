import type STACAsset from "../types/STACAsset";

const SEARCH_URL = "http://localhost:8000/stac/collection/items/assets";

export default async function getSTACItemAssets(
  stacItemURL: string,
  signal: AbortSignal,
): Promise<STACAsset[] | null> {
  try {
    const params = new URLSearchParams();
    params.append("url", stacItemURL);
    const searchResults = await fetch(`${SEARCH_URL}?${params}`, { signal });
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
