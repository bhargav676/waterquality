import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';
import Nav from './Nav';

const socket = io(`${import.meta.env.VITE_API_URL}`);

const Layout = () => {
  const navigate = useNavigate();
  const [isDarkMode] = useState(false);
  const [username, setUsername] = useState('');
  const [accessId, setAccessId] = useState(localStorage.getItem('accessId') || '');
  const [alerts, setAlerts] = useState([]);
  const [hasUnreadData, setHasUnreadData] = useState(false);
  const [sensorDataForLayoutCSV, setSensorDataForLayoutCSV] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added loading state

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(response.data.username || 'Demo User');
        setAccessId(response.data.accessId || localStorage.getItem('accessId') || '');
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setUsername('Demo User');
        toast.error('Failed to load user profile.', { theme: 'light' });
      }
    };

    const fetchAlerts = async () => {
      try {
        setIsLoading(true); // Start loading
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlerts(response.data.slice(0, 50));
        setHasUnreadData(response.data.length > 0);
      } catch (err) {
        console.error('Failed to fetch alerts:', err.response?.status, err.response?.data || err.message);
        setAlerts([]);
        toast.error('Failed to load alerts.', { theme: 'light' });
      } finally {
        setIsLoading(false); 
      }
    };

    fetchUserProfile();
    fetchAlerts();

    const handleNewSensorData = (data) => {
      try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;
        const decodedToken = JSON.parse(atob(currentToken.split('.')[1]));
        const userIdFromToken = decodedToken.userId || decodedToken.id;
        if (data.userId !== userIdFromToken) return;

        const newAlerts = [];
        if (data.ph != null && (data.ph < 6.5 || data.ph > 8.5)) {
          newAlerts.push({
            id: `${data._id || Date.now()}-ph`,
            type: 'ph',
            message: `High pH level detected: ${data.ph.toFixed(2)}`,
            timestamp: new Date(),
            deviceId: data.deviceId,
          });
        }
        if (data.turbidity != null && data.turbidity > 5) {
          newAlerts.push({
            id: `${data._id || Date.now()}-turbidity`,
            type: 'turbidity',
            message: `High turbidity level detected: ${data.turbidity.toFixed(2)} NTU`,
            timestamp: new Date(),
            deviceId: data.deviceId,
          });
        }
        if (data.tds != null && data.tds > 1000) {
          newAlerts.push({
            id: `${data._id || Date.now()}-tds`,
            type: 'tds',
            message: `High TDS level detected: ${data.tds.toFixed(2)} ppm`,
            timestamp: new Date(),
            deviceId: data.deviceId,
          });
        }

        if (newAlerts.length > 0) {
          setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50));
          setHasUnreadData(true);
          newAlerts.forEach((alert) =>
            toast.warning(alert.message, { theme: 'light' })
          );
        }
      } catch (err) {
        console.error('Error processing sensor data:', err);
      }
    };

    socket.on('sensorDataUpdate', handleNewSensorData);

    return () => {
      socket.off('sensorDataUpdate', handleNewSensorData);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessId');
    socket.disconnect();
    navigate('/login');
  };

  const formatTimestampToIST = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen font-sans bg-white text-slate-800">
      <ToastContainer newestOnTop position="top-right" />
      <Nav
        isDarkMode={false}
        username={username}
        alerts={alerts}
        toggleDarkMode={() => {}}
        handleLogout={handleLogout}
        sensorDataForLayoutCSV={sensorDataForLayoutCSV}
        accessId={accessId}
        formatTimestampToIST={formatTimestampToIST}
        hasUnreadData={hasUnreadData}
        setHasUnreadData={setHasUnreadData}
        isDashboard={window.location.pathname === '/dashboard'}
      />
      <main className="flex-grow">
        <Outlet
          context={{
            isDarkMode: false,
            formatTimestampToIST,
            alerts,
            username,
            accessId,
            setSensorDataForLayoutCSV,
            isLoading, // Added to context
          }}
        />
      </main>
      <footer className="text-center py-4 border-t border-slate-200 text-slate-500 bg-white">
        <p className="text-xs">© {new Date().getFullYear()} Jala Rakshak. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;