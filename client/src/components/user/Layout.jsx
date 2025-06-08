import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaTint, FaBars, FaTimes, FaTachometerAlt, FaHistory,
  FaMapMarkedAlt, FaCog, FaSignOutAlt, FaUserCircle, FaBell,
  FaUserEdit, FaDownload, FaSun, FaMoon, FaCopy, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import io from 'socket.io-client';

const MAX_ALERTS_IN_DROPDOWN = 7;
const socket = io(`${import.meta.env.VITE_API_URL}`); // Use backend port

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme !== null ? JSON.parse(savedTheme) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [username, setUsername] = useState('');
  const [accessId, setAccessId] = useState(localStorage.getItem('accessId') || '');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [isAccessIdCopied, setIsAccessIdCopied] = useState(false);
  const [sensorDataForLayoutCSV, setSensorDataForLayoutCSV] = useState([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => { setIsSidebarOpen(window.innerWidth >= 1024); };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile`, { // Correct endpoint
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsername(response.data.username || 'Demo User');
        setAccessId(response.data.accessId || localStorage.getItem('accessId') || '');
      } catch (err) {
        console.error('Failed to fetch user profile in Layout:', err);
        setUsername('Demo User');
        toast.error('Failed to load user profile.', { theme: isDarkMode ? 'dark' : 'light' });
      }
    };
    fetchUserProfile();

    const handleNewSensorData = (data) => {
      try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) return;
        const decodedToken = JSON.parse(atob(currentToken.split('.')[1]));
        const userIdFromToken = decodedToken.userId || decodedToken.id;
        if (data.userId !== userIdFromToken) return;

        // Generate alerts for out-of-range values
        const newAlerts = [];
        if (data.ph < 6.5 || data.ph > 7.5) {
          newAlerts.push({
            id: `ph-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
            type: 'ph',
            message: `pH level out of range: ${data.ph.toFixed(2)}`,
            timestamp: new Date(),
            read: false
          });
        }
        if (data.turbidity > 2.5) {
          newAlerts.push({
            id: `turbidity-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
            type: 'turbidity',
            message: `Turbidity out of range: ${data.turbidity.toFixed(2)} NTU`,
            timestamp: new Date(),
            read: false
          });
        }
        if (data.tds < 150 || data.tds > 350) {
          newAlerts.push({
            id: `tds-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
            type: 'tds',
            message: `TDS out of range: ${data.tds.toFixed(2)} ppm`,
            timestamp: new Date(),
            read: false
          });
        }
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
          setHasUnreadAlerts(true);
          newAlerts.forEach(alert => toast.warning(alert.message, { theme: isDarkMode ? 'dark' : 'light' }));
        }
      } catch (err) {
        console.error('Error processing sensor data for alerts:', err);
      }
    };
    socket.on('newSensorData', handleNewSensorData);

    return () => {
      socket.off('newSensorData', handleNewSensorData);
    };
  }, [navigate, isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessId');
    socket.disconnect();
    navigate('/login');
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleCopyAccessId = () => {
    if (accessId && navigator.clipboard) {
      navigator.clipboard.writeText(accessId)
        .then(() => {
          setIsAccessIdCopied(true);
          toast.success('Access ID copied!', { theme: isDarkMode ? 'dark' : 'light', autoClose: 2000 });
          setTimeout(() => setIsAccessIdCopied(false), 2000);
        })
        .catch(err => {
          toast.error('Failed to copy Access ID.', { theme: isDarkMode ? 'dark' : 'light' });
        });
    }
  };

  const formatTimestampToIST = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric', hour12: true
    });
  };

  const markAlertsAsRead = () => {
    setHasUnreadAlerts(false);
  };

  const DropdownItem = ({ href = '#', onClick, icon: Icon, children, className = '' }) => (
    <a
      href={href} onClick={onClick}
      className={`group flex items-center w-full px-4 py-2.5 text-sm rounded-md transition-colors duration-150
        ${isDarkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-sky-300' : 'text-slate-700 hover:bg-slate-100 hover:text-sky-600'}
        ${className}`}
    >
      {Icon && <Icon className={`mr-3 text-base ${isDarkMode ? 'text-slate-400 group-hover:text-sky-300' : 'text-slate-500 group-hover:text-sky-600'}`} />}
      {children}
    </a>
  );

  const sidebarDynamicClasses = isSidebarOpen ? 'w-60 translate-x-0' : 'w-60 -translate-x-full lg:w-20 lg:translate-x-0';
  const mainContentMarginClass = isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20';

  const sidebarLinks = [
    { path: '/dashboard', exact: true, icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/dashboard/alerts', icon: FaHistory, label: 'Alerts History' },
  ];

  const csvDropdownPreparedData = sensorDataForLayoutCSV.map(d => ({
    Timestamp: formatTimestampToIST(d.timestamp),
    pH: d.ph, Turbidity: d.turbidity, TDS: d.tds,
    Latitude: d.latitude || 'N/A', Longitude: d.longitude || 'N/A'
  }));

  return (
    <div className={`flex min-h-screen font-sans ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-sky-50 text-slate-800'}`}>
      <ToastContainer newestOnTop position='top-right' />
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 shadow-lg transition-all duration-300 ease-in-out z-40 flex flex-col ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        } ${sidebarDynamicClasses}`}
      >
        <div className={`hidden lg:flex items-center p-4 h-16 shrink-0 shadow-sm ${!isSidebarOpen && 'lg:py-0 lg:justify-center'}`}>
          <FaTint className={`text-sky-600 text-3xl ${!isSidebarOpen && window.innerWidth >= 1024 ? 'mx-auto' : ''}`} />
          {(isSidebarOpen) && (
            <h1 className='ml-3 text-xl font-bold text-sky-600 dark:text-sky-500'>AquaMonitor</h1>
          )}
        </div>
        <nav className='mt-4 flex-grow shadow-sm'>
          {sidebarLinks.map((item) => {
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.label} to={item.path} title={item.label}
                className={`flex items-center mx-3 my-1 px-4 py-3 rounded-md transition-all duration-200 ease-in-out ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : `text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-sky-300 ${
                        !isSidebarOpen && window.innerWidth >= 1024 && 'justify-center'
                      }`
                }`}
                onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              >
                <item.icon className={`text-xl shrink-0 ${(isSidebarOpen) && 'mr-3'}`} />
                {(isSidebarOpen) && <span className='text-sm font-medium'>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className='p-3 shrink-0'>
          <button
            onClick={handleLogout} title='Logout'
            className={`flex items-center w-full mx-0 px-4 py-3 rounded-md transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-700/30 hover:text-red-500 ${
              !isSidebarOpen && window.innerWidth >= 1024 && 'justify-center'
            }`}
          >
            <FaSignOutAlt className={`text-xl shrink-0 ${(isSidebarOpen) && 'mr-3'}`} />
            {(isSidebarOpen) && <span className='text-sm font-medium'>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${mainContentMarginClass}`}>
        <header
          className={`sticky top-0 z-30 h-16 flex items-center justify-between px-6 shadow-sm ${
            isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-b border-slate-700' : 'bg-white/80 backdrop-blur-md border-b border-slate-200'
          }`}
        >
          <div className='flex items-center'>
            <button
              className='lg:hidden p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none mr-3'
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {isSidebarOpen ? <FaTimes className='h-5 w-5' /> : <FaBars className='h-5 w-5' />}
            </button>
            <div className='flex items-center lg:hidden'>
              <FaTint className='text-sky-600 text-2xl' />
              <h1 className='ml-2 text-lg font-bold text-sky-600 dark:text-sky-500'>AquaMonitor</h1>
            </div>
          </div>

          <div className='flex items-center space-x-3 sm:space-x-4'>
            <div className='relative'>
              <button
                title='Notifications'
                className={`p-2 rounded-full relative hover:bg-slate-200 dark:hover:bg-slate-700 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                onClick={() => {
                  setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
                  if (!isNotificationDropdownOpen) markAlertsAsRead();
                  setIsUserDropdownOpen(false);
                }}
              >
                <FaBell className='text-lg' />
                {hasUnreadAlerts && (
                  <span className='absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800'></span>
                )}
              </button>
              {isNotificationDropdownOpen && (
                <div className={`absolute right-0 mt-2.5 w-80 sm:w-96 rounded-lg shadow-xl p-2 z-50 border ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200'}`}>
                  <div className='flex justify-between items-center px-2 py-2 border-b dark:border-slate-700'>
                    <h3 className='font-semibold text-sm'>Notifications</h3>
                  </div>
                  <div className='max-h-80 overflow-y-auto py-1 custom-scrollbar'>
                    {alerts.length === 0 ? (
                      <p className='text-center text-xs py-4 text-slate-500 dark:text-slate-400'>No new notifications.</p>
                    ) : (
                      alerts.slice(0, MAX_ALERTS_IN_DROPDOWN).map(alert => (
                        <div key={alert.id} className={`px-3 py-2.5 border-b ${isDarkMode ? 'border-slate-700/50 hover:bg-slate-700/30' : 'border-slate-200/70 hover:bg-slate-50'} transition-colors`}>
                          <div className='flex items-start space-x-2.5'>
                            <FaExclamationTriangle className={`mt-1 text-base shrink-0 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                            <div>
                              <p className='text-xs leading-relaxed break-words'>{alert.message}</p>
                              <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatTimestampToIST(alert.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {alerts.length > MAX_ALERTS_IN_DROPDOWN && (
                    <Link
                      to='/dashboard/alerts' onClick={() => setIsNotificationDropdownOpen(false)}
                      className={`block w-full text-center px-3 py-2.5 text-xs font-medium rounded-b-md ${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-600/50 text-sky-400' : 'bg-slate-100 hover:bg-slate-200 text-sky-600'} transition-colors`}
                    >
                      Show All Notifications
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className='relative'>
              <button
                onClick={() => { setIsUserDropdownOpen(!isUserDropdownOpen); setIsNotificationDropdownOpen(false); }}
                className='flex items-center p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700'
                title='User Menu'
              >
                <FaUserCircle className={`text-3xl ${isDarkMode ? 'text-sky-400' : 'text-sky-500'}`} />
              </button>
              {isUserDropdownOpen && (
                <div className={`absolute right-0 mt-2.5 w-72 rounded-lg shadow-xl p-2 z-50 border ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200'}`}>
                  <div className={`px-3 py-3 mb-1 rounded-md ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Signed in as</p>
                    <p className='text-sm font-semibold break-all truncate'>{username || 'Loading...'}</p>
                  </div>
                  <div className='space-y-0.5'>
                    <DropdownItem href='#'>Your Profile</DropdownItem>
                    <DropdownItem href='#'>Settings</DropdownItem>
                  </div>
                  <div className={`my-2 py-2 border-y ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className='space-y-0.5 px-0'>
                      {csvDropdownPreparedData.length > 0 ? (
                        <CSVLink
                          data={csvDropdownPreparedData}
                          filename={`aquamonitor-data-${new Date().toISOString().split('T')[0]}.csv`}
                          className={`group flex items-center w-full px-4 py-2.5 text-sm rounded-md transition-colors duration-150 ${isDarkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-sky-300' : 'text-slate-700 hover:bg-slate-100 hover:text-sky-600'}`}
                          target='_self'
                        >
                          <FaDownload className={`mr-3 text-base ${isDarkMode ? 'text-slate-400 group-hover:text-sky-300' : 'text-slate-500 group-hover:text-sky-600'}`} />
                          Download CSV
                        </CSVLink>
                      ) : (
                        <div className={`group flex items-center w-full px-4 py-2.5 text-sm rounded-md text-slate-400 dark:text-slate-500 cursor-not-allowed`}>
                          <FaDownload className='mr-3 text-base' />
                          <span>CSV (No data)</span>
                        </div>
                      )}
                      <DropdownItem onClick={toggleDarkMode} icon={isDarkMode ? FaSun : FaMoon}>
                        {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      </DropdownItem>
                    </div>
                  </div>
                  <div className='px-3 py-2 text-xs'>
                    <div className='flex justify-between items-center'>
                      <span className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Access ID:</span>
                      {accessId && (
                        <button
                          onClick={handleCopyAccessId} title={isAccessIdCopied ? 'Copied!' : 'Copy Access ID'}
                          className={`p-1 rounded-md transition-colors ${isAccessIdCopied ? (isDarkMode ? 'text-green-400' : 'text-green-500') : (isDarkMode ? 'text-slate-400 hover:text-sky-300' : 'text-slate-500 hover:text-sky-600')}`}
                        >
                          {isAccessIdCopied ? <FaCheck className='h-3.5 w-3.5' /> : <FaCopy className='h-3.5 w-3.5' />}
                        </button>
                      )}
                    </div>
                    <p className={`font-mono break-all mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{accessId || 'N/A'}</p>
                  </div>
                  <div className={`mt-1 pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <DropdownItem
                      onClick={handleLogout} icon={FaSignOutAlt}
                      className={`${isDarkMode ? 'text-red-400 hover:bg-red-700/30 hover:text-red-300' : 'text-red-600 hover:bg-red-100 hover:text-red-700'}`}
                    >
                      Sign out
                    </DropdownItem>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className='p-6 flex-grow'>
          <Outlet context={{
            isDarkMode, formatTimestampToIST, alerts, username, accessId, setSensorDataForLayoutCSV
          }} />
        </main>
        <footer className={`text-center py-4 border-t ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
          <p className='text-xs'>© {new Date().getFullYear()} AquaMonitor. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;