import { useEffect, useState } from "react";

import SearchQueryBox from "./SearchQueryBox.tsx";
import Map from "./Map.tsx";
import type STACCollection from "../types/STACCollection.ts";
import SearchResultsBox from "./SearchResultsBox.tsx";
import STACCollectionInfoBox from "./STACCollectionInfoBox.tsx";
import doSearch from "../services/doSearch.ts";
import type BoundingBox from "../types/BoundingBox.ts";
import type SearchQuery from "../types/SearchQuery.ts";

export default function App() {
  // const [count, setCount] = useState(0)
  const [stacCollections, setSTACCollections] = useState<
    STACCollection[] | null
  >(null);
  const [selectedSTACCollection, setSelectedSTACCollection] =
    useState<STACCollection | null>(null);
  const [searchQuery, setSearchQuery] = useState<SearchQuery | null>(null);
  const [areaOfInterest, setAreaOfInterest] = useState<BoundingBox | null>(null);

  // Hacky way to clear the area of interest from Map from the button on SearchQueryBox.
  // SearchQueryBox will sends an event that sets this to true.
  // Map receives this as a prop, and clears the area of interst, and sends an event
  // that sets it back to false.
  const [clearAreaOfInterest, setClearAreaOfInterest] = useState<boolean>(false);

  useEffect(() => {
    if (searchQuery === null) return;
    const controller = new AbortController();
    const queryText = searchQuery.queryText;
    console.log("searching for " + queryText);
    async function asyncDoSearch() {
      if (queryText === null) return;
      const response = await doSearch(queryText, controller.signal);
      setSelectedSTACCollection(null);
      setSTACCollections(response);
    }

    asyncDoSearch();
    return () => controller.abort();
  }, [searchQuery]);

  const onSearchQuery = (searchQuery: SearchQuery) => {
    setSearchQuery(searchQuery);
  };

  const onSelectResult = (stacCollection: STACCollection) => {
    setSelectedSTACCollection(stacCollection);
  };

  const onExtentChanged = (bbox: BoundingBox | null) => {
    if (bbox === null) {
      setClearAreaOfInterest(false);
    }
    setAreaOfInterest(bbox);
  };

  const onClearAreaOfInterest = () => {
    setClearAreaOfInterest(true);
  };

  return (
    <>
      <Map
        stacCollections={stacCollections || []}
        selectedSTACCollection={selectedSTACCollection}
        clearAreaOfInterest={clearAreaOfInterest}
        onSelectResult={onSelectResult}
        onExtentChanged={onExtentChanged}
      ></Map>

      <div className="ui-container">
        <div className="ui-column">
          <SearchQueryBox areaOfInterest={areaOfInterest} onSearchQuery={onSearchQuery} onClearAreaOfInterest={onClearAreaOfInterest} ></SearchQueryBox>
          {stacCollections !== null ? (
            <SearchResultsBox
              stacCollections={stacCollections}
              selectedSTACCollection={selectedSTACCollection}
              onSelectResult={onSelectResult}
            ></SearchResultsBox>
          ) : null}
        </div>
        {selectedSTACCollection ? (
          <STACCollectionInfoBox
            stacCollection={selectedSTACCollection}
          ></STACCollectionInfoBox>
        ) : null}
      </div>
    </>
  );
}
