import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const InvalidateMapSize = () => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.invalidateSize();
      const timer = setTimeout(() => map.invalidateSize(), 150);
      return () => clearTimeout(timer);
    }
  }, [map]);
  return null;
};

export default InvalidateMapSize;