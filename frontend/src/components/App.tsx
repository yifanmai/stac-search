import { useEffect, useState } from 'react'

// import './App.css'
import SearchQueryBox from './SearchQueryBox.tsx'
import Map from './Map.tsx'
import type STACCollection from '../types/STACCollection.ts';
import SearchResultsBox from './SearchResultsBox.tsx';
import STACCollectionInfoBox from './STACCollectionInfoBox.tsx';
import doSearch from "../services/doSearch.ts";

export default  function App() {
  // const [count, setCount] = useState(0)
  const [stacCollections, setSTACCollections] = useState<STACCollection[] | null>(null);
  const [selectedSTACCollection, setSelectedSTACCollection] = useState<STACCollection | null>(null);
  const [queryText, setQueryText] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    console.log("searching for " + queryText)
    async function asyncDoSearch() {
      if (queryText === null) return;
      const response = await doSearch(queryText, controller.signal);
      setSelectedSTACCollection(null);
      setSTACCollections(response);
    }
    
    asyncDoSearch();
    return () => controller.abort();
  }, [queryText]);


  const onSearchQuery = (newQueryText: string) => {
    console.log(newQueryText);
    setQueryText(newQueryText);
};
  

  const onSelectResult = (stacCollection: STACCollection) => {
    setSelectedSTACCollection(stacCollection);
  }


  return (
    <>
      <Map stacCollections={stacCollections || []} selectedSTACCollection={selectedSTACCollection} onSelectResult={onSelectResult}></Map>
      
      <div className="ui-container">
        <div className="ui-column"><SearchQueryBox onSearchQuery={onSearchQuery}></SearchQueryBox>
        {stacCollections !== null ? <SearchResultsBox stacCollections={stacCollections} selectedSTACCollection={selectedSTACCollection} onSelectResult={onSelectResult}></SearchResultsBox> : null}</div>
        {selectedSTACCollection ? <STACCollectionInfoBox stacCollection={selectedSTACCollection}></STACCollectionInfoBox> : null}
      </div>
      
      
        
      
    </>
  )
}

