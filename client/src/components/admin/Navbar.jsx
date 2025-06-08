import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Bell, Menu } from 'lucide-react';
import { FaDroplet } from "react-icons/fa6";
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const Navbar = ({onToggleSidebar, onOpenDevicePanel}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDevicePanelOpen, setIsDevicePanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({ username: 'Loading...', email: '', role: '' });
  const [error, setError] = useState(null);
  const closeDevicePanel = () => setIsDevicePanelOpen(false);
  const navigate = useNavigate();
  const location = useLocation();
   
  let activeTab = '';
  if (/^\/(admin)?\/?$/.test(location.pathname)) activeTab = 'dashboard';
  else if (location.pathname.startsWith('/about')) activeTab = 'about';
  else if (location.pathname.startsWith('/adduser')) activeTab = 'adduser';
  else if (location.pathname.startsWith('/deleteuser')) activeTab = 'deleteuser';

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

  const handleAddUserClick = () => {
    navigate('/adduser');
    setIsMobileMenuOpen(false);
  };

  const handleDeleteUserClick = () => {
    navigate('/deleteuser');
    setIsMobileMenuOpen(false);
  };

  const handleDashboardClick = () => {
    navigate('/admin');
    setIsMobileMenuOpen(false);
  };

  const handleAboutClick = () => {
    navigate('/about');
    setIsMobileMenuOpen(false);
  };

  // Utility for nav item classes (desktop)
  const navItemClass = (tabName) =>
    `text-sm relative cursor-pointer after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-cyan-500 after:transition-all after:duration-300
    ${activeTab === tabName ? 'text-cyan-500 font-bold after:w-full' : 'text-white after:w-0 hover:after:w-full hover:text-cyan-500'}`;

  // Utility for nav item classes (mobile)
  const mobileNavItemClass = (tabName) =>
    `text-base cursor-pointer px-3 py-2 rounded transition
    ${activeTab === tabName ? 'bg-cyan-500 text-white font-bold' : 'hover:bg-cyan-500 hover:text-white'}`;

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

  return (
    <nav className="fixed top-4 left-4 right-4 bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-lg flex justify-between items-center z-50">
      {/* Left: Logo and App Name */}
      <div className="flex items-center gap-4">
        {/* Sidebar toggle only on md+ */}
        <button
          className="hidden md:block p-2 rounded-md"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FaDroplet className="w-8 h-8 text-cyan-500" />
        </button>
        {/* Logo only on mobile */}
        <span className="block md:hidden p-2 rounded-md">
          <FaDroplet className="w-8 h-8 text-cyan-500" />
        </span>
        <h1 className="text-xl font-semibold">Jala Rakshak</h1>
      </div>

      {/* Center: Menu Items (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-6">
        <span 
          className={navItemClass('dashboard')}
          onClick={handleDashboardClick}
        >Dashboard</span>
        <span 
          className={navItemClass('about')}
          onClick={handleAboutClick}
        >About Us</span>
        {userDetails.role === 'admin' && (
          <>
            <span
              className={navItemClass('adduser')}
              onClick={handleAddUserClick}
            >
              Add New User
            </span>
            <span
              className={navItemClass('deleteuser')}
              onClick={handleDeleteUserClick}
            >
              Delete User
            </span>
          </>
        )}
      </div>

      {/* Right: Notification, Profile, Hamburger */}
      <div className="flex items-center gap-2 md:gap-6">
        <button
          onClick={() => { }}
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
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 z-60 flex flex-col items-end md:hidden">
          <div className="w-2/3 bg-black/95 h-full p-6 flex flex-col gap-6 shadow-lg">
            <button
              className="self-end p-2"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
            <div className='ml-10 w-2/2 bg-black/95 h-[500px] p-6 flex flex-col gap-6 shadow-lg'>
              <span
                className="text-lg font-semibold mb-2 cursor-pointer text-cyan-500"
                onClick={() => {
                  if (window.innerWidth < 768 && onOpenDevicePanel) {
                    onOpenDevicePanel();
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                Devices
              </span>
              <span 
                className={mobileNavItemClass('dashboard')}
                onClick={handleDashboardClick}
              >Dashboard</span>
              <span 
                className={mobileNavItemClass('about')}
                onClick={handleAboutClick}
              >About Us</span>
              {userDetails.role === 'admin' && (
                <>
                  <span 
                    className={mobileNavItemClass('adduser')}
                    onClick={handleAddUserClick}
                  >Add New User</span>
                  <span 
                    className={mobileNavItemClass('deleteuser')}
                    onClick={handleDeleteUserClick}
                  >Delete User</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;