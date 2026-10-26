import { marked } from "marked";
import DOMPurify from "dompurify";
import type STACCollection from "../types/STACCollection";

interface Props {
  stacCollection: STACCollection;
}

export default function STACCollectionInfoBox({ stacCollection }: Props) {
  const formattedDescription = DOMPurify.sanitize(
    marked.parse(stacCollection.description) as string,
  );
  return (
    <div className="ui-column">
      <h2>{stacCollection.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: formattedDescription }}></div>
    </div>
  );
}
