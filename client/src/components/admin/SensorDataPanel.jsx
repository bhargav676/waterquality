import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconWrapper, PhIcon, TurbidityIcon, TdsIcon, ClockIcon, CloseIcon } from './Icons';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios';
import { toast } from 'react-toastify'; 

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const SensorDataItem = ({ icon, label, value, valueColor, bgColor, onClick }) => (
  <div
    className={`flex items-center p-3.5 rounded-md shadow-md ${bgColor} cursor-pointer hover:bg-black/70`}
    onClick={onClick} 
  >
    <IconWrapper colorClass={valueColor} bgColorClass="bg-black/50 rounded-full" p={3}>
      {icon}
    </IconWrapper>
    <div className="ml-3">
      <p className="text-sm font-medium text-white/80">{label}</p>
      <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
    </div>
  </div>
);

const SensorDataPanel = ({ device, isLoading, onClose, getStatusInfo }) => {
  const [latestSensorData, setLatestSensorData] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('ph');
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const fetchSensorData = async () => {
      if (!device || !device.userId) {
        setHistoryError('Device or user ID is missing.');
        setIsHistoryLoading(false);
        return;
      }

      setIsHistoryLoading(true);
      setHistoryError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in.');

        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          throw new Error('Session expired. Please log in again.');
        }

        const sensorResponse = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${device.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { _t: Date.now() },
        });

        
        let sensorData = [];
        if (Array.isArray(sensorResponse.data)) {
          sensorData = sensorResponse.data;
        } else if (sensorResponse.data && Array.isArray(sensorResponse.data.sensorData)){
          sensorData = sensorResponse.data.sensorData;
        } else if (sensorResponse.data && sensorResponse.data.message) {
          throw new Error(sensorResponse.data.message);
        } else {
          console.warn('Unexpected sensor data format:', sensorResponse.data);
        }

        const sortedData = sensorData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLatestSensorData(sortedData[0] || null);
        setSensorHistory(sortedData);

        if (device.lastActive) {
          const lastActiveTime = new Date(device.lastActive);
          const now = new Date();
          const timeDiff = (now - lastActiveTime) / 1000 / 60; 
          setIsOnline(timeDiff <= 5);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
        const errorMsg =
          error.response?.status === 400
            ? error.response.data.message || 'Invalid request.'
            : error.response?.status === 404
            ? 'Device or user not found.'
            : error.message || 'Unable to fetch sensor data. Please try again later.';
        setHistoryError(errorMsg);
        toast.error(errorMsg, { theme: 'dark' });
        if (error.response?.status === 401 || error.message.includes('expired')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchSensorData();
  }, [device]);

  const ranges = {
    ph: {
      safe: { min: 6.5, max: 8.5, label: 'Safe (6.5-8.5)' },
      warning: [{ min: 6.0, max: 6.5 }, { min: 8.5, max: 9.0 }],
      warningLabel: 'Warning (6.0-6.5 or 8.5-9.0)',
      alert: { min: 0, max: 6.0, min2: 9.0, max2: Infinity, label: 'Alert (<6.0 or >9.0)' },
    },
    turbidity: {
      safe: { min: 0, max: 5, label: 'Safe (<5 NTU)' },
      warning: [{ min: 5, max: 10 }],
      warningLabel: 'Warning (5-10 NTU)',
      alert: { min: 10, max: Infinity, label: 'Alert (>10 NTU)' },
    },
    tds: {
      safe: { min: 0, max: 500, label: 'Safe (500-2000 ppm)' },
      warning: [{ min: 500, max: 1000 }],
      warningLabel: 'Warning (2000-3000 ppm)',
      alert: { min: 1000, max: Infinity, label: 'Alert (>3000 ppm)' },
    },
  };

  const values = sensorHistory
    .map((data) => data[selectedMetric])
    .filter((val) => val !== null && val !== undefined && !isNaN(val));
  const metricRanges = ranges[selectedMetric];
  const counts = {
    safe: values.filter((val) => val >= metricRanges.safe.min && val <= metricRanges.safe.max).length,
    warning: values.filter((val) =>
      metricRanges.warning.some((range) => val >= range.min && val <= range.max)
    ).length,
    alert: values.filter((val) =>
      (val >= metricRanges.alert.min && val <= metricRanges.alert.max) ||
      (metricRanges.alert.min2 && val >= metricRanges.alert.min2 && val <= metricRanges.alert.max2)
    ).length,
  };

  const chartData = {
    labels: [metricRanges.safe.label, metricRanges.warningLabel, metricRanges.alert.label],
    datasets: [
      {
        data: [counts.safe, counts.warning, counts.alert].filter((val) => val > 0),
        backgroundColor: ['rgba(22, 163, 74, 0.8)', 'rgba(202, 138, 4, 0.8)', 'rgba(220, 38, 38, 0.8)'],
        borderColor: ['#000000', '#000000', '#000000'],
        borderWidth: 1,
        offset: [20, 20, 20],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: -45,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start',
        labels: {
          color: '#ffffff',
          font: { size: 12 },
          padding: 10,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: false,
          generateLabels: (chart) => {
            const data = chart.data;
            return data.labels.map((label, i) => ({
              text: `${label}`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: data.datasets[0].borderColor[i],
              lineWidth: data.datasets[0].borderWidth,
              hidden: !chart.getDataVisibility(i),
              index: i,
              fontColor: '#ffffff',
            }));
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw} readings`,
        },
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: '600', size: 12 },
        anchor: 'end',
        align: 'end',
        offset: 10,
        formatter: (value, context) => context.chart.data.labels[context.dataIndex],
      },
    },
    elements: {
      arc: {
        borderWidth: 1,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
  };

  return (
    <motion.aside
      className="w-80 bg-[#000000CC] border-l mt-[90px] mr-5 border-white/20 flex flex-col fixed inset-y-0 right-0 z-20 backdrop-blur-sm"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <style>
        {`
          .chart-container {
            perspective: 1000px;
            transform: rotateX(-15deg);
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          .chart-legend span, .chart-legend div {
            color: #ffffff !important;
          }
        `}
      </style>
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-white truncate">{device?.name || 'Device'}</h2>
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm text-white/80">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/70 rounded-full hover:text-white hover:bg-red-800/50"
          aria-label="Close panel"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-white/70 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {isHistoryLoading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-4 border-white/70 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!isLoading && !isHistoryLoading && historyError && (
          <p className="text-center text-sm text-red-400 py-6">{historyError}</p>
        )}
        {!isLoading && !isHistoryLoading && !historyError && latestSensorData && (
          <>
            <SensorDataItem
              icon={<PhIcon />}
              label="pH Level"
              value={getStatusInfo(latestSensorData.ph, 'ph').text}
              valueColor={getStatusInfo(latestSensorData.ph, 'ph').color}
              bgColor="bg-black/50"
              onClick={() => setSelectedMetric('ph')}
            />
            <SensorDataItem
              icon={<TurbidityIcon />}
              label="Turbidity"
              value={getStatusInfo(latestSensorData.turbidity, 'turbidity').text}
              valueColor={getStatusInfo(latestSensorData.turbidity, 'turbidity').color}
              bgColor="bg-black/50"
              onClick={() => setSelectedMetric('turbidity')}
            />
            <SensorDataItem
              icon={<TdsIcon />}
              label="TDS"
              value={getStatusInfo(latestSensorData.tds, 'tds').text}
              valueColor={getStatusInfo(latestSensorData.tds, 'tds').color}
              bgColor="bg-black/50"
              onClick={() => setSelectedMetric('tds')}
            />
            <div className="flex items-center p-3.5 rounded-md shadow-md bg-black/50">
              <IconWrapper colorClass="text-white/80" bgColorClass="bg-black/50 rounded-full" p={3}>
                <ClockIcon />
              </IconWrapper>
              <div className="ml-3">
                <p className="text-sm font-medium text-white/80">Last Updated</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(latestSensorData.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </>
        )}
        {!isLoading && !isHistoryLoading && !historyError && !latestSensorData && (
          <p className="text-center text-sm text-white/70 py-6">No sensor data available for this device.</p>
        )}
        <div className="p-3.5 rounded-md shadow-md bg-black/50">
          <h3 className="text-sm font-medium text-white/80 mb-2">{selectedMetric.toUpperCase()} Value Distribution</h3>
          <br />
          {isHistoryLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-4 border-white/70 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : historyError ? (
            <p className="text-center text-sm text-red-400 py-4">{historyError}</p>
          ) : sensorHistory.length > 0 && chartData.datasets[0].data.length > 0 ? (
            <div className="h-48 chart-container">
              <Doughnut data={chartData} options={chartOptions} />
              <br />
            </div>
          ) : (
            <p className="text-center text-sm text-white/70 py-4">
              No {selectedMetric.toUpperCase()} history data available.
            </p>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default React.memo(SensorDataPanel);