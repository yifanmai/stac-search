import { useState } from "react";

interface Props {
  onSearchQuery: (queryText: string) => void;
} 

export default function SearchQueryBox({
    onSearchQuery
}: Props) {
  // const [count, setCount] = useState(0)
  const [queryText, setQueryText] = useState<string>("");

  const onClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    onSearchQuery(queryText);
  }

  return (
    <form id="searchbox">
      <h1>STAC Search</h1>
        <input
            type="text"
            onChange={(e) => setQueryText(e.target.value)}
            className="text-input"
        ></input>
        <input type="submit" value="Search" onClick={onClick} className="btn"></input>
    </form>
  )
}
