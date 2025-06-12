import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Navbar from './Dnavbar';
import bg from '../../../assets/images/bg9.png';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import Loader from './Loader';

// Lazy load only the Line chart
const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));

// Error boundary fallback
const ErrorFallback = ({ error }) => (
  <div className="text-red-500 p-4 text-center">
    <p>Error loading component: {error.message}</p>
    <p>Please try refreshing the page or contact support.</p>
  </div>
);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const socket = io(`${import.meta.env.VITE_API_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const DeviceDetailsPage = () => {
  const { deviceId: paramDeviceId } = useParams();
  const { state } = useLocation();
  const rawDeviceId = paramDeviceId || state?.deviceId;
  const deviceId = rawDeviceId?.startsWith('user-') ? rawDeviceId.replace('user-', '') : rawDeviceId;
  const navigate = useNavigate();

  const [deviceData, setDeviceData] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parameter, setParameter] = useState('ph');
  const [sortOption, setSortOption] = useState('newest');

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!deviceId) {
        setError('Device ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');

        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          throw new Error('Session expired. Please log in again.');
        }

        const deviceResponse = await axios.get(`${API_BASE_URL}/admin/devices`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const device = deviceResponse.data.find((d) => d.deviceId === deviceId);
        if (!device || !device.userId) {
          throw new Error(`Device not found or has no associated user for deviceId: ${deviceId}`);
        }

        const userId = device.userId;
        const sensorResponse = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { _t: Date.now() },
        });

        const alarmsResponse = await axios.get(`${API_BASE_URL}/admin/alerts/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setDeviceData({
          deviceId: device.deviceId,
          name: device.name,
          userId: device.userId,
          location: device.location?.coordinates || [],
          username: sensorResponse.data.username,
          sensorData: sensorResponse.data.sensorData || [],
        });
        setSensorData(sensorResponse.data.sensorData || []);
        setAlarms(alarmsResponse.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching device data:', err);
        const errorMsg =
          err.response?.status === 404
            ? 'Device or user not found.'
            : err.message || 'Failed to load device data.';
        setError(errorMsg);
        toast.error(errorMsg, { theme: 'dark' });
        if (err.response?.status === 401 || err.message.includes('expired')) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();

    socket.on('sensorDataUpdate', (data) => {
      if (data.deviceId === deviceId && data.userId) {
        setSensorData((prev) => {
          const newData = [
            {
              ph: data.ph != null ? data.ph : null,
              turbidity: data.turbidity != null ? data.turbidity : null,
              tds: data.tds != null ? data.tds : null,
              latitude: data.latitude != null ? data.latitude : null,
              longitude: data.longitude != null ? data.longitude : null,
              temperature: data.temperature != null ? data.temperature : null,
              battery: data.battery != null ? data.battery : null,
              timestamp: data.timestamp || new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 50);
          return newData;
        });
      }
    });

    return () => {
      socket.off('sensorDataUpdate');
    };
  }, [deviceId, navigate]);

  const getLocation = () => {
    if (!deviceData || !deviceData.location || !deviceData.location.length) {
      if (sensorData?.length > 0) {
        const latest = sensorData[0];
        if (latest.latitude != null && latest.longitude != null && !isNaN(latest.latitude) && !isNaN(latest.longitude)) {
          return { latitude: latest.latitude, longitude: latest.longitude };
        }
      }
      return { latitude: null, longitude: null };
    }

    const [longitude, latitude] = deviceData.location;
    if (!isNaN(latitude) && !isNaN(longitude)) {
      return { latitude, longitude };
    }

    return { latitude: null, longitude: null };
  };

  const { latitude, longitude } = getLocation();

  const getSortedData = () => {
    let data = sensorData || [];

    data = data.filter((item) => {
      const timestamp = new Date(item.timestamp);
      if (isNaN(timestamp.getTime())) {
        console.warn('Invalid timestamp found:', item.timestamp);
        return false;
      }
      return item[parameter] != null && !isNaN(item[parameter]);
    });

    switch (sortOption) {
      case 'newest':
        return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
      case 'oldest':
        return data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(0, 8);
      case 'highest':
        return data.sort((a, b) => b[parameter] - a[parameter]).slice(0, 8);
      case 'lowest':
        return data.sort((a, b) => a[parameter] - b[parameter]).slice(0, 8);
      default:
        return data.slice(0, 8);
    }
  };

  const sortedData = getSortedData();

  const chartData = {
    labels: sortedData.map((data) =>
      new Date(data.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    ),
    datasets: [
      {
        label: parameter.toUpperCase(),
        data: sortedData.map((data) => data[parameter] || 0),
        borderColor: '#00BCD4',
        backgroundColor: 'rgba(0,188,212,0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: true, text: 'Timestamp', color: '#ffffff' },
      },
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: true, text: parameter.toUpperCase(), color: '#ffffff' },
      },
    },
    plugins: { legend: { labels: { color: '#ffffff' } } },
  };

  const getTableData = () => {
    if (!sensorData.length || !deviceData) return [];
    const latest = sensorData[0];
    const timestamp = new Date(latest.timestamp);
    const isActive = timestamp.getTime() > Date.now() - 5 * 60 * 1000;
    return [
      {
        deviceName: deviceData.name || deviceId,
        status: isActive ? 'Active' : 'Offline',
        ph: latest.ph != null ? latest.ph.toFixed(2) : 'N/A',
        turbidity: latest.turbidity != null ? latest.turbidity.toFixed(2) : 'N/A',
        tds: latest.tds != null ? latest.tds.toFixed(0) : 'N/A',
        timestamp: timestamp.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      },
    ];
  };

  const tableData = getTableData();

  const position = [latitude || 22.3511, longitude || 78.6677];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-red-500">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-cyan-500 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center pt-20"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">
          Device Details: {deviceData?.name || deviceId}
        </h1>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <div className="bg-black/70 backdrop-blur-md p-6 rounded-lg shadow-lg">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/80 p-4 rounded-lg border border-cyan-500/20 flex items-start gap-4 pt-15 shadow-md">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white mb-1">{deviceData?.name || 'Device'}</div>
                  <div className="text-xs text-white/60 mb-1">
                    Last Active: {sensorData?.length ? new Date(sensorData[0].timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Unknown'}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded font-semibold ${
                      sensorData?.length && new Date(sensorData[0].timestamp).getTime() > Date.now() - 5 * 60 * 1000
                        ? 'bg-green-700 text-green-200'
                        : 'bg-red-700 text-red-200'
                    }`}
                  >
                    {sensorData?.length && new Date(sensorData[0].timestamp).getTime() > Date.now() - 5 * 60 * 1000 ? 'Active' : 'Offline'}
                  </span>
                  <div className="mt-3">
                    <button
                      className="px-3 py-1 text-xs font-semibold rounded transition-all bg-cyan-500 text-white hover:bg-cyan-600"
                      onClick={() => navigate(`/admin/device-detail/${deviceId}/health`)}
                    >
                      IoT Device Status
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 p-4 rounded-lg border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Alarms
                </h3>
                {alarms.length > 0 ? (
                  <ul className="space-y-3">
                    {alarms.map((alarm, index) => {
                      let severity = 'info';
                      if (/critical|fail|high/i.test(alarm.message)) severity = 'danger';
                      else if (/warn|low/i.test(alarm.message)) severity = 'warning';

                      let bgColor = 'bg-blue-900 border-blue-400';
                      let textColor = 'text-blue-300';
                      let icon = (
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4m0-4h.01" />
                        </svg>
                      );
                      if (severity === 'danger') {
                        bgColor = 'bg-red-900 border-red-500';
                        textColor = 'text-red-300';
                        icon = (
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                      } else if (severity === 'warning') {
                        bgColor = 'bg-yellow-900 border-yellow-500';
                        textColor = 'text-yellow-300';
                        icon = (
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                      }

                      return (
                        <li key={index} className={`flex items-start gap-3 px-3 py-2 rounded-lg border-l-4 ${bgColor}`}>
                          {icon}
                          <div className="flex-1">
                            <span className={`block font-semibold ${textColor}`}>{alarm.message}</span>
                            <span className="block text-xs text-white/60">
                              {new Date(alarm.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-white/60">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    No recent alerts.
                  </div>
                )}
                {alarms.length > 3 && (
                  <button
                    className="mt-3 px-3 py-1 text-xs font-semibold text-cyan-400 bg-cyan-900/70 rounded hover:bg-cyan-800 transition"
                    onClick={() => navigate('/alerts')}
                  >
                    See all alerts
                  </button>
                )}
              </div>

              <div className="bg-black/80 p-4 rounded-lg border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">Device Location</h3>
                {latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude) ? (
                  <div className="h-48 rounded-lg overflow-hidden">
                    <MapContainer
                      center={position}
                      zoom={14}
                      style={{ height: '100%', width: '100%' }}
                      className="z-10"
                      key={`map-${deviceId}`} // Ensure unique map instance
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={position}>
                        <Popup open={true} autoClose={false} closeOnClick={false} closeButton={false} className="font-mono text-xs">
                          <strong>{deviceData?.name || deviceId}</strong><br />
                          Latitude: {latitude != null ? parseFloat(latitude).toFixed(6) : 'N/A'}<br />
                          Longitude: {longitude != null ? parseFloat(longitude).toFixed(6) : 'N/A'}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <p className="text-white/70 text-sm">Location data not available.</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Real-Time Sensor Data</h2>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse bg-black/70 rounded-lg">
                  <thead>
                    <tr className="bg-black/90">
                      <th className="px-4 py-2 text-left text-white font-medium border-b border-cyan-500/20">Device Name</th>
                      <th className="px-4 py-2 text-left text-white font-medium border-b border-cyan-500/20">Status</th>
                      <th className="px-4 py-2 text-left text-white font-medium border-b border-cyan-500/20">pH</th>
                      <th className="px-4 py-2 text-left text-white font-medium border-b border-cyan-500/20">Turbidity</th>
                      <th className="px-4 py-2 text-left text-white font-medium border-b border-cyan-500/20">TDS</th>
                      <th className="px-4 py-2 text-left text-white font-medium border-b border-cyan-500/20">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length > 0 ? (
                      tableData.map((row, index) => (
                        <tr key={index} className="hover:bg-black/80 transition-colors">
                          <td className="px-4 py-2 text-white border-b border-cyan-500/20">{row.deviceName}</td>
                          <td className="px-4 py-2 border-b border-cyan-500/20">
                            <span className={`text-sm font-medium ${row.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-white border-b border-cyan-500/20">{row.ph}</td>
                          <td className="px-4 py-2 text-white border-b border-cyan-500/20">{row.turbidity}</td>
                          <td className="px-4 py-2 text-white border-b border-cyan-500/20">{row.tds}</td>
                          <td className="px-4 py-2 text-white border-b border-cyan-500/20">{row.timestamp}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-2 text-center text-white/70">
                          No sensor data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Suspense fallback={<Loader />}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Analytics</h2>
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-1">Select Parameter:</label>
                    <select
                      value={parameter}
                      onChange={(e) => setParameter(e.target.value)}
                      className="w-full p-2 border rounded bg-black text-white border-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="ph" className="bg-black">pH</option>
                      <option value="turbidity" className="bg-black">Turbidity</option>
                      <option value="tds" className="bg-black">TDS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-1">Sort by:</label>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="w-full p-2 border rounded bg-black text-white border-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <option value="newest" className="bg-black">Newest First</option>
                      <option value="oldest" className="bg-black">Oldest First</option>
                      <option value="highest" className="bg-black">Highest {parameter.toUpperCase()}</option>
                      <option value="lowest" className="bg-black">Lowest {parameter.toUpperCase()}</option>
                    </select>
                  </div>
                </div>
                <div className="relative h-64 sm:h-96">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </Suspense>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default DeviceDetailsPage;