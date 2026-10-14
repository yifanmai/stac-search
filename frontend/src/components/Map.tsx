import {Collection, Map as OLMap, View} from 'ol';
import {fromLonLat} from 'ol/proj.js';

import {click} from 'ol/events/condition.js';
import { useEffect } from 'react';
import { useRef } from 'react';
import type STACCollection from '../types/STACCollection';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon.js';
import { MultiPolygon } from 'ol/geom';
import Style from 'ol/style/Style';
// import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Select from 'ol/interaction/Select.js';
import { apply as applyOLMapboxStyle } from 'ol-mapbox-style';
import LayerGroup from 'ol/layer/Group';



const DEFAULT_PADDING = [64, 64, 64, 64 + (64 + 640) * 2];

interface Props {
  stacCollections: STACCollection[];
  selectedSTACCollection: STACCollection | null;
  onSelectResult: (stacCollection: STACCollection) => void;
}

interface OLMapState {
  map: OLMap;
  vectorSource: VectorSource;
  featureCollection: Collection<Feature>;
}

const resultStyle = new Style({
  stroke: new Stroke({
   color: '#3399CC',
   width: 2.5,
 }),
});

const selectStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(255, 0, 0, 1)',
    width: 2.5,
  }),
});

// select interaction working on "click"
const selectInteraction = new Select({
  condition: click,
  style: selectStyle,
});

function getGeoJSONFeatureForSTACCollection(stacCollection: STACCollection): Feature {
  const coords = [];
  // console.log(stacCollection.bbox.coordinates[0][0][0])
  // console.log(stacCollection.bbox.coordinates[0][0][1])
  // console.log(stacCollection.bbox.coordinates[0][2][0])
  // console.log(stacCollection.bbox.coordinates[0][2][1])
  coords.push(fromLonLat(stacCollection.bbox.coordinates[0][0]));
  coords.push(fromLonLat(stacCollection.bbox.coordinates[0][2]));
  const feature = new GeoJSON().readFeature({
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [coords[0][0], coords[0][1]],
              [coords[1][0], coords[0][1]],
              [coords[1][0], coords[1][1]],
              [coords[0][0], coords[1][1]],
              [coords[0][0], coords[0][1]],
            ],
          ],
        },
        'properties': {
          'url': stacCollection.url
        }
      }, {dataProjection: 'EPSG:3857'});
      console.log(feature);
    // readFeature() can return Feature or Feature[]
    // but this function should only return Feature
    if (feature instanceof Feature) {
      return feature;
    } else {
      return feature[0];
    }
}

function getPolygonForSTACCollection(stacCollection: STACCollection): Polygon {
  const coords = [];
  // coords.push(fromLonLat([stacCollection.bbox[0], stacCollection.bbox[1]]));
  // coords.push(fromLonLat([stacCollection.bbox[2], stacCollection.bbox[3]]));
  coords.push(fromLonLat(stacCollection.bbox.coordinates[0][0]));
  coords.push(fromLonLat(stacCollection.bbox.coordinates[0][2]));
  return new Polygon([
            [
              [coords[0][0], coords[0][1]],
              [coords[1][0], coords[0][1]],
              [coords[1][0], coords[1][1]],
              [coords[0][0], coords[1][1]],
              [coords[0][0], coords[0][1]],
            ],
          ])
}

function getMultiPolygonForSTACCollection(stacCollections: STACCollection[]): MultiPolygon {
  const polygons = stacCollections.map(getPolygonForSTACCollection);
  return new MultiPolygon(polygons);
}


function setFeaturesFromSTACCollections(featureCollection: Collection<Feature>, stacCollections: STACCollection[]): void {
  const features = stacCollections.map(getGeoJSONFeatureForSTACCollection);
  featureCollection.clear();
  featureCollection.extend(features);
}

function viewActiveSTACCollection(map: OLMap, stacCollection: STACCollection): void {
  const stacCollectionGeoJSON = getPolygonForSTACCollection(stacCollection);
  map.getView().fit(stacCollectionGeoJSON, {duration: 1000, maxZoom: 10, padding: [64, 64, 64, 64 + (64 + 320) * 2]});
  // console.log(stacCollectionGeoJSON);
}

function viewAllSTACCollections(map: OLMap, stacCollections: STACCollection[]): void {
  const stacCollectionMultiPolygon = getMultiPolygonForSTACCollection(stacCollections);
  map.getView().fit(stacCollectionMultiPolygon  , {duration: 1000, maxZoom: 10, padding: [64, 64, 64, 64 + 64 + 320]});
}

function Map({
  stacCollections,
  selectedSTACCollection,
  onSelectResult,
}: Props) {
  // const [count, setCount] = useState(0)
  const mapRef = useRef<OLMap | null>(null);
  const mapStateRef = useRef<OLMapState | null>(null);
  const stacCollectionsRef = useRef<STACCollection[]>(stacCollections);

  useEffect(() => {
    console.log("currect cols", stacCollections)
    stacCollectionsRef.current = stacCollections;
    if (!mapStateRef.current) {
      
      const openFreeMapLayerGroup = new LayerGroup()
      applyOLMapboxStyle(openFreeMapLayerGroup, "https://tiles.openfreemap.org/styles/positron")

      const map = new OLMap({
        target: 'map',
        layers: [
            openFreeMapLayerGroup
        ],
        view: new View({
            center: [0, 0],
            zoom: 1
        })
      });
      mapRef.current = map;
      const featureCollection = new Collection<Feature>();

      const vectorSource = new VectorSource({
        features: featureCollection,
      });
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: resultStyle,
      });
      map.addLayer(vectorLayer);
      map.addInteraction(selectInteraction);
      selectInteraction.on("select", (event) => {
        const selectedFeatures = event.target.getFeatures().getArray();
        if (selectedFeatures.length !== 1) {
          return;
        }
        const selectedFeature = selectedFeatures[0];
        const selectedSTACCollectionURL = selectedFeature.getProperties()["url"];
        if (selectedSTACCollection && selectedSTACCollection.url === selectedSTACCollectionURL)  {
          return;
        }
        for (const stacCollection of stacCollectionsRef.current) {
          if (stacCollection.url == selectedSTACCollectionURL) {
            onSelectResult(stacCollection);
            return;
          }
        }
      });
      mapStateRef.current = {map: map, vectorSource: vectorSource, featureCollection: featureCollection};
    }
    setFeaturesFromSTACCollections(mapStateRef.current.featureCollection, stacCollections);
    if (selectedSTACCollection) {
      for (const feature of mapStateRef.current.vectorSource.getFeatures()) {
        if (feature.getProperties()["url"] == selectedSTACCollection["url"]) {
          selectInteraction.selectFeature(feature);
          break;
        }
      }
      viewActiveSTACCollection(mapStateRef.current.map, selectedSTACCollection);
    } else if (stacCollections.length > 0) {
      viewAllSTACCollections(mapStateRef.current.map, stacCollections);
    }
    
  });

  

  return (
    <div id="map"></div>
  )
}

export default Map
