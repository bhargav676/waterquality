import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { User, Bell, Menu } from 'lucide-react';
import { FaDroplet } from "react-icons/fa6";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const DNavbar = () => {
  const navigate = useNavigate();
  const { deviceId: paramDeviceId } = useParams();
  const location = useLocation();
  const { state } = location;
  const deviceId = paramDeviceId || state?.deviceId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({ username: 'Loading...', email: '', role: '' });
  const [error, setError] = useState(null);

  // Determine the active tab based on current URL
  let activeTab = '';
  if (location.pathname.endsWith('/records')) activeTab = 'records';
  else if (location.pathname.endsWith('/download-csv')) activeTab = 'download-csv';
  else if (location.pathname.match(/\/device-detail(\/[^/]+)?\/?$/)) activeTab = 'detail';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserDetails({
        username: payload.username || 'User',
        email: payload.email || 'user@example.com',
        role: payload.role || 'Admin'
      });
    } catch (err) {
      console.error('Error decoding token:', err);
      setError('Failed to load user details');
      setUserDetails({
        username: 'JohnDoe',
        email: 'johndoe@example.com',
        role: 'Admin'
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessId');
    navigate('/login');
  };

  const navigateTo = (path) => {
    if (deviceId) {
      navigate(`/admin/device-detail/${deviceId}/${path}`, { state: { deviceId } });
      setIsMobileMenuOpen(false);
    }
  };

  const handleDashboardClick = () => {
    navigate('/admin');
    setIsMobileMenuOpen(false);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
        <button onClick={handleLogout} className="mt-2 px-4 py-2 bg-cyan-500 text-white rounded">
          Log Out
        </button>
      </div>
    );
  }

  // Utility for nav item classes
  const navItemClass = (tabName) =>
    `text-sm relative cursor-pointer after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-cyan-500 after:transition-all after:duration-300
    ${!deviceId ? 'opacity-50 cursor-not-allowed' : ''}
    ${activeTab === tabName ? 'text-cyan-500 font-bold after:w-full' : 'text-white after:w-0 hover:after:w-full hover:text-cyan-500'}`;

  // For mobile
  const mobileNavItemClass = (tabName) =>
    `text-base cursor-pointer px-3 py-2 rounded transition
    ${!deviceId ? 'opacity-50 cursor-not-allowed' : ''}
    ${activeTab === tabName ? 'bg-cyan-500 text-white font-bold' : 'hover:bg-cyan-500 hover:text-white'}`;

  return (
    <nav className="fixed top-4 left-4 right-4 bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-lg flex justify-between items-center z-50">
      {/* Left: Logo and App Name */}
      <div className="flex items-center gap-4">
        <button
          className="hidden md:block p-2 rounded-md"
          aria-label="Logo"
        >
          <FaDroplet className="w-8 h-8 text-cyan-500"/>
        </button>
        <span className="block md:hidden p-2 rounded-md">
          <FaDroplet className="w-8 h-8 text-cyan-500"/>
        </span>
        <h1 className="text-xl font-semibold">Jala Rakshak</h1>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6">
        <span
          onClick={() => navigateTo('')}
          className={navItemClass('detail')}
        >
          Device Details
        </span>
        <span
          onClick={() => navigateTo('records')}
          className={navItemClass('records')}
        >
          Records
        </span>
        <span
          onClick={() => navigateTo('download-csv')}
          className={navItemClass('download-csv')}
        >
          Download
        </span>
        <span
          onClick={handleDashboardClick}
          className="text-sm relative cursor-pointer after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-cyan-500 after:transition-all after:duration-300 hover:after:w-full flex items-center gap-1 hover:text-cyan-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </span>
      </div>

      {/* Right: Notification, Profile, Hamburger */}
      <div className="flex items-center gap-2 md:gap-6">
        <button
          onClick={() => {}}
          className="p-2 hover:bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          <Bell className="w-6 h-6" />
        </button>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          >
            <User className="w-6 h-6" />
          </button>
          {isMenuOpen && (
            <div className="absolute top-12 right-0 bg-black/90 text-white rounded-md shadow-md z-60 w-64 mt-3">
              <div className="px-4 py-3 border-b border-white/20">
                <p className="text-sm font-semibold">{userDetails.username}</p>
                <p className="text-xs text-white/70 mt-1">{userDetails.email}</p>
                <p className="text-xs text-white/70 mt-1">Role: {userDetails.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-600 rounded-b-md transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
        {/* Hamburger only on mobile */}
        <button
          className="md:hidden p-2 rounded-md ml-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open menu"
        >
          <Menu className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Black overlay (closes menu on click) */}
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Mobile popup menu */}
          <div className="fixed top-0 right-0 h-full w-2/3 max-w-xs bg-black/95 z-60 flex flex-col p-6 shadow-lg transition-transform duration-300">
            <button
              className="self-end p-2 mb-4 text-2xl text-white"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
            <div className='ml-5 w-2/2 bg-black/95 h-[500px] p-6 flex flex-col gap-6 shadow-lg'>
              <span className="text-lg font-semibold mb-2 text-cyan-500">Menu</span>
              <span
                className={mobileNavItemClass('detail')}
                onClick={() => navigateTo('')}
              >
                Device Details
              </span>
              <span
                className={mobileNavItemClass('records')}
                onClick={() => navigateTo('records')}
              >
                Records
              </span>
              <span
                className={mobileNavItemClass('download-csv')}
                onClick={() => navigateTo('download-csv')}
              >
                Download
              </span>
              <span
                className="text-base cursor-pointer px-3 py-2 rounded transition flex items-center gap-1 hover:bg-cyan-500 hover:text-white"
                onClick={handleDashboardClick}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </span>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default DNavbar;