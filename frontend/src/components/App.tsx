import { useEffect, useState } from 'react'

// import './App.css'
import SearchQueryBox from './SearchQueryBox.tsx'
import Map from './Map.tsx'
import type STACCollection from '../types/STACCollection.ts';
import SearchResultsBox from './SearchResultsBox.tsx';
import STACCollectionInfoBox from './STACCollectionInfoBox.tsx';
import doSearch from "../services/doSearch.ts";


/*
[
  {
    "url": "/home/yifanmai/oss/geospatial-data-index/output/stac_catalogs/forest-observatory/wildfire/collection.json",
    "title": "Wildfire likelihood, intensity, and severity metrics",
    "description": "Predictions of the geography and intensity of simulated wildfires, as well as post-fire burn severity measurements. Read more at https://the.forestobservatory.com/data",
    "bbox": "POLYGON ((-124.410934 32.53344, -114.129695 32.53344, -114.129695 41.999258, -124.410934 41.999258, -124.410934 32.53344))"
  },
  {
    "url": "/home/yifanmai/oss/geospatial-data-index/output/stac_catalogs/forest-observatory/vegetation/collection.json",
    "title": "CFO forest structure and fuels data",
    "description": "Patterns of forest structure and forest fuels that drive wildfire behavior. Read more at https://the.forestobservatory.com/data",
    "bbox": "POLYGON ((-124.410934 32.53344, -114.129695 32.53344, -114.129695 41.999258, -124.410934 41.999258, -124.410934 32.53344))"
  }
]*/

export default  function App() {
  // const [count, setCount] = useState(0)
  const [stacCollections, setSTACCollections] = useState<STACCollection[]>([]);
  const [selectedSTACCollection, setSelectedSTACCollection] = useState<STACCollection | null>(null);
  const [queryText, setQueryText] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    console.log("searching for " + queryText)
    async function asyncDoSearch() {
      if (queryText === null) return;
      const response = await doSearch(queryText, controller.signal);
      setSTACCollections(response);
    }
    
    asyncDoSearch();
    return () => controller.abort();
  }, [queryText]);


  const onSearchQuery = (newQueryText: string) => {
    console.log(newQueryText);
    setQueryText(newQueryText);
  //   setSTACCollections([{
  //   "url": "/home/yifanmai/oss/geospatial-data-index/output/stac_catalogs/disaster-data-releases-from-planet-labs-pbc/colombia-earthquake-2026-08-10/post-event/planetscope-2026-08-10/collection.json",
  //   "title": "Chocó – Valle del Cauca (PlanetScope, post-event) — 10 August 2026",
  //   "description": "PlanetScope PSB.SD imagery acquired 10 August 2026, hours after the M7.4 earthquake, in two passes (15:31 and 16:17 UTC) across the Pacific cordillera shaking footprint spanning Chocó, Valle del Cauca, Cauca and Risaralda. Cloud cover is unusually low for the region (median 2%). Visual and surface-reflectance (analytic_sr + UDM2) products support wide-area landslide and damage mapping. 57 scenes; each Item carries the available visual, analytic_sr, udm2 assets.",
  //   "bbox": [-76.633203, 2.613548, -75.19659, 5.423638]
  // },
  // {
  //   "url": "/home/yifanmai/oss/geospatial-data-index/output/stac_catalogs/disaster-data-releases-from-planet-labs-pbc/colombia-earthquake-2026-08-10/post-event/planetscope-2026-08-11/collection.json",
  //   "title": "Quindío coffee axis (PlanetScope, post-event) — 11 August 2026",
  //   "description": "PlanetScope PSB.SD imagery acquired 11 August 2026 at 16:04 UTC over the Quindío coffee axis on the western flank of the Cordillera Central — Armenia, Calarcá, Circasia, Montenegro, Quimbaya and La Tebaida — roughly 70 km east-south-east of the epicentre. Two consecutive scenes from a single strip (satellite 252e, strip 8956803) form one continuous north-east to south-west swath running from the valley floor up to the Los Nevados massif. Acquisition is near-nadir (2.8 degrees off-nadir) with a high 71 degree sun elevation, so building lean and shadowing are minimal. 89% of this footprint was already imaged by the 10 August PlanetScope pass, so the collection pairs with planetscope-2026-08-10 for same-sensor 24-hour change detection at 3 m, as well as against the near-nadir Q2 2026 basemap. Cloud is low but not absent: 9% and 7% cloud with a further 4% and 1% light haze, leaving 83% and 89% of the two scenes clear. Almost all of it sits along the eastern, higher-elevation edge of the swath over the cordillera flank, so the populated valley floor is effectively clear — check the UDM2 before radiometric work or automated change detection. Visual and surface-reflectance (analytic_sr + UDM2) products support landslide and damage mapping across the steep, wet coffee-growing slopes. 2 scenes; each Item carries the available visual, analytic_sr, udm2 assets.",
  //   "bbox": [-75.89545, 4.340398, -75.553002, 4.692315]
  // },
  // {
  //   "url": "/home/yifanmai/oss/geospatial-data-index/output/stac_catalogs/forest-observatory/wildfire/collection.json",
  //   "title": "Wildfire likelihood, intensity, and severity metrics",
  //   "description": "Predictions of the geography and intensity of simulated wildfires, as well as post-fire burn severity measurements. Read more at https://the.forestobservatory.com/data",
  //   "bbox": [-124.410934, 32.53344, -114.129695, 41.999258],
  // },
  // {
  //   "url": "/home/yifanmai/oss/geospatial-data-index/output/stac_catalogs/forest-observatory/vegetation/collection.json",
  //   "title": "CFO forest structure and fuels data",
  //   "description": "Patterns of forest structure and forest fuels that drive wildfire behavior. Read more at https://the.forestobservatory.com/data",
  //   "bbox": [-124.410934, 32.53344, -114.129695, 41.999258],
  // }
  // ])
};
  

  const onSelectResult = (stacCollection: STACCollection) => {
    setSelectedSTACCollection(stacCollection);
  }


  return (
    <>
      <SearchQueryBox onSearchQuery={onSearchQuery}></SearchQueryBox>
      {stacCollections ? <SearchResultsBox stacCollections={stacCollections} selectedSTACCollection={selectedSTACCollection} onSelectResult={onSelectResult}></SearchResultsBox> : null}
      {selectedSTACCollection ? <STACCollectionInfoBox stacCollection={selectedSTACCollection}></STACCollectionInfoBox> : null}
      <Map stacCollections={stacCollections} selectedSTACCollection={selectedSTACCollection} onSelectResult={onSelectResult}></Map>
    </>
  )
}

