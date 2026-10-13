import type STACCollection from "../types/STACCollection";

const searchURL = "https://localhost:4000/"

export default async function doSearch(
  queryText: string,
  signal: AbortSignal,
): Promise<STACCollection[]> {
  try {
    const params = new URLSearchParams();
    params.append("q", queryText);
    const searchResults = await fetch(
      `http://localhost:8000/stac/collection?${params}`,
      { signal },
    );

    return (await searchResults.json()) as Promise<STACCollection[]>;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("search API request aborted");
    } else {
      throw error;
    }
  }
}
