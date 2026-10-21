import type SearchQuery from "../types/SearchQuery";
import type STACCollection from "../types/STACCollection";

const SEARCH_URL = "http://localhost:8000/stac/collection";

export default async function doSearch(
  searchQuery: SearchQuery,
  signal: AbortSignal,
): Promise<STACCollection[] | null> {
  try {
    const params = new URLSearchParams();
    params.append("q", searchQuery.queryText);
    if (searchQuery.bbox) {
      params.append("bbox", searchQuery.bbox.join(","));
    }
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
