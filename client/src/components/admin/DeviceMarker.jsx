import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export const createDeviceIcon = (status = 'normal') => {
  let iconColor = '#2563EB';
  if (status === 'alert') iconColor = '#DC2626';
  if (status === 'warning') iconColor = '#F59E0B';

  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${iconColor}" class="w-7 h-7 drop-shadow-md"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`,
    className: 'custom-leaflet-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const DeviceMarker = ({ device, onMarkerClick }) => {
  if (!device.location || !device.location.coordinates || device.location.coordinates.length !== 2) {
    return null;
  }

  return (
    <Marker
      key={device.deviceId}
      position={[device.location.coordinates[1], device.location.coordinates[0]]}
      icon={createDeviceIcon(device.status)}
      eventHandlers={{ click: () => onMarkerClick(device) }}
    >
      <Popup autoPan={false}>{device.name || 'Unnamed Device'}</Popup>
    </Marker>
  );
};

export default DeviceMarker;