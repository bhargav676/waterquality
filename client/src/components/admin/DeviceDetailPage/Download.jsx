import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { format } from 'date-fns';
import Navbar from './Dnavbar';
import bg from '../../../assets/images/bg9.png';
import { toast } from 'react-toastify';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const Download = () => {
  const { deviceId: paramDeviceId } = useParams();
  const { state } = useLocation();
  const rawDeviceId = paramDeviceId || state?.deviceId;
  const deviceId = rawDeviceId?.startsWith('user-') ? rawDeviceId.replace('user-', '') : rawDeviceId;
  const navigate = useNavigate();
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
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

        // Verify token expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          throw new Error('Session expired. Please log in again.');
        }

        // Fetch device to get userId
        const deviceResponse = await axios.get(`${API_BASE_URL}/admin/devices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const device = deviceResponse.data.find((d) => d.deviceId === deviceId);
        if (!device || !device.userId) {
          throw new Error(`Device not found or has no associated user for deviceId: ${deviceId}`);
        }

        // Fetch sensor data
        const userId = device.userId;
        const response = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { _t: Date.now() },
        });
        setDeviceData(response.data);
        setFilteredData(response.data.sensorData || []);
      } catch (err) {
        console.error('Error fetching device data:', err);
        const errorMsg =
          err.response?.status === 404
            ? 'Device or user not found.'
            : err.message || 'Failed to load data.';
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
  }, [deviceId, navigate]);

  const filterAndSortData = () => {
    if (!deviceData?.sensorData) return;
    let data = [...deviceData.sensorData];

    // Filter by date range (inclusive of end date)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire end date
      data = data.filter((item) => {
        const dataDate = new Date(item.timestamp);
        return dataDate >= start && dataDate <= end;
      });
    }

    // Sort data
    switch (sortOption) {
      case 'newest':
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'oldest':
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case 'highestPh':
        data.sort((a, b) => (b.ph || 0) - (a.ph || 0));
        break;
      case 'lowestPh':
        data.sort((a, b) => (a.ph || 0) - (b.ph || 0));
        break;
      case 'highestTurbidity':
        data.sort((a, b) => (b.turbidity || 0) - (a.turbidity || 0));
        break;
      case 'lowestTurbidity':
        data.sort((a, b) => (a.turbidity || 0) - (b.turbidity || 0));
        break;
      case 'highestTds':
        data.sort((a, b) => (b.tds || 0) - (a.tds || 0));
        break;
      case 'lowestTds':
        data.sort((a, b) => (a.turbidity || 0) - (b.turbidity || 0));
        break;
      default:
        break;
    }
    setFilteredData(data);
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSortOption('newest');
    setFilteredData(deviceData?.sensorData || []);
  };

  const csvData = filteredData.map((data) => ({
    Timestamp: new Date(data.timestamp).toLocaleString(),
    pH: data.ph ? data.ph.toFixed(1) : 'N/A',
    Turbidity: data.turbidity ? data.turbidity.toFixed(1) : 'N/A',
    TDS: data.tds ?? 'N/A',
    Latitude: data.latitude ? data.latitude.toFixed(4) : 'N/A',
    Longitude: data.longitude ? data.longitude.toFixed(4) : 'N/A',
  }));

  const allCsvData = (deviceData?.sensorData || []).map((data) => ({
    Timestamp: new Date(data.timestamp).toLocaleString(),
    pH: data.ph ? data.ph.toFixed(1) : 'N/A',
    Turbidity: data.turbidity ? data.turbidity.toFixed(1) : 'N/A',
    TDS: data.tds ?? 'N/A',
    Latitude: data.latitude ? data.latitude.toFixed(4) : 'N/A',
    Longitude: data.longitude ? data.longitude.toFixed(4) : 'N/A',
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading data...
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
        <h1 className="text-2xl font-semibold text-white mb-6">Download Sensor Data for {deviceId}</h1>
        <div className="bg-black/70 backdrop-blur-md p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-white font-medium mb-1">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded bg-black text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-1">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded bg-black text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-1">Sort By:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full p-2 border rounded bg-black text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestPh">Highest pH</option>
                <option value="lowestPh">Lowest pH</option>
                <option value="highestTurbidity">Highest Turbidity</option>
                <option value="lowestTurbidity">Lowest Turbidity</option>
                <option value="highestTds">Highest TDS</option>
                <option value="lowestTds">Lowest TDS</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={filterAndSortData}
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Filter & Sort
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
            <CSVLink
              data={csvData}
              filename={`device_data_${deviceId}_${format(new Date(), 'yyyyMMdd')}.csv`}
              className="px-4 py-2 bg-cyan-500  text-white rounded-md hover:bg-cyan-600 transition-colors"
            >
              Download Filtered CSV
            </CSVLink>
            <CSVLink
              data={allCsvData}
              filename={`device_data_${deviceId}_all_${format(new Date(), 'yyyyMMdd')}.csv`}
              className="px-4 py-2 ml-[525px] bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
            >
              Download All Data
            </CSVLink>
          </div>
          {filteredData.length === 0 && (
            <p className="text-yellow-300 mb-6">No records found for the selected date range.</p>
          )}
          {filteredData.length > 0 && (
            <>
              <p className="text-white mb-4">{filteredData.length} records ready for download.</p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-black">
                      <th className="p-3 text-left text-white font-medium">Timestamp</th>
                      <th className="p-3 text-left text-white font-medium">pH</th>
                      <th className="p-3 text-left text-white font-medium">Turbidity (NTU)</th>
                      <th className="p-3 text-left text-white font-medium">TDS (ppm)</th>
                      <th className="p-3 text-left text-white font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 5).map((data, index) => (
                      <tr key={index} className="border-b border-gray-600 hover:bg-gray-700">
                        <td className="p-3 text-white">{new Date(data.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-white">{data.ph ? data.ph.toFixed(1) : 'N/A'}</td>
                        <td className="p-3 text-white">{data.turbidity ? data.turbidity.toFixed(1) : 'N/A'}</td>
                        <td className="p-3 text-white">{data.tds ?? 'N/A'}</td>
                        <td className="p-3 text-white">
                          {data.latitude && data.longitude
                            ? `[${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}]`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-white text-sm">Showing up to 5 records for preview.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Download;