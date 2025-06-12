import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaDownload, FaCalendarAlt } from 'react-icons/fa';
import Papa from 'papaparse';

const Analytics = () => {
  const { isDarkMode, formatTimestampToIST, accessId } = useOutletContext();
  const [sensorData, setSensorData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchSensorData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/sensor/data`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit: 50,
            sort: 'desc',
          },
        });
        const { data, pagination } = response.data;
        setSensorData((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotalRecords(pagination.totalRecords);
        setHasMore(pagination.page < pagination.totalPages);
      } catch (err) {
        console.error('Failed to fetch sensor data:', err.response?.status, err.response?.data || err.message);
        setSensorData([]);
        toast.error('Failed to load sensor data.', { theme: isDarkMode ? 'dark' : 'light' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSensorData();
  }, [page, isDarkMode]);

  const downloadCSV = (filtered = false) => {
    try {
      let dataToExport = sensorData;
      if (filtered && (startDate || endDate)) {
        dataToExport = sensorData.filter((record) => {
          const recordDate = new Date(record.timestamp);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          return recordDate >= start && recordDate <= end;
        });
      }

      if (dataToExport.length === 0) {
        toast.warn('No data available for download.', { theme: isDarkMode ? 'dark' : 'light' });
        return;
      }

      const csvData = dataToExport.map((record) => ({
        deviceId: record.deviceId,
        ph: record.ph != null ? record.ph.toFixed(2) : 'N/A',
        turbidity: record.turbidity != null ? record.turbidity.toFixed(2) : 'N/A',
        tds: record.tds != null ? record.tds.toFixed(2) : 'N/A',
        temperature: record.temperature != null ? record.temperature.toFixed(2) : 'N/A',
        battery: record.battery != null ? record.battery.toFixed(2) : 'N/A',
        capacity: record.capacity != null ? record.capacity.toFixed(2) : 'N/A',
        latitude: record.latitude != null ? record.latitude.toFixed(6) : 'N/A',
        longitude: record.longitude != null ? record.longitude.toFixed(6) : 'N/A',
        timestamp: formatTimestampToIST(record.timestamp),
      }));

      const csv = Papa.unparse(csvData, {
        columns: ['deviceId', 'ph', 'turbidity', 'tds', 'temperature', 'battery', 'capacity', 'latitude', 'longitude', 'timestamp'],
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sensor_data_${filtered ? 'filtered' : 'all'}_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      toast.error('Failed to download CSV.', { theme: isDarkMode ? 'dark' : 'light' });
    }
  };

  const handleDateChange = (e, type) => {
    const value = e.target.value;
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const filteredData = useMemo(() => {
    let data = sensorData;
    if (startDate || endDate) {
      data = sensorData.filter((record) => {
        const recordDate = new Date(record.timestamp);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        return recordDate >= start && recordDate <= end;
      });
    }
    return data.map((record) => ({
      ...record,
      timestamp: formatTimestampToIST(record.timestamp),
    }));
  }, [sensorData, startDate, endDate, formatTimestampToIST]);

  return (
    <div
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}
    >
      <ToastContainer
        newestOnTop
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 mt-20 gap-4">
        <div>
          <h1
            className={`text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-slate-100' : 'text-sky-900'
            } animate-fade-in`}
          >
            Sensor Data Analytics
          </h1>
          <p
            className={`text-base mb-1 ${
              isDarkMode ? 'text-slate-300' : 'text-sky-600'
            } animate-fade-in`}
          >
            View and download all sensor data records.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-sky-600" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e, 'start')}
              className={`rounded px-3 py-1 border outline-none shadow-sm transition ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white border-sky-300 text-sky-800'
              }`}
              title="Start date for filtering"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-sky-600" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange(e, 'end')}
              className={`rounded px-3 py-1 border outline-none shadow-sm transition ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white border-sky-300 text-sky-800'
              }`}
              title="End date for filtering"
            />
          </div>
          <button
            onClick={() => downloadCSV(false)}
            className={`flex items-center gap-1 rounded px-3 py-1 border shadow-sm transition font-semibold ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-sky-300 text-sky-800 hover:bg-sky-100'
            }`}
            title="Download all fetched data as CSV"
          >
            <FaDownload /> All Data
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => downloadCSV(true)}
              className={`flex items-center gap-1 rounded px-3 py-1 border shadow-sm transition font-semibold ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-sky-300 text-sky-800 hover:bg-sky-100'
              }`}
              title="Download filtered data as CSV"
            >
              <FaDownload /> Filtered Data
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {isLoading && page === 1 ? (
          <div className="flex justify-center items-center py-8">
            <div
              className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${
                isDarkMode ? 'border-slate-300' : 'border-sky-600'
              }`}
            ></div>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className={`w-full border-collapse ${
                isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-sky-800'
              }`}
            >
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="p-3 text-left text-sm font-semibold">Device ID</th>
                  <th className="p-3 text-left text-sm font-semibold">pH</th>
                  <th className="p-3 text-left text-sm font-semibold">Turbidity (NTU)</th>
                  <th className="p-3 text-left text-sm font-semibold">TDS (ppm)</th>
                  <th className="p-3 text-left text-sm font-semibold">Temperature (°C)</th>
                  <th className="p-3 text-left text-sm font-semibold">Battery (V)</th>
                  <th className="p-3 text-left text-sm font-semibold">Capacity (%)</th>
                  <th className="p-3 text-left text-sm font-semibold">Latitude</th>
                  <th className="p-3 text-left text-sm font-semibold">Longitude</th>
                  <th className="p-3 text-left text-sm font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((record, index) => (
                  <tr
                    key={record._id || index}
                    className={`border-b border-slate-200 hover:${
                      isDarkMode ? 'bg-slate-700' : 'bg-sky-50'
                    } transition-colors`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td className="p-3 text-sm">{record.deviceId}</td>
                    <td className="p-3 text-sm">{record.ph != null ? record.ph.toFixed(2) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.turbidity != null ? record.turbidity.toFixed(2) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.tds != null ? record.tds.toFixed(2) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.temperature != null ? record.temperature.toFixed(2) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.battery != null ? record.battery.toFixed(2) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.capacity != null ? record.capacity.toFixed(2) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.latitude != null ? record.latitude.toFixed(6) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.longitude != null ? record.longitude.toFixed(6) : 'N/A'}</td>
                    <td className="p-3 text-sm">{record.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
            <p className={`text-sm mt-4 ${isDarkMode ? 'text-slate-300' : 'text-sky-600'}`}>
              Showing {filteredData.length} of {totalRecords} records
            </p>
          </div>
        ) : (
          <div
            className={`rounded-xl shadow-lg p-6 text-center ${
              isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-sky-600'
            } animate-fade-in`}
          >
            <p className="text-base font-medium">No sensor data available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;