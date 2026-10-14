import type STACCollection from "../types/STACCollection";

interface Props {
  stacCollection: STACCollection;
}

export default function STACCollectionInfoBox({ stacCollection }: Props) {
  return (
    <div className="ui-column">
      <h2>{stacCollection.title}</h2>
      <p>{stacCollection.description}</p>
    </div>
  );
}
