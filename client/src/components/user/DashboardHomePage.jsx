import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import L from 'leaflet';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { FaVial, FaSmog, FaTint } from 'react-icons/fa';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ 
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const socket = io(`${import.meta.env.VITE_API_URL}`, {
  reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 1000,
});

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

const MAX_X_AXIS_POINTS = 10;

const DashboardHomePage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const isDarkMode = outletContext?.isDarkMode ?? false;
  const formatTimestampContext = outletContext?.formatTimestampToIST;
  const pageUsername = outletContext?.username || 'User';
  const setSensorDataForLayoutCSV = outletContext?.setSensorDataForLayoutCSV;

  const formatTimestamp = formatTimestampContext || ((ts) => ts ? new Date(ts).toLocaleString() : 'N/A');

  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/sensor/data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedData = response.data || [];
        setSensorData(fetchedData);
        if (typeof setSensorDataForLayoutCSV === 'function') {
          setSensorDataForLayoutCSV(fetchedData);
        }
      } catch (err) {
        console.error('Failed to fetch sensor data for dashboard page:', err);
        toast.error('Failed to load sensor data.', { theme: isDarkMode ? 'dark' : 'light' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    socket.on('connect', () => console.log('Socket connected on DashboardHomePage'));
    socket.on('disconnect', () => console.log('Socket disconnected on DashboardHomePage'));

    const handleNewSensorData = (data) => {
      try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;
        const decodedToken = JSON.parse(atob(currentToken.split('.')[1]));
        const userIdFromToken = decodedToken.userId || decodedToken.id;
        if (data.userId === userIdFromToken) {
          setSensorData((prevData) => {
            const newDataArray = [...prevData, data].slice(-100);
            if (typeof setSensorDataForLayoutCSV === 'function') {
              setSensorDataForLayoutCSV(newDataArray);
            }
            return newDataArray;
          });
        }
      } catch (error) {
        console.error('Error processing token or new sensor data:', error);
      }
    };
    socket.on('sensorDataUpdate', handleNewSensorData);

    return () => {
      socket.off('sensorDataUpdate', handleNewSensorData);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [navigate, isDarkMode, setSensorDataForLayoutCSV]);

  const latestData = sensorData.length > 0 ? sensorData[sensorData.length - 1] : { ph: null, turbidity: null, tds: null, timestamp: null, latitude: null, longitude: null };

  const chartDataPoints = useMemo(() => {
    const sourceRecords = [...sensorData]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-24);

    if (sourceRecords.length === 0) return [];
    if (sourceRecords.length <= MAX_X_AXIS_POINTS) {
      return sourceRecords;
    }

    const result = [sourceRecords[0]];
    const numIntermediatePointsToSelect = MAX_X_AXIS_POINTS - 2;
    const availableIntermediateSourcePoints = sourceRecords.length - 2;

    if (numIntermediatePointsToSelect <= 0) {
      if (sourceRecords.length > 1 && result[0].timestamp !== sourceRecords[sourceRecords.length - 1].timestamp && MAX_X_AXIS_POINTS > 1) {
        result.push(sourceRecords[sourceRecords.length - 1]);
      }
      return result;
    }

    const step = Math.max(1, Math.floor(availableIntermediateSourcePoints / (numIntermediatePointsToSelect + 1)));
    for (let i = 1; i <= numIntermediatePointsToSelect; i++) {
      const index = i * step + 1;
      if (index < sourceRecords.length - 1 && sourceRecords[index]) {
        result.push(sourceRecords[index]);
      } else {
        break;
      }
    }

    if (sourceRecords.length > 1 && (result.length === 0 || result[result.length - 1].timestamp !== sourceRecords[sourceRecords.length - 1].timestamp)) {
      if (result.length >= MAX_X_AXIS_POINTS && MAX_X_AXIS_POINTS > 0) {
        result[MAX_X_AXIS_POINTS - 1] = sourceRecords[sourceRecords.length - 1];
      } else if (result.length < MAX_X_AXIS_POINTS) {
        result.push(sourceRecords[sourceRecords.length - 1]);
      }
    }
    return result.slice(0, MAX_X_AXIS_POINTS);
  }, [sensorData]);

  const chartLabels = chartDataPoints.map((d) => new Date(d.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));

  const chartOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { left: 20, right: 15, top: 10, bottom: 10 } },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: isDarkMode ? '#A5B4FC' : '#475569', font: { size: 12 } } 
      },
      y: { 
        grid: { color: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', drawBorder: false }, 
        ticks: { color: isDarkMode ? '#A5B4FC' : '#475569', font: { size: 12 }, padding: 10 }, 
        suggestedMin: 0 
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)', 
        titleColor: isDarkMode ? '#E2E8F0' : '#1E293B', 
        bodyColor: isDarkMode ? '#CBD5E1' : '#334155', 
        borderColor: isDarkMode ? '#64748B' : '#D1D5DB', 
        borderWidth: 1, 
        padding: 12, 
        cornerRadius: 8, 
        usePointStyle: true 
      }
    },
    elements: { 
      line: { tension: 0.4, borderWidth: 3 }, 
      point: { radius: 0, hoverRadius: 6, hitRadius: 15 } 
    }
  }), [isDarkMode]);

  const phChartData = { 
    labels: chartLabels, 
    datasets: [{ 
      label: 'pH', 
      data: chartDataPoints.map((d) => d.ph), 
      borderColor: '#00BCD4', 
      backgroundColor: 'rgba(0,188,212,0.2)', 
      fill: true, 
      pointBackgroundColor: '#00BCD4', 
      pointBorderColor: isDarkMode ? '#1E293B' : '#FFFFFF', 
      pointHoverBackgroundColor: '#00BCD4', 
      pointHoverBorderColor: isDarkMode ? '#0F172A' : '#FFFFFF', 
    }] 
  };
  const turbidityChartData = { 
    labels: chartLabels, 
    datasets: [{ 
      label: 'Turbidity', 
      data: chartDataPoints.map((d) => d.turbidity), 
      borderColor: '#00BCD4', 
      backgroundColor: 'rgba(0,188,212,0.2)', 
      fill: true, 
      pointBackgroundColor: '#00BCD4', 
      pointBorderColor: isDarkMode ? '#1E293B' : '#FFFFFF',  
      pointHoverBackgroundColor: '#00BCD4', 
      pointHoverBorderColor: isDarkMode ? '#0F172A' : '#FFFFFF', 
    }] 
  }; 
  const tdsChartData = { 
    labels: chartLabels, 
    datasets: [{ 
      label: 'TDS', 
      data: chartDataPoints.map((d) => d.tds), 
      borderColor: '#00BCD4', 
      backgroundColor: 'rgba(0,188,212,0.2)', 
      fill: true, 
      pointBackgroundColor: '#00BCD4', 
      pointBorderColor: isDarkMode ? '#1E293B' : '#FFFFFF', 
      pointHoverBackgroundColor: '#00BCD4', 
      pointHoverBorderColor: isDarkMode ? '#0F172A' : '#FFFFFF', 
    }] 
  };

  const getPhAlertStyle = (ph) => { 
    const base = `rounded-xl shadow-lg p-5 flex items-center transition-all duration-300 hover:shadow-xl`; 
    if (ph === null || ph === undefined) return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`; 
    if (ph < 6.5 || ph > 8.5) return `${base} ${isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-800'}`; 
    return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`; 
  };
  const getTurbidityAlertStyle = (turbidity) => { 
    const base = `rounded-xl shadow-lg p-5 flex items-center transition-all duration-300 hover:shadow-xl`; 
    if (turbidity === null || turbidity === undefined) return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`; 
    if (turbidity > 2.5) return `${base} ${isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-800'}`; 
    return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`; 
  };
  const getTdsAlertStyle = (tds) => { 
    const base = `rounded-xl shadow-lg p-5 flex items-center transition-all duration-300 hover:shadow-xl`; 
    if (tds === null || tds === undefined) return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`; 
    if (tds > 350 || tds < 150) return `${base} ${isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-800'}`; 
    return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`; 
  };

  const phIconColor = latestData.ph !== null ? (latestData.ph < 6.5 || latestData.ph > 8.5 ? 'text-red-500' : 'text-teal-500') : 'text-slate-500';
  const turbidityIconColor = latestData.turbidity !== null ? (latestData.turbidity > 5 ? 'text-yellow-500' : 'text-teal-500') : 'text-slate-500';
  const tdsIconColor = latestData.tds !== null ? (latestData.tds < 500 || latestData.tds > 2000 ? 'text-red-500' : 'text-teal-500') : 'text-slate-500';

  const mapCenter = [
    latestData?.latitude && !isNaN(latestData.latitude) ? latestData.latitude : 22.3511,
    latestData?.longitude && !isNaN(latestData.longitude) ? latestData.longitude : 78.6677,
  ];

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-[calc(100vh-10rem)] bg-gradient-to-br ${isDarkMode ? 'from-slate-900 to-slate-800' : 'from-gray-100 to-white'}`}>
        <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-teal-500'></div>
        <span className={`ml-4 text-xl font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className='mb-8'>
        <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Welcome, {pageUsername}</h1>
        <p className={`mt-2 text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Your water quality monitoring dashboard
        </p>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          Last updated: {formatTimestamp(latestData.timestamp)}
        </p>
      </div>

      <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Current Sensor Readings</h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10'>
        <div className={getPhAlertStyle(latestData.ph)}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-5 shrink-0 ${ latestData.ph !== null ? (latestData.ph < 6.5 || latestData.ph > 8.5 ? (isDarkMode ? 'bg-red-500/20' : 'bg-red-100') : (isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100')) : (isDarkMode ? 'bg-slate-600' : 'bg-slate-200')}`}>
            <FaVial className={`text-3xl ${phIconColor}`} />
          </div>
          <div>
            <h3 className='text-base font-semibold text-slate-600 dark:text-slate-300'>pH Level</h3>
            <p className='text-3xl font-bold'>{latestData.ph !== null ? latestData.ph.toFixed(2) : 'N/A'}</p>
            <p className='text-sm text-slate-400 dark:text-slate-500'>Normal range: 6.5 - 8.5</p>
          </div>
        </div>
        <div className={getTurbidityAlertStyle(latestData.turbidity)}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-5 shrink-0 ${ latestData.turbidity !== null ? (latestData.turbidity > 5 ? (isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100') : (isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100')) : (isDarkMode ? 'bg-slate-600' : 'bg-slate-200')}`}>
            <FaSmog className={`text-3xl ${turbidityIconColor}`} />
          </div>
          <div>
            <h3 className='text-base font-semibold text-slate-600 dark:text-slate-300'>Turbidity</h3>
            <p className='text-3xl font-bold'>
              {latestData.turbidity !== null ? latestData.turbidity.toFixed(2) : 'N/A'} <span className='text-base'>NTU</span>
            </p>
            <p className='text-sm text-slate-400 dark:text-slate-500'>Normal range: 1 - 5 NTU</p>
          </div>
        </div>
        <div className={getTdsAlertStyle(latestData.tds)}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-5 shrink-0 ${ latestData.tds !== null ? (latestData.tds < 500 || latestData.tds > 2000 ? (isDarkMode ? 'bg-red-500/20' : 'bg-red-100') : (isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100')) : (isDarkMode ? 'bg-slate-600' : 'bg-slate-200')}`}>
            <FaTint className={`text-3xl ${tdsIconColor}`} />
          </div>
          <div>
            <h3 className='text-base font-semibold text-slate-600 dark:text-slate-300'>Total Dissolved Solids</h3>
            <p className='text-3xl font-bold'>
              {latestData.tds !== null ? latestData.tds.toFixed(2) : 'N/A'} <span className='text-base'>MG/L</span>
            </p>
            <p className='text-sm text-slate-400 dark:text-slate-500'>Normal range: 500 - 2000 MG/L</p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          {[
            { title: 'pH Levels - Last 24 Hours', data: phChartData },
            { title: 'Turbidity - Last 24 Hours', data: turbidityChartData },
            { title: 'Total Dissolved Solids (TDS) - Last 24 Hours', data: tdsChartData },
          ].map((chart) => (
            <div key={chart.title} className={`p-5 sm:p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>{chart.title}</h3>
              {chartDataPoints.length > 0 ? (
                <div className='h-72'>
                  <Line data={chart.data} options={chartOptions} />
                </div>
              ) : (
                <div className={`h-72 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                  <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Not enough data to display chart.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={`relative z-0 p-5 sm:p-6 rounded-xl shadow-lg flex flex-col transition-all duration-300 hover:shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <h3 className='text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3'>Sensor Location</h3>
          {latestData.latitude && latestData.longitude && (
            <p className='text-sm text-slate-500 dark:text-slate-400 mb-3'>
              {latestData.latitude.toFixed(4)}, {latestData.longitude.toFixed(4)}
            </p>
          )}
          <div className={`flex-grow rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} min-h-[300px]`}>
            {latestData.latitude && latestData.longitude && !isNaN(latestData.latitude) && !isNaN(latestData.longitude) ? (
              <MapContainer
                center={mapCenter}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                key={`${mapCenter[0]}-${mapCenter[1]}-${isDarkMode}`}
              >
                <TileLayer
                  url={isDarkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                  attribution={isDarkMode ? '© OpenStreetMap contributors © CARTO' : '© OpenStreetMap contributors'}
                />
                <Marker position={[latestData.latitude, latestData.longitude]}><Popup>Sensor Location</Popup></Marker>
                <InvalidateMapSize />
              </MapContainer>
            ) : (
              <div className='h-full flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700'>
                <p className='text-base text-slate-500 dark:text-slate-400'>Location data not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomePage;