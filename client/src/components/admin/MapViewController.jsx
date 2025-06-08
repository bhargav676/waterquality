



import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const MapViewController = ({ bounds, center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && map) { // Check if map instance exists
      map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 1 });
    } else if (center && map) { // Check if map instance exists
      map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1.2 });
    }
  }, [bounds, center, zoom, map]);
  return null;
};

export default MapViewController;