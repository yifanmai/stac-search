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
    <div id="search-result" className={isSelected ? "selected-search-result" : ""}>
        <p>Title: {stacCollection.title}</p>
        <p>Description: asdf</p>
        <a href="#" onClick={onClick}>Go to this</a>
    </div>
  )
}