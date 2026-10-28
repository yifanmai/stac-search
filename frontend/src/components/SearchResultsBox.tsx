import type STACCollection from "../types/STACCollection";
import STACCollectionCard from "./STACCollectionCard";

interface Props {
  stacCollections: STACCollection[] | null;
  selectedSTACCollection: STACCollection | null;
  searchStatus: string;
  onSelectSTACCollection: (stacCollection: STACCollection) => void;
}

export default function SearchResultsBox({
  stacCollections,
  selectedSTACCollection,
  searchStatus,
  onSelectSTACCollection: onSelectResult,
}: Props) {
  const message = searchStatus
    ? searchStatus
    : stacCollections !== null && stacCollections.length === 0
      ? "No results found"
      : "";
  return (
    <div className="search-results">
      {message ? <p className="search-status">{message}</p> : null}
      {(stacCollections || []).map((stacCollection) => (
        <STACCollectionCard
          key={stacCollection.url}
          stacCollection={stacCollection}
          onSelectResult={onSelectResult}
          isSelected={selectedSTACCollection?.url === stacCollection.url}
        ></STACCollectionCard>
      ))}
    </div>
  );
}
