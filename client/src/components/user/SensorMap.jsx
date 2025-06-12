import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import InvalidateMapSize from './InvalidateMapSize';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const SensorMap = ({ latitude, longitude, isDarkMode }) => {
  const mapCenter = [latitude && !isNaN(latitude) ? latitude : 22.3511, longitude && !isNaN(longitude) ? longitude : 78.6677];

  return (
    <div className={`relative z-0 p-5 sm:p-6 rounded-xl shadow-lg flex flex-col transition-all duration-300 hover:shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Sensor Location</h3>
      {latitude && longitude && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      )}
      <div className={`flex-grow rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} min-h-[300px]`}>
        {latitude && longitude && !isNaN(latitude) && !isNaN(longitude) ? (
          <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} key={`${mapCenter[0]}-${mapCenter[1]}-${isDarkMode}`}>
            <TileLayer
              url={isDarkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              attribution={isDarkMode ? '© OpenStreetMap contributors © CARTO' : '© OpenStreetMap contributors'}
            />
            <Marker position={[latitude, longitude]}>
              <Popup>Sensor Location</Popup>
            </Marker>
            <InvalidateMapSize />
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            <p className="text-base text-slate-500 dark:text-slate-400">Location data not available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorMap;