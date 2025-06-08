import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaVial, FaSmog, FaTint } from 'react-icons/fa';
import Navbar from './Dnavbar';

const API_BASE_URL = 'http://localhost:5000/api';
const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000, 
});
 
const Realtime = () => {
  const navigate = useNavigate();
  const { deviceId: paramDeviceId } = useParams();
  const { state } = useLocation();
  const rawDeviceId = paramDeviceId || state?.deviceId;
  const deviceId = rawDeviceId?.startsWith('user-') ? rawDeviceId.replace('user-', '') : rawDeviceId;
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode] = useState(false); // Set to false for simplicity; adjust if needed

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      if (!deviceId) {
        toast.error('Device ID is missing.', { theme: isDarkMode ? 'dark' : 'light' });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id || payload.userId;
        const response = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${deviceId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId },
        });
        const fetchedData = response.data.sensorData || [];
        setSensorData(fetchedData);
      } catch (err) {
        console.error('Failed to fetch sensor data:', err);
        toast.error(err.response?.data?.message || 'Failed to load sensor data.', {
          theme: isDarkMode ? 'dark' : 'light',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    socket.on('connect', () => console.log('Socket connected on Realtime page'));
    socket.on('disconnect', () => console.log('Socket disconnected on Realtime page'));

    const handleNewSensorData = (data) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userIdFromToken = decodedToken.id || decodedToken.userId;
        if (data.userId === userIdFromToken && data.deviceId === deviceId) {
          setSensorData((prevData) => {
            const newDataArray = [...prevData, data].slice(-100);
            return newDataArray;
          });
        }
      } catch (error) {
        console.error('Error processing new sensor data:', error);
      }
    };
    socket.on('newSensorData', handleNewSensorData);

    return () => {
      socket.off('newSensorData', handleNewSensorData);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [navigate, deviceId, isDarkMode]);

  const latestData = sensorData.length > 0 ? sensorData[sensorData.length - 1] : {
    ph: null,
    turbidity: null,
    tds: null,
  };

  const getPhAlertStyle = (ph) => {
    const base = `rounded-lg shadow-md p-4 flex items-center`;
    if (ph === null || ph === undefined) return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
    if (ph < 6.5 || ph > 7.5) return `${base} ${isDarkMode ? 'bg-red-700/30 text-red-200' : 'bg-pink-100 text-red-700'}`;
    return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
  };

  const getTurbidityAlertStyle = (turbidity) => {
    const base = `rounded-lg shadow-md p-4 flex items-center`;
    if (turbidity === null || turbidity === undefined) return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
    if (turbidity > 2.5) return `${base} ${isDarkMode ? 'bg-yellow-600/30 text-yellow-200' : 'bg-yellow-100 text-yellow-700'}`;
    return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
  };

  const getTdsAlertStyle = (tds) => {
    const base = `rounded-lg shadow-md p-4 flex items-center`;
    if (tds === null || tds === undefined) return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
    if (tds > 350 || tds < 150) return `${base} ${isDarkMode ? 'bg-red-700/30 text-red-200' : 'bg-pink-100 text-red-700'}`;
    return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
  };

  const phIconColor = latestData.ph !== null ? (latestData.ph < 6.5 || latestData.ph > 7.5 ? 'text-red-500' : 'text-sky-500') : 'text-slate-500';
  const turbidityIconColor = latestData.turbidity !== null ? (latestData.turbidity > 2.5 ? 'text-yellow-500' : 'text-sky-500') : 'text-slate-500';
  const tdsIconColor = latestData.tds !== null ? (latestData.tds < 150 || latestData.tds > 350 ? 'text-red-500' : 'text-sky-500') : 'text-slate-500';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <span className="ml-3 text-lg text-slate-700">Loading Realtime Data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 mt-20">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Realtime Sensor Data: {deviceId}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={getPhAlertStyle(latestData.ph)}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${
              latestData.ph !== null
                ? (latestData.ph < 6.5 || latestData.ph > 7.5
                    ? (isDarkMode ? 'bg-red-500/20' : 'bg-red-200')
                    : (isDarkMode ? 'bg-sky-500/20' : 'bg-sky-100'))
                : (isDarkMode ? 'bg-slate-600' : 'bg-slate-200')
            }`}>
              <FaVial className={`text-2xl ${phIconColor}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">pH Level</h3>
              <p className="text-2xl font-bold">{latestData.ph !== null ? latestData.ph.toFixed(2) : 'N/A'}</p>
              <p className="text-xs text-slate-400">Normal range: 6.5 - 7.5</p>
            </div>
          </div>
          <div className={getTurbidityAlertStyle(latestData.turbidity)}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${
              latestData.turbidity !== null
                ? (latestData.turbidity > 2.5
                    ? (isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-200')
                    : (isDarkMode ? 'bg-sky-500/20' : 'bg-sky-100'))
                : (isDarkMode ? 'bg-slate-600' : 'bg-slate-200')
            }`}>
              <FaSmog className={`text-2xl ${turbidityIconColor}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Turbidity</h3>
              <p className="text-2xl font-bold">
                {latestData.turbidity !== null ? latestData.turbidity.toFixed(2) : 'N/A'} <span className="text-sm">NTU</span>
              </p>
              <p className="text-xs text-slate-400">Normal range: 0 - 2.5 NTU</p>
            </div>
          </div>
          <div className={getTdsAlertStyle(latestData.tds)}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${
              latestData.tds !== null
                ? (latestData.tds < 150 || latestData.tds > 350
                    ? (isDarkMode ? 'bg-red-500/20' : 'bg-red-200')
                    : (isDarkMode ? 'bg-sky-500/20' : 'bg-sky-100'))
                : (isDarkMode ? 'bg-slate-600' : 'bg-slate-200')
            }`}>
              <FaTint className={`text-2xl ${tdsIconColor}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Total Dissolved Solids</h3>
              <p className="text-2xl font-bold">
                {latestData.tds !== null ? latestData.tds.toFixed(2) : 'N/A'} <span className="text-sm">ppm</span>
              </p>
              <p className="text-xs text-slate-400">Normal range: 150 - 350 ppm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Realtime;