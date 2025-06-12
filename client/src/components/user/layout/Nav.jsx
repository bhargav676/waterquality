import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaDroplet } from 'react-icons/fa6';
import {
  FaBars, FaTimes, FaBell, FaUserCircle,
  FaTachometerAlt, FaHistory, FaHeartbeat, FaChartBar, FaInfoCircle, FaSignOutAlt, FaCopy, FaCheck,
  FaVial, FaSmog, FaTint
} from 'react-icons/fa';

const navLinks = [
  { path: '/dashboard', exact: true, icon: FaTachometerAlt, label: 'Dashboard' },
  { path: '/dashboard/alerts', icon: FaHistory, label: 'Alerts' },
  { path: '/dashboard/gateway-health', icon: FaHeartbeat, label: 'Gateway Health' },
  { path: '/dashboard/analytics', icon: FaChartBar, label: 'Analytics' },
  { path: '/dashboard/about', icon: FaInfoCircle, label: 'About Us' }
];

const Nav = ({
  username,
  handleLogout,
  hasUnreadData,
  alerts = [],
  accessId,
  formatTimestampToIST = (ts) => ts,
  setHasUnreadData = () => {}
}) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isAccessIdCopied, setIsAccessIdCopied] = useState(false);

  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null); // Added for notification panel

  // Avatar initials
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const markAlertsAsRead = () => setHasUnreadData(false);

  const handleCopyAccessId = () => {
    if (accessId && navigator.clipboard) {
      navigator.clipboard.writeText(accessId)
        .then(() => {
          setIsAccessIdCopied(true);
          setTimeout(() => setIsAccessIdCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy Access ID:', err);
        });
    }
  };

  // Close profile and notification popups on route/page change
  useEffect(() => {
    setIsUserDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  }, [location.pathname]);

  // Handle outside click for user dropdown
  useEffect(() => {
    if (!isUserDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target) &&
        !event.target.closest('.profile-trigger')
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isUserDropdownOpen]);

  // Handle outside click for notification dropdown
  useEffect(() => {
    if (!isNotificationDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target) &&
        !event.target.closest('.notification-trigger')
      ) {
        setIsNotificationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isNotificationDropdownOpen]);

  // Get the latest 5 alerts, sorted by timestamp (newest first)
  const latestAlerts = [...alerts]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  // Get icon and color based on alert type, matching Alerts component
  const getAlertIcon = (type) => {
    switch (type) {
      case 'ph':
        return <FaVial className="text-lg text-red-600" />;
      case 'turbidity':
        return <FaSmog className="text-lg text-yellow-600" />;
      case 'tds':
        return <FaTint className="text-lg text-blue-600" />;
      default:
        return <FaBell className="text-lg text-slate-500" />;
    }
  };

  return (
    <header className="fixed top-4 left-4 right-4 bg-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between">
      {/* Left: Logo and Menu */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-md hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <FaTimes className="h-5 w-5 text-slate-800" /> : <FaBars className="h-5 w-5 text-slate-800" />}
        </button>
        <div className="flex items-center">
          <FaDroplet className="text-cyan-500 text-2xl" />
          <h1 className="ml-2 text-xl font-bold text-gray-900">Jala Rakshak</h1>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden lg:flex items-center gap-4">
        {navLinks.map((item) => {
          const isActive = item.exact ? location.pathname === item.path : location.pathname?.startsWith(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md
                ${isActive ? 'bg-cyan-50 text-cyan-600' : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-600'}`}
            >
              <item.icon className={`mr-2 text-base ${isActive ? 'text-cyan-600' : 'text-gray-700 group-hover:text-cyan-600'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Side: Notifications and User */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationDropdownRef}>
          <button
            title="Notifications"
            className="notification-trigger p-2 rounded-md hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            onClick={() => {
              setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
              if (!isNotificationDropdownOpen) markAlertsAsRead();
              setIsUserDropdownOpen(false);
              setIsMenuOpen(false);
            }}
          >
            <FaBell className="text-lg text-gray-700" />
            {hasUnreadData && (
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>
          {isNotificationDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-xl shadow-xl p-3 z-50 border bg-white border-gray-200 text-gray-700">
              <div className="flex justify-between items-center px-2 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto py-1 custom-scrollbar">
                {latestAlerts.length === 0 ? (
                  <p className="text-center text-xs py-4 text-gray-400">No new notifications.</p>
                ) : (
                  latestAlerts.map(alert => (
                    <div key={alert.id} className="px-3 py-2.5 border-b border-gray-200/50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-2.5">
                        <span className="mt-1 text-base shrink-0">{getAlertIcon(alert.type)}</span>
                        <div>
                          <p className="text-xs font-medium leading-relaxed break-words">{alert.message}</p>
                          <p className="text-[11px] mt-0.5 text-gray-500">{formatTimestampToIST(alert.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {/* User Dropdown with Avatar */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => {
              setIsUserDropdownOpen((prev) => !prev);
              setIsNotificationDropdownOpen(false);
              setIsMenuOpen(false);
            }}
            className="profile-trigger flex items-center p-2 rounded-md hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            title="User Menu"
          >
            <span className="rounded-full bg-cyan-100 text-cyan-600 font-bold w-8 h-8 flex items-center justify-center border border-cyan-300">
              {getInitials(username)}
            </span>
          </button>
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 rounded-xl shadow-xl p-3 z-50 border bg-white border-gray-200 text-gray-700">
              <div className="px-3 py-3 mb-1 rounded-md bg-gray-50 flex items-center gap-2">
                <span className="rounded-full bg-cyan-100 text-cyan-600 font-bold w-8 h-8 flex items-center justify-center border border-cyan-300">
                  {getInitials(username)}
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-500">Signed in as</p>
                  <p className="text-sm font-semibold break-all truncate text-cyan-600">{username || 'Loading...'}</p>
                </div>
              </div>
              <div className="space-y-0.5">
                <Link to="/dashboard/profile" className="group flex items-center w-full px-4 py-2.5 text-sm rounded-md text-gray-700 hover:bg-cyan-50 hover:text-cyan-600">
                  <FaUserCircle className="mr-3 text-base text-gray-700 group-hover:text-cyan-600" />
                  Your Profile
                </Link>
                <Link to="/dashboard/settings" className="group flex items-center w-full px-4 py-2.5 text-sm rounded-md text-gray-700 hover:bg-cyan-50 hover:text-cyan-600">
                  <FaHistory className="mr-3 text-base text-gray-700 group-hover:text-cyan-600" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="group flex items-center w-full px-4 py-2.5 text-sm rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  <FaSignOutAlt className="mr-3 text-base text-gray-700 group-hover:text-red-600" />
                  Logout
                </button>
              </div>
              <div className="mt-3 px-3 py-2 text-xs border-t border-gray-200 flex items-center">
                <span className="font-medium text-gray-500 mr-2">Access ID:</span>
                <span className="font-mono break-all text-cyan-600 flex-1 truncate" title={accessId || 'N/A'}>
                  {accessId || 'N/A'}
                </span>
                {accessId && (
                  <button
                    onClick={handleCopyAccessId}
                    title={isAccessIdCopied ? 'Copied!' : 'Copy Access ID'}
                    className={`ml-2 p-1 rounded-md transition-colors ${isAccessIdCopied ? 'text-green-500' : 'text-gray-700 hover:text-cyan-600'}`}
                  >
                    {isAccessIdCopied ? <FaCheck className="h-4 w-4 text-cyan-600" /> : <FaCopy className="h-4 w-4 text-cyan-600" />}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white rounded-xl shadow-xl p-4 z-40 border border-gray-200 lg:hidden">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((item) => {
              const isActive = item.exact ? location.pathname === item.path : location.pathname?.startsWith(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${isActive ? 'bg-cyan-50 text-cyan-600' : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-600'}`}
                >
                  <item.icon className={`mr-2 text-base ${isActive ? 'text-cyan-600' : 'text-gray-700 group-hover:text-cyan-600'}`} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/dashboard/profile"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-cyan-50 hover:text-cyan-600"
            >
              <FaUserCircle className="mr-2 text-base text-gray-700 group-hover:text-cyan-600" />
              Your Profile
            </Link>
            <Link
              to="/dashboard/settings"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-cyan-50 hover:text-cyan-600"
            >
              <FaHistory className="mr-2 text-base text-gray-700 group-hover:text-cyan-600" />
              Settings
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md"
            >
              <FaSignOutAlt className="mr-2 text-base text-gray-700 group-hover:text-red-600" />
              Logout
            </button>
            <div className="flex items-center px-4 py-2 text-xs font-medium rounded-md text-gray-700 border-t border-gray-200 mt-2">
              <span className="font-medium text-gray-500 mr-2">Access ID:</span>
              <span className="font-mono break-all text-cyan-600 flex-1 truncate" title={accessId || 'N/A'}>
                {accessId || 'N/A'}
              </span>
              {accessId && (
                <button
                  onClick={handleCopyAccessId}
                  title={isAccessIdCopied ? 'Copied!' : 'Copy Access ID'}
                  className={`ml-2 p-1 rounded-md transition-colors ${isAccessIdCopied ? 'text-green-500' : 'text-gray-700 hover:text-cyan-600'}`}
                >
                  {isAccessIdCopied ? <FaCheck className="h-4 w-4 text-cyan-600" /> : <FaCopy className="h-4 w-4 text-cyan-600" />}
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Nav;