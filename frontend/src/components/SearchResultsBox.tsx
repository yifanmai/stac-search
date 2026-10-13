import type STACCollection from "../types/STACCollection";
import STACCollectionCard from "./STACCollectionCard";

interface Props {
  stacCollections: STACCollection[];
  selectedSTACCollection: STACCollection | null;
  onSelectResult: (stacCollection: STACCollection) => void;
}

export default function SearchResultsBox({
  stacCollections,
  selectedSTACCollection,
  onSelectResult,
}: Props) {

  return (
    <div id="search-results">
        {stacCollections.map((stacCollection) =>
          <STACCollectionCard
          key={stacCollection.url}
          stacCollection={stacCollection}
          onSelectResult={onSelectResult}
          isSelected={selectedSTACCollection !== null && selectedSTACCollection.url === stacCollection.url} >

          </STACCollectionCard>)}
    </div>
  )
}
