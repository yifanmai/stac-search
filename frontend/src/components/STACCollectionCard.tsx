import type STACCollection from "../types/STACCollection";

interface Props {
  stacCollection: STACCollection;
  isSelected: boolean;
  onSelectResult: (stacCollection: STACCollection) => void;
}

export default function STACCollectionCard({
  stacCollection,
  isSelected,
  onSelectResult,
}: Props) {
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onSelectResult(stacCollection);
    event.preventDefault();
  }
  return (
    <div className={isSelected ? "search-result selected-search-result" : "search-result"}>
        <h3><a href="#" onClick={onClick}>{stacCollection.title}</a></h3>
        <p className="stac-collection-description">{stacCollection.description}</p>
    </div>
  )
}