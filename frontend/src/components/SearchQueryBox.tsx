import { useState } from "react";
import type BoundingBox from "../types/BoundingBox";
import type SearchQuery from "../types/SearchQuery";

interface Props {
  areaOfInterest: BoundingBox | null;
  onSearchQuery: (searchQuery: SearchQuery) => void;
  onClearAreaOfInterest: () => void;
}

function areaOfInterestToString(areaOfInterest: BoundingBox): string {
  return areaOfInterest.map((x) => x.toFixed(3)).join(", ");
}

export default function SearchQueryBox({
  areaOfInterest,
  onSearchQuery,
  onClearAreaOfInterest,
}: Props) {
  // const [count, setCount] = useState(0)
  const [queryText, setQueryText] = useState<string>("");

  const onClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    onSearchQuery({
      queryText: queryText,
      bbox: areaOfInterest,
    });
  };

  const onClickClearQueryOfInterestLink = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    onClearAreaOfInterest();
  };

  return (
    <form id="searchbox">
      <h1>STAC Search</h1>
      <input
        type="text"
        onChange={(e) => setQueryText(e.target.value)}
        className="text-input"
      ></input>
      <input
        type="submit"
        value="Search"
        onClick={onClick}
        className="btn"
      ></input>
      <p>
        Area of interest:{" "}
        {areaOfInterest !== null ? areaOfInterestToString(areaOfInterest) : ""}{" "}
        (
        <a href="#" onClick={onClickClearQueryOfInterestLink}>
          clear
        </a>
        )
      </p>
      <p>Ctrl-click or ⌘-click to draw and modify area of interest</p>
    </form>
  );
}
