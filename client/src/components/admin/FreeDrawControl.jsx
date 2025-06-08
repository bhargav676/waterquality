import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-freedraw'; // Make sure this is imported to extend L.Map

const FreeDrawControl = ({ map }) => {
  useEffect(() => {
    if (!map || !L.FreeDraw) {
      console.error('Map or FreeDraw is not defined');
      return;
    }

    const freeDraw = new L.FreeDraw();

    // Add control to the map
    map.addLayer(freeDraw);

    // Optional: Event listeners
    map.on('freedraw:create', (event) => {
      console.log('Shape created:', event);
    });

    // Clean up on component unmount
    return () => {
      map.removeLayer(freeDraw);
    };
  }, [map]);

  return null;
};

export default FreeDrawControl;
