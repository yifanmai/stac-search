import type STACCollection from "../types/STACCollection";

interface Props {
  stacCollection: STACCollection;
}

export default function STACCollectionInfoBox({
  stacCollection,
}: Props) {

  return (
    <div id="stac-collection-info">
          <p>{stacCollection.title}</p>
          <p>{stacCollection.description}</p>
    </div>
  )
}
