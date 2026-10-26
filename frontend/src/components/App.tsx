import { useEffect, useState } from "react";

import SearchQueryBox from "./SearchQueryBox.tsx";
import Map from "./Map.tsx";
import type STACCollection from "../types/STACCollection.ts";
import SearchResultsBox from "./SearchResultsBox.tsx";
import STACCollectionInfoBox from "./STACCollectionInfoBox.tsx";
import doSearch from "../services/doSearch.ts";
import type BoundingBox from "../types/BoundingBox.ts";
import type SearchQuery from "../types/SearchQuery.ts";
import type STACItem from "../types/STACItem.ts";
import getSTACItems from "../services/getSTACItems.ts";
import getSTACItemAssets from "../services/getSTACItemAssets.ts";
import type STACAsset from "../types/STACAsset.ts";
import MapAnimationRequest from "../types/MapAnimationRequest.ts";

export default function App() {
  // const [count, setCount] = useState(0)
  const [stacCollections, setSTACCollections] = useState<
    STACCollection[] | null
  >(null);
  const [selectedSTACCollection, setSelectedSTACCollection] =
    useState<STACCollection | null>(null);
  const [selectedSTACItem, setSelectedSTACItem] = useState<STACItem | null>(
    null,
  );
  const [stacAssets, setSTACAssets] = useState<STACAsset[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<SearchQuery | null>(null);
  const [areaOfInterest, setAreaOfInterest] = useState<BoundingBox | null>(
    null,
  );
  const [stacItems, setSTACItems] = useState<STACItem[] | null>(null);
  const [mapAnimationRequest, setMapAnimationRequest] =
    useState<MapAnimationRequest | null>(null);

  // Hacky way to clear the area of interest from Map from the button on SearchQueryBox.
  // SearchQueryBox will sends an event that sets this to true.
  // Map receives this as a prop, and clears the area of interst, and sends an event
  // that sets it back to false.
  const [clearExtentRequest, setClearExtentRequest] = useState<boolean>(false);

  // Search queries
  useEffect(() => {
    if (searchQuery === null) return;
    const controller = new AbortController();
    async function asyncDoSearch() {
      if (searchQuery === null) return;
      const response = await doSearch(searchQuery, controller.signal);
      setSelectedSTACCollection(null);
      setSTACCollections(response);
      setMapAnimationRequest(
        MapAnimationRequest.ANIMATE_VIEW_TO_ALL_STAC_COLLECTIONS,
      );
    }
    asyncDoSearch();
    return () => controller.abort();
  }, [searchQuery]);

  // Select collection
  useEffect(() => {
    if (selectedSTACCollection === null) return;
    const controller = new AbortController();
    async function asyncGetSTACItems() {
      if (selectedSTACCollection === null) return;
      const response = await getSTACItems(
        selectedSTACCollection.url,
        controller.signal,
      );
      setSTACItems(response);
    }

    asyncGetSTACItems();
    return () => controller.abort();
  }, [selectedSTACCollection]);

  // Item queries
  useEffect(() => {
    if (selectedSTACItem === null) return;
    const controller = new AbortController();
    async function asyncGetSTACItems() {
      if (selectedSTACItem === null) return;
      const response = await getSTACItemAssets(
        selectedSTACItem.url,
        controller.signal,
      );
      console.log(response);
      setSTACAssets(response);
    }

    asyncGetSTACItems();
    return () => controller.abort();
  }, [selectedSTACItem]);

  const onSearchQuery = (searchQuery: SearchQuery) => {
    setSearchQuery(searchQuery);
  };

  const onSelectResult = (stacCollection: STACCollection) => {
    setMapAnimationRequest(
      MapAnimationRequest.ANIMATE_VIEW_TO_SELECTED_STAC_COLLECTION,
    );
    setSelectedSTACCollection(stacCollection);
  };

  const onSelectItem = (stacItem: STACItem) => {
    console.log("selected", stacItem);
    setSelectedSTACItem(stacItem);
  };

  const onExtentChanged = (bbox: BoundingBox | null) => {
    if (bbox === null) {
      setClearExtentRequest(false);
    }
    setAreaOfInterest(bbox);
  };

  return (
    <>
      <Map
        stacCollections={stacCollections || []}
        selectedSTACCollection={selectedSTACCollection}
        stacItems={stacItems || []}
        stacAssets={stacAssets || []}
        mapAnimationRequest={mapAnimationRequest}
        clearExtentRequest={clearExtentRequest}
        onSelectResult={onSelectResult}
        onSelectItem={onSelectItem}
        onMapAnimationStarted={() => setMapAnimationRequest(null)}
        onExtentChanged={onExtentChanged}
      ></Map>

      <div className="ui-container">
        <div className="ui-column">
          <SearchQueryBox
            areaOfInterest={areaOfInterest}
            onSearchQuery={onSearchQuery}
            onClearAreaOfInterest={() => setClearExtentRequest(true)}
          ></SearchQueryBox>
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
