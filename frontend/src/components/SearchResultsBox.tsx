import type STACCollection from "../types/STACCollection";
import STACCollectionCard from "./STACCollectionCard";

interface Props {
  stacCollections: STACCollection[] | null;
  selectedSTACCollection: STACCollection | null;
  onSelectSTACCollection: (stacCollection: STACCollection) => void;
}

export default function SearchResultsBox({
  stacCollections,
  selectedSTACCollection,
  onSelectSTACCollection: onSelectResult,
}: Props) {
  return (
    <div className="search-results">
      {stacCollections !== null && stacCollections.length === 0 ? (
        <div>No results found</div>
      ) : null}
      {(stacCollections || []).map((stacCollection) => (
        <STACCollectionCard
          key={stacCollection.url}
          stacCollection={stacCollection}
          onSelectResult={onSelectResult}
          isSelected={
            selectedSTACCollection?.url === stacCollection.url
          }
        ></STACCollectionCard>
      ))}
    </div>
  );
}
