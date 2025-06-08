import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import axios from 'axios';
import io from 'socket.io-client';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import DeviceListPanel from './DeviceListPanel';
import SensorDataPanel from './SensorDataPanel';
import MapViewController from './MapViewController';
import DeviceMarker from './DeviceMarker';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const socket = io(`${import.meta.env.VITE_API_URL}`);

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {  
      if (error.config.url.includes('/user/profile') || error.config.url.includes('/user/add-user')) {
        return Promise.reject(error);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('accessId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const MAP_LAYERS = {
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">Esri</a>, Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
  },
  streets: {
    name: 'Streets',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © <a href="https://www.arcgis.com/home/item.html?id=3b93337983e9436f8db950e38a8629af">Esri</a>, Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  }
};

const INDIA_INITIAL_BOUNDS = [[9.5546079, 60.1113787], [34.6745457, 97.395561]];
const DEVICE_ZOOM_LEVEL = 14;

function isMobileScreen() {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
}

const AdminDashboard = () => {
  const [devices, setDevices] = useState([]);
  const [isDeviceListOpen, setIsDeviceListOpen] = useState(() => !isMobileScreen());
  const [userSensors, setUserSensors] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [isLoading, setIsLoading] = useState({ devices: true, sensorData: false });
  const [mapView, setMapView] = useState({ bounds: INDIA_INITIAL_BOUNDS });
  const [activeMapLayer, setActiveMapLayer] = useState('satellite');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const mapRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      if (Date.now() >= expirationTime) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('accessId');
        navigate('/login');
        return;
      }
    } catch (err) {
      console.error('Error decoding token:', err);
      setError('Invalid token. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('accessId');
      navigate('/login');
    }
  }, [navigate]);

  const fetchDevices = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, devices: true }));
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/devices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const deviceData = Array.isArray(response.data) ? response.data : response.data.devices || [];
      setDevices(deviceData.map(d => ({ ...d, status: 'active', type: 'admin' })));
    } catch (error) {
      console.error('Error fetching admin devices:', error);
      setDevices([]);
    } finally {
      setIsLoading(prev => ({ ...prev, devices: false }));
    }
  }, []);

  const fetchUserDevices = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, devices: true }));
    try {
      
      const devicesResponse = await axios.get(`${API_BASE_URL}/admin/devices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const deviceData = Array.isArray(devicesResponse.data) ? devicesResponse.data : [];
      
      
      const userSensorsData = [];
      for (const device of deviceData) {
        try {
          const sensorResponse = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${device.userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const latestData = Array.isArray(sensorResponse.data) && sensorResponse.data.length > 0 
            ? sensorResponse.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
            : null;
          
          if (latestData) {
            const status = latestData.ph > 8.5 || latestData.ph < 6.5 || latestData.turbidity > 25 || latestData.tds > 1000 ? 'alert' :
                          (latestData.ph >= 6.0 && latestData.ph <= 9.0 && latestData.turbidity <= 25 && latestData.tds <= 1000) ? 'active' : 'warning';
            userSensorsData.push({
              deviceId: device.deviceId,
              userId: device.userId,
              name: device.name,
              location: device.location,
              latestData,
              status,
              type: 'user'
            });
          }
        } catch (sensorError) {
          console.error(`Error fetching sensor data for user ${device.userId}:`, sensorError);
        }
      }
      setUserSensors(userSensorsData);
    } catch (error) {
      console.error('Error fetching user sensor data:', error);
      setUserSensors([]);
    } finally {
      setIsLoading(prev => ({ ...prev, devices: false }));
    }
  }, []);

  useEffect(() => {
    if (error) return;
    fetchDevices();
    fetchUserDevices();
    socket.on('newUserSensorData', (data) => {
      setUserSensors((prev) => {
        const existing = prev.find((d) => d.userId === data.userId._id);
        const status = data.ph > 8.5 || data.ph < 6.5 || data.turbidity > 25 || data.tds > 1000 ? 'alert' :
                       (data.ph >= 6.0 && data.ph <= 9.0 && data.turbidity <= 25 && data.tds <= 1000) ? 'active' : 'warning';
        if (existing) {
          return prev.map((d) => 
            d.userId === data.userId._id
              ? { ...d, location: { coordinates: [data.longitude, data.latitude] }, latestData: data, status }
              : d
          );
        }
        return [
          ...prev,
          {
            deviceId: `user-${data.userId._id}`,
            userId: data.userId._id,
            name: data.userId.username || `User-${data.userId._id}`,
            location: { coordinates: [data.longitude, data.latitude] },
            latestData: data,
            status,
            type: 'user'
          }
        ];
      });
    });
    return () => socket.off('newUserSensorData');
  }, [fetchDevices, fetchUserDevices, error]);

  const handleMarkerClick = useCallback(async (device) => {
    if (selectedDevice?.deviceId === device.deviceId && sensorData) return;
    setSelectedDevice(device);
    setSensorData(null);
    setIsLoading(prev => ({ ...prev, sensorData: true }));
    setMapView({
      center: [device.location.coordinates[1], device.location.coordinates[0]],
      zoom: DEVICE_ZOOM_LEVEL
    });
    setIsDeviceListOpen(false);
    try {
      let response;
      if (device.type === 'admin') {
        // Fetch sensor data for admin device using userId
        response = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${device.userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        response = { data: device.latestData };
      }
      setSensorData(Array.isArray(response.data) && response.data.length > 0 
        ? response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
        : response.data);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setSensorData(null);
    } finally {
      setIsLoading(prev => ({ ...prev, sensorData: false }));
    }
  }, [selectedDevice, sensorData]);

  const handleCloseDevicePanel = useCallback(() => {
    setSelectedDevice(null);
    setSensorData(null);
  }, []);

  const zoomToFitAllDevices = useCallback(() => {
    const allDevices = [...devices, ...userSensors];
    if (allDevices.length > 0) {
      const deviceBounds = L.latLngBounds(allDevices.map(d => [d.location.coordinates[1], d.location.coordinates[0]]));
      setMapView({ bounds: deviceBounds });
    } else {
      setMapView({ bounds: INDIA_INITIAL_BOUNDS });
    }
    setSelectedDevice(null);
  }, [devices, userSensors]);

  const getStatusInfo = (value, type) => {
    let color = 'text-gray-500';
    let bgColor = 'bg-gray-100';
    let text = 'N/A';
    if (value === null || value === undefined) return { color, bgColor, text };
    if (type === 'ph') {
      text = value.toFixed(1);
      if (value >= 6.5 && value <= 8.5) { color = 'text-green-600'; bgColor = 'bg-green-100'; }
      else if ((value >= 6.0 && value < 6.5) || (value > 8.5 && value <= 9.0)) { color = 'text-yellow-600'; bgColor = 'bg-yellow-100'; }
      else { color = 'text-red-600'; bgColor = 'bg-red-100'; }
    } else if (type === 'turbidity') {
      text = `${value.toFixed(1)} NTU`;
      if (value <= 5) { color = 'text-green-600'; bgColor = 'bg-green-100'; }
      else if (value <= 25) { color = 'text-yellow-600'; bgColor = 'bg-yellow-100'; }
      else { color = 'text-red-600'; bgColor = 'bg-red-100'; }
    } else if (type === 'tds') {
      text = `${value} ppm`;
      if (value <= 500) { color = 'text-green-600'; bgColor = 'bg-green-100'; }
      else if (value <= 1000) { color = 'text-yellow-600'; bgColor = 'bg-yellow-100'; }
      else { color = 'text-red-600'; bgColor = 'bg-red-100'; }
    }
    return { color, bgColor, text };
  };

  const filteredDevices = [...devices, ...userSensors].filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleDeviceList = () => {
    setIsDeviceListOpen(prev => !prev);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
        <button onClick={() => navigate('/login')} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Log In
        </button>
      </div>
    );
  }

  return (
      <div className="h-screen flex flex-col overflow-hidden">
    <Navbar
  onToggleSidebar={handleToggleDeviceList}
  onOpenDevicePanel={() => setIsDeviceListOpen(true)}
/>
    <main className="flex-1 flex relative bg-transparent">
      <DeviceListPanel
        isOpen={isDeviceListOpen}
        devices={filteredDevices}
        selectedDevice={selectedDevice}
        onDeviceClick={handleMarkerClick}
        searchTerm={searchTerm}
        onSearch={(e) => setSearchTerm(e.target.value)}
        isLoading={isLoading.devices}
        onClose={() => setIsDeviceListOpen(false)}
      />
        <section className="flex-1 h-full relative z-0">
          <MapContainer
            ref={mapRef}
            center={undefined}
            zoom={undefined}
            scrollWheelZoom={true}
            className="w-full h-full z-0 bg-transparent"
            zoomControl={false}
          >
            <MapViewController bounds={mapView.bounds} center={mapView.center} zoom={mapView.zoom} />
            <TileLayer
              key={activeMapLayer}
              url={MAP_LAYERS[activeMapLayer].url}
              attribution={MAP_LAYERS[activeMapLayer].attribution}
            />
            {[...devices, ...userSensors].map((device) => (
              <DeviceMarker key={device.deviceId} device={device} onMarkerClick={handleMarkerClick} />
            ))}
          </MapContainer>
        </section>
        {selectedDevice && (
          <SensorDataPanel
            device={selectedDevice}
            sensorData={sensorData}
            isLoading={isLoading.sensorData}
            onClose={handleCloseDevicePanel}
            getStatusInfo={getStatusInfo}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;