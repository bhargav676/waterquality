import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeviceListPanel from '../../components/DeviceListPanel';

const Devices = () => {                                   
  const [devices, setDevices] = useState([]);                                
  const [selectedDevice, setSelectedDevice] = useState(null);                                  
  const [searchTerm, setSearchTerm] = useState('');                               
  const [isLoading, setIsLoading] = useState(true);                              
  const [error, setError] = useState(null);                           
                                                            
  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoading(true);
      setError(null);
      try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/devices`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, 
        });
        console.log('API Response:', response.data);
        setDevices(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Fetch Error:', err);
        setError(err.response?.data?.message || 'Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const handleSearch = e => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DeviceListPanel
        devices={devices}
        selectedDevice={selectedDevice}
        onDeviceClick={setSelectedDevice}
        searchTerm={searchTerm}
        onSearch={handleSearch}
        isLoading={isLoading}
      />
      <div className="flex-1 p-6">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {selectedDevice ? (
          <div>
            <h2 className="text-xl font-bold mb-2">{selectedDevice.name}</h2>
            <p className="text-sm text-slate-600">Device ID: {selectedDevice.deviceId}</p>
            <p className="text-sm text-slate-600">Status: {selectedDevice.status}</p>
            {/* Add Google Maps, charts, or sensor data */}
          </div>
        ) : (
          <p className="text-slate-500">Select a device to view details.</p>
        )}
      </div>
    </div>
  );
};

export default Devices;