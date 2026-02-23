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
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {Circle} from './components/circle'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string;

import locations from './locations.json';

type Poi ={ key: string, location: google.maps.LatLngLiteral }


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

const PoiMarkers = (props: {pois:Poi[]}) => {
  const map = useMap();
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [markers, setMarkers] = useState<{[key: string]: google.maps.marker.AdvancedMarkerElement}>({});
  const [isDragging, setIsDragging] = useState(false);
  const clusterer = useRef<MarkerClusterer | null>(null);
  // Initialize MarkerClusterer, if the map has changed
   useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({
        map,
        renderer: {
          render: ({ count, position }) => {
            const pin = new google.maps.marker.PinElement({
              glyph: String(count),
              background: "#0c4cb3",
              borderColor: "white",
              glyphColor: "white",
              scale: 1.2
            });

            return new google.maps.marker.AdvancedMarkerElement({
              position,
              content: pin.element,
            });
          }
        }
      });
    }
  }, [map]);

  // Update markers, if the array has changed
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  // Hide markers during drag for performance
  useEffect(() => {
    if (!map || !clusterer.current) return;

    const dragStartListener = map.addListener('dragstart', () => {
      setIsDragging(true);
      clusterer.current?.setMap(null);
    });

    const dragEndListener = map.addListener('dragend', () => {
      setIsDragging(false);
      clusterer.current?.setMap(map);
    });

    return () => {
      google.maps.event.removeListener(dragStartListener);
      google.maps.event.removeListener(dragEndListener);
    };
  }, [map]);

  const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
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
      map?.panTo(poi.location);
    },
    [map]
  );

  return (
    <>
      {!isDragging && props.pois.map((poi: Poi) => (
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
        headerContent={selectedPoi.key.replace(/_/g, " ")}
        pixelOffset={new google.maps.Size(0, -25)}
      >
        <div>
          Lat: {selectedPoi.location.lat}
          <br />
          Lng: {selectedPoi.location.lng}
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
