import React, { useState, useEffect } from 'react';
import { useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

function MapContent() {
  const map = useMap();
  const [selected, setSelected] = useState(null);

  // Address search bar
  useEffect(() => {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: 'Search address...',
    })
      .on('markgeocode', (e) => {
        const { center, name } = e.geocode;

        setSelected({
          lat: center.lat,
          lng: center.lng,
          address: name
        });

        map.flyTo(center, 16);
      })
      .addTo(map);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);

  // Clicking the map retrieves an address
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      setSelected({
        lat,
        lng,
        address: 'Loading address...'
      });

      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lng),
          format: 'jsonv2',
          'accept-language': 'pl'
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${params}`
        );

        if (!response.ok) {
          throw new Error('Geocoding failed');
        }

        const data = await response.json();

        setSelected(current => {
          // Ignore an outdated response if another location was selected
          if (
            !current ||
            current.lat !== lat ||
            current.lng !== lng
          ) {
            return current;
          }

          return {
            ...current,
            address: data.display_name || 'Address not found'
          };
        });

      } catch (error) {
        console.error(error);

        setSelected(current => {
          if (
            !current ||
            current.lat !== lat ||
            current.lng !== lng
          ) return current;

          return {
            ...current,
            address: 'Could not retrieve address'
          };
        });
      }
    }
  });

  return selected ? (
    <Marker position={[selected.lat, selected.lng]}>
      <Popup>
        <strong>Selected location</strong>
        <p>{selected.address}</p>
        <small>
          {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
        </small>
      </Popup>
    </Marker>
  ) : null;
}

export default MapContent;