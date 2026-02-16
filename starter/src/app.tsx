/**
 * Copyright 2024 Google LLC
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    https://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {createRoot} from "react-dom/client";
import {AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, useMap, InfoWindow} from '@vis.gl/react-google-maps';
import { Marker, MarkerClusterer } from '@googlemaps/markerclusterer';
import {Circle} from './components/circle'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string;

type Poi ={ key: string, location: google.maps.LatLngLiteral }
const locations: Poi[] = [
  {
    key: 'sukhbaatar_square',
    location: { lat: 47.9184676, lng: 106.9177016 } // Sükhbaatar Square
  },
  {
    key: 'zaisan_memorial',
    location: { lat: 47.8859914, lng: 106.9132822 } // Zaisan Hill Memorial
  },
  {
    key: 'narantuul_market',
    location: { lat: 47.9223350, lng: 106.9592460 } // Narantuul (Black Market)
  },
  {
    key: 'gandan_monastery',
    location: { lat: 47.9230580, lng: 106.8943150 } // Gandantegchinlen Monastery
  },
  {
    key: 'bogd_khaan_palace',
    location: { lat: 47.8991020, lng: 106.9093150 } // Winter Palace of Bogd Khan
  },
  {
    key: 'national_park',
    location: { lat: 47.9145130, lng: 106.9417550 } // National Amusement Park
  },
  {
    key: 'bayanzurkh_district',
    location: { lat: 47.9222220, lng: 106.9708330 } // Bayanzürkh District center
  },
  {
    key: 'bayangol_district',
    location: { lat: 47.9185560, lng: 106.8678890 } // Bayangol District center
  },
  {
    key: 'bagakhangai_district',
    location: { lat: 47.3576110, lng: 107.4667220 } // Bagakhangai District center
  }
];


const App = () => (
 <APIProvider  language='MN' apiKey={apiKey} onLoad={() => console.log('Maps API has loaded.')}>
   <Map
      defaultZoom={13}
      minZoom={3}
      maxZoom={20}
      defaultCenter={ { lat: 47.919913, lng: 106.917566 } }
      //need mapId to use advanced marker
      mapId={mapId}
      //removed default(weird) handlers
      disableDefaultUI={true}
      gestureHandling={'greedy'}
      onCameraChanged={ (e: MapCameraChangedEvent) =>
        console.log('camera changed:', e.detail.center, 'zoom:', e.detail.zoom)
      }
      restriction={{
        latLngBounds: {
          north: 52.15473,  
          south: 41.59744,
          east: 119.93139,
          west: 87.74825
        }
      }}
    >
      <PoiMarkers pois={locations} />
   </Map>
 </APIProvider>
);

const PoiMarkers = (props: {pois: Poi[]}) => {
  const map = useMap();
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLng | null>(null)
  const [markers, setMarkers] = useState<{[key: string]: Marker}>({});
  const clusterer = useRef<MarkerClusterer | null>(null);
  // Initialize MarkerClusterer, if the map has changed
   useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({map});
    }
  }, [map]);

  // Update markers, if the array has changed
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;

    setMarkers(prev => {
      if (marker) {
        return {...prev, [key]: marker};
      } else {
        const newMarkers = {...prev};
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  const handleClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
      setCircleCenter(new google.maps.LatLng(poi.location));
      map?.panTo(poi.location);
    },
    [map]
  );

  return (
    <>
       <Circle
          radius={800}
          center={circleCenter}
          strokeColor={'#0c4cb3'}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={'#3b82f6'}
          fillOpacity={0.3}
        />
      {props.pois.map((poi: Poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          ref={marker => setMarkerRef(marker, poi.key)}
          onClick={() => handleClick(poi)}
        >
          <img
            src="/water_pin.png"
            alt="marker"
            style={{
              width: "32px",
              height: "32px",
              objectFit: "contain"
            }}
          />
        </AdvancedMarker>
        
      ))}
      {selectedPoi && (
      <InfoWindow
        position={selectedPoi.location}
        onCloseClick={() => setSelectedPoi(null)}
      >
        <div>
          <strong>{selectedPoi.key.replace(/_/g, " ")}</strong>
          <div>
            Lat: {selectedPoi.location.lat}
            <br />
            Lng: {selectedPoi.location.lng}
          </div>
        </div>
      </InfoWindow>
    )}
  </>
  );
};

const rootElement = document.getElementById('app');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}
const root = createRoot(rootElement);
root.render(<App />);

export default App;
