import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import Header from './Header';
import SensorCard from './SensorCard';
import SensorChart from './SensorChart';
import SensorMap from './SensorMap';

const socket = io(`${import.meta.env.VITE_API_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const MAX_X_AXIS_POINTS = 10;

const DashboardHomePage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const isDarkMode = outletContext?.isDarkMode ?? false;
  const formatTimestampContext = outletContext?.formatTimestampToIST;
  const pageUsername = outletContext?.username || 'User';
  const setSensorDataForLayoutCSV = outletContext?.setSensorDataForLayoutCSV;

  const formatTimestamp = formatTimestampContext || ((ts) => (ts ? new Date(ts).toLocaleString() : 'N/A'));

  const [sensorData, setSensorData] = useState([]);
  const [latestData, setLatestData] = useState({ ph: null, turbidity: null, tds: null, timestamp: null, latitude: null, longitude: null });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchSummaryData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/sensor/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const summaryData = response.data || [];
        setLatestData(summaryData[0] || { ph: null, turbidity: null, tds: null, timestamp: null, latitude: null, longitude: null });
        if (typeof setSensorDataForLayoutCSV === 'function') {
          setSensorDataForLayoutCSV(summaryData);
        }
      } catch (err) {
        console.error('Failed to fetch sensor summary:', err);
        toast.error('Failed to load sensor summary.', { theme: isDarkMode ? 'dark' : 'light' });
      }
    };

    const fetchPaginatedData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/sensor/data`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, limit: 24, sort: 'desc' },
        });
        const { data, pagination } = response.data;
        setSensorData(data);
        setHasMore(pagination.page < pagination.totalPages);
        if (typeof setSensorDataForLayoutCSV === 'function') {
          setSensorDataForLayoutCSV(data);
        }
      } catch (err) {
        console.error('Failed to fetch paginated sensor data:', err);
        toast.error('Failed to load sensor data.', { theme: isDarkMode ? 'dark' : 'light' });
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
    fetchPaginatedData();

    socket.on('connect', () => console.log('Socket connected on DashboardHomePage'));
    socket.on('disconnect', () => console.log('Socket disconnected on DashboardHomePage'));

    const handleNewSensorData = (data) => {
      try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;
        const decodedToken = JSON.parse(atob(currentToken.split('.')[1]));
        const userIdFromToken = decodedToken.userId || decodedToken.id;
        if (data.userId !== userIdFromToken) return;

        setLatestData(data);
        setSensorData((prevData) => {
          const newDataArray = [...prevData, data].slice(-24);
          if (typeof setSensorDataForLayoutCSV === 'function') {
            setSensorDataForLayoutCSV(newDataArray);
          }
          return newDataArray;
        });
      } catch (error) {
        console.error('Error processing new sensor data:', error);
      }
    };

    socket.on('sensorDataUpdate', handleNewSensorData);

    return () => {
      socket.off('sensorDataUpdate', handleNewSensorData);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [navigate, isDarkMode, setSensorDataForLayoutCSV, page]);

  const handleLoadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const chartDataPoints = useMemo(() => {
    return [...sensorData]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-MAX_X_AXIS_POINTS);
  }, [sensorData]);

  const chartLabels = chartDataPoints.map((d) => new Date(d.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { left: 20, right: 15, top: 10, bottom: 10 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 12 } } },
        y: {
          grid: { color: 'rgba(0,0,0,0.1)', drawBorder: false },
          ticks: { color: '#475569', font: { size: 12 }, padding: 10 },
          suggestedMin: 0,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.98)',
          titleColor: '#1E293B',
          bodyColor: '#334155',
          borderColor: '#D1D5DB',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          usePointStyle: true,
        },
      },
      elements: { line: { tension: 0.4, borderWidth: 3 }, point: { radius: 0, hoverRadius: 6, hitRadius: 15 } },
    }),
    []
  );

  const phChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'pH',
        data: chartDataPoints.map((d) => d.ph),
        borderColor: '#00BCD4',
        backgroundColor: 'rgba(0,188,212,0.2)',
        fill: true,
        pointBackgroundColor: '#00BCD4',
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#00BCD4',
        pointHoverBorderColor: '#FFFFFF',
      },
    ],
  };

  const turbidityChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Turbidity',
        data: chartDataPoints.map((d) => d.turbidity),
        borderColor: '#00BCD4',
        backgroundColor: 'rgba(0,188,212,0.2)',
        fill: true,
        pointBackgroundColor: '#00BCD4',
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#00BCD4',
        pointHoverBorderColor: '#FFFFFF',
      },
    ],
  };

  const tdsChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'TDS',
        data: chartDataPoints.map((d) => d.tds),
        borderColor: '#00BCD4',
        backgroundColor: 'rgba(0,188,212,0.2)',
        fill: true,
        pointBackgroundColor: '#00BCD4',
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#00BCD4',
        pointHoverBorderColor: '#FFFFFF',
      },
    ],
  };

  return (
    <>
      <style>
        {`
          @keyframes rotate-wave {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .wave {
            position: absolute;
            left: 50%;
            width: 200vw;
            height: 200vw;
            margin-left: -100vw;
            margin-top: -190vw;
            border-radius: 40%;
            animation: rotate-wave 20s linear infinite;
            background-color: #ffffff;
            
          }

          .wave.two {
            animation-duration: 25s;
            margin-top: -185vw;
            border-radius: 42%;
            background-color: #ffffff;
            opacity: 0.5;
          }
        @media screen and (max-width: 500px) {
           .wave {
             margin-top: -150vw; 
           }

          .wave.two {
           margin-top: -145vw; 
          }
         }
        `}
      </style>
      <div className="bg-white">

        <div className="relative min-h-screen w-full overflow-hidden bg-cyan-700">

          <div className="absolute inset-0">
            <div className="wave"></div>
            <div className="wave two"></div>
          </div>

          <div className="relative z-10">
            {loading ? (
              <div className="flex flex-col justify-center items-center min-h-screen text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
                <span className="mt-4 text-xl font-medium">Loading Dashboard...</span>
              </div>
            ) : (
              <div className="px-2 py-6 sm:px-4 sm:py-8">
                <br /><br />
                <Header username={pageUsername} timestamp={latestData.timestamp} formatTimestamp={formatTimestamp} />
                <h2 className="text-2xl font-semibold mb-6 ml-5 text-white">Current Sensor Readings</h2>
                <div className="flex flex-wrap justify-center gap-8 sm:gap-12 lg:gap-40 mb-10">
                  <SensorCard type="ph" value={latestData.ph} prevValue={sensorData.length > 1 ? sensorData[sensorData.length - 2]?.ph : null} />
                  <SensorCard type="turbidity" value={latestData.turbidity} prevValue={sensorData.length > 1 ? sensorData[sensorData.length - 2]?.turbidity : null} />
                  <SensorCard type="tds" value={latestData.tds} prevValue={sensorData.length > 1 ? sensorData[sensorData.length - 2]?.tds : null} />
                </div>
              </div>
            )}
          </div>
        </div>

        {!loading && (
          <div className="p-4 sm:p-6 lg:p-8 bg-slate-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SensorChart title="pH Levels" data={phChartData} options={chartOptions} hasData={chartDataPoints.length > 0} />
                <SensorChart title="Turbidity" data={turbidityChartData} options={chartOptions} hasData={chartDataPoints.length > 0} />
                <SensorChart title="Total Dissolved Solids (TDS)" data={tdsChartData} options={chartOptions} hasData={chartDataPoints.length > 0} />
              </div>
              <SensorMap latitude={latestData.latitude} longitude={latestData.longitude} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardHomePage;