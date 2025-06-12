import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Dnavbar';
import bg from '../../../assets/images/bg9.png';
import { toast } from 'react-toastify';
import Loader from './Loader'; // Import the Loader component

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const Records = () => {
  const { deviceId: paramDeviceId } = useParams();
  const { state } = useLocation();
  const rawDeviceId = paramDeviceId || state?.deviceId;
  const deviceId = rawDeviceId?.startsWith('user-') ? rawDeviceId.replace('user-', '') : rawDeviceId;
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [parameter, setParameter] = useState('ph');
  const [page, setPage] = useState(1);
  const recordsPerPage = 15;

  useEffect(() => {
    const fetchRecords = async () => {
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
        const response = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { _t: Date.now() },
        });
        setRecords(response.data.sensorData || []);
        setFilteredRecords(response.data.sensorData || []);
      } catch (err) {
        console.error('Error fetching records:', err);
        const errorMsg =
          err.response?.status === 404
            ? 'Device or user not found.'
            : err.message || 'Failed to load records.';
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
    fetchRecords();
  }, [deviceId, navigate]);

  useEffect(() => {
    const filtered = records.filter((record) => {
      const value = record[parameter]?.toString().toLowerCase() || '';
      const timestamp = new Date(record.timestamp).toLocaleString().toLowerCase();
      return value.includes(search.toLowerCase()) || timestamp.includes(search.toLowerCase());
    });
    setFilteredRecords(filtered);
    setPage(1);
  }, [search, parameter, records]);

  const paginatedRecords = filteredRecords.slice((page - 1) * recordsPerPage, page * recordsPerPage);

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
            className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-300 disabled:bg-gray-400 transition-colors"
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
        <h1 className="text-2xl font-semibold text-white mb-6">Sensor Data Records for {deviceId}</h1>
        <div className="bg-black/70 backdrop-blur-md p-6 rounded-lg shadow-lg">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-white font-medium mb-1">Search:</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by value or timestamp..."
                className="w-full p-2 border rounded bg-black text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-1">Filter by Parameter:</label>
              <select
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                className="w-full p-2 border rounded bg-black text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="ph" className="bg-black">pH</option>
                <option value="turbidity" className="bg-black">Turbidity</option>
                <option value="tds" className="bg-black">TDS</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-3 text-center text-white/70">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((data, index) => (
                    <tr key={index} className="border-b border-gray-600 hover:bg-gray-700">
                      <td className="p-3 text-white">{new Date(data.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-white">{data.ph ? data.ph.toFixed(1) : 'N/A'}</td>
                      <td className="p-3 text-white">
                        {data.turbidity ? data.turbidity.toFixed(1) : 'N/A'}
                      </td>
                      <td className="p-3 text-white">{data.tds ?? 'N/A'}</td>
                      <td className="p-3 text-white">
                        {data.latitude && data.longitude
                          ? `[${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}]`
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-300 disabled:bg-gray-400 transition-colors"
            >
              Previous
            </button>
            <span className="text-white">
              Page {page} of {Math.ceil(filteredRecords.length / recordsPerPage) || 1}
            </span>
            <button
              onClick={() => setPage((prev) => (filteredRecords.length > page * recordsPerPage ? prev + 1 : prev))}
              disabled={filteredRecords.length <= page * recordsPerPage}
              className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-300 disabled:bg-gray-400 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Records;