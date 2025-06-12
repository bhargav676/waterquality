import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaThermometerHalf, FaBatteryFull, FaBatteryQuarter, FaSignal } from 'react-icons/fa';

const GatewayHealth = () => {
  const { isDarkMode, formatTimestampToIST } = useOutletContext();
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchDeviceSummary = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/sensor/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const summaryData = response.data || [];
        const deviceArray = summaryData.map((data) => ({
          deviceId: data.deviceId,
          name: data.deviceId,
          temperature: data.temperature != null ? data.temperature : null,
          battery: data.battery != null ? data.battery : null,
          capacity: data.capacity != null ? data.capacity : null,
          timestamp: data.timestamp,
          status: (new Date() - new Date(data.timestamp)) < 5 * 60 * 1000 ? 'Online' : 'Offline',
        }));
        setDevices(deviceArray);
        setHasMore(false); // Summary endpoint provides latest data, no pagination needed here
      } catch (err) {
        console.error('Failed to fetch device summary:', err.response?.status, err.response?.data || err.message);
        setDevices([]);
        toast.error('Failed to load device data.', { theme: isDarkMode ? 'dark' : 'light' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeviceSummary();
  }, [isDarkMode]);

  const getStatusStyle = (status) => {
    return status === 'Online'
      ? 'bg-green-100 text-green-800 border-l-4 border-green-600'
      : 'bg-red-100 text-red-800 border-l-4 border-red-600';
  };

  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <ToastContainer
        newestOnTop
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <h1 className={`text-3xl font-bold mb-2 mt-20 ${isDarkMode ? 'text-slate-100' : 'text-sky-900'} animate-fade-in`}>
        IoT Gateway Health
      </h1>
      <p className={`text-base mb-6 ${isDarkMode ? 'text-slate-300' : 'text-sky-600'} animate-fade-in`}>
        Monitor the status and parameters of your IoT gateway devices.
      </p>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div
              className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${
                isDarkMode ? 'border-slate-300' : 'border-sky-600'
              }`}
            ></div>
          </div>
        ) : devices.length > 0 ? (
          devices.map((device, index) => (
            <div
              key={device.deviceId}
              className={`rounded-xl shadow-lg p-5 bg-white transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
                  <p className={`text-sm font-medium ${getStatusStyle(device.status)} px-2 py-1 rounded-md inline-block mt-1`}>
                    Status: {device.status}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <FaThermometerHalf className="text-2xl text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Temperature</p>
                      <p className="text-base">{device.temperature != null ? `${device.temperature} °C` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaBatteryFull className="text-2xl text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Battery Voltage</p>
                      <p className="text-base">{device.battery != null ? `${device.battery} V` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaBatteryQuarter className="text-2xl text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Battery Capacity</p>
                      <p className="text-base">{device.capacity != null ? `${device.capacity}%` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Last Active: {formatTimestampToIST(device.timestamp) || 'N/A'}
              </p>
            </div>
          ))
        ) : (
          <div
            className={`rounded-xl shadow-lg p-6 text-center ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-sky-600'} animate-fade-in`}
          >
            <p className="text-base font-medium">No devices found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GatewayHealth;