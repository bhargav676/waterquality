import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaDroplet } from 'react-icons/fa6';
import { FaTachometerAlt, FaHistory, FaSignOutAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, isDarkMode, handleLogout, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();

  const sidebarLinks = [
    { path: '/dashboard', exact: true, icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/dashboard/alerts', icon: FaHistory, label: 'Alerts History' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setIsSidebarOpen(!isCollapsed);
  };

  const sidebarDynamicClasses = isSidebarOpen
    ? `w-60 translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-60'}`
    : 'w-60 -translate-x-full lg:w-20 lg:translate-x-0';

  return (
    <div
      className={`fixed inset-y-0 left-0 shadow-lg transition-all duration-300 ease-in-out z-40 flex flex-col bg-black/70 backdrop-blur-md text-white ${sidebarDynamicClasses}`}
    >
      <div className={`flex items-center p-4 h-16 shrink-0 ${isCollapsed && 'lg:py-0 lg:justify-center'}`}>
        <div className="flex items-center gap-2">
          <FaDroplet className="text-cyan-500 text-3xl" />
          {(!isCollapsed || !isSidebarOpen || window.innerWidth < 1024) && (
            <h1 className="text-xl font-semibold text-cyan-500">Jala Rakshak</h1>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="hidden lg:block ml-auto p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <FaChevronRight className="h-5 w-5 text-white" /> : <FaChevronLeft className="h-5 w-5 text-white" />}
        </button>
      </div>

      {isSidebarOpen && window.innerWidth < 1024 && (
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-2 text-white text-xl self-end mr-4"
          title="Close Sidebar"
        >
          ✕
        </button>
      )}

      <nav className="mt-4 flex-grow">
        {sidebarLinks.map((item) => {
          const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              title={item.label}
              className={`flex items-center mx-3 my-1 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out relative group
                ${isActive ? 'bg-cyan-500/20 text-cyan-500 border-l-4 border-cyan-500' : 'text-white/70 hover:bg-white/10 hover:text-cyan-500'}
                ${isCollapsed && isSidebarOpen && window.innerWidth >= 1024 ? 'justify-center' : ''}`}
              onClick={() => {
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            >
              <item.icon className={`text-xl shrink-0 ${isCollapsed && isSidebarOpen && window.innerWidth >= 1024 ? '' : 'mr-3'} text-white/70 ${isActive ? 'text-cyan-500' : 'group-hover:text-cyan-500'}`} />
              {(!isCollapsed || !isSidebarOpen || window.innerWidth < 1024) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isCollapsed && isSidebarOpen && window.innerWidth >= 1024 && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 shrink-0">
        <button
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center w-full mx-3 px-4 py-3 rounded-lg transition-colors duration-200 text-white/70 hover:bg-red-600/20 hover:text-red-500
            ${isCollapsed && isSidebarOpen && window.innerWidth >= 1024 ? 'justify-center' : ''}`}
        >
          <FaSignOutAlt className={`text-xl shrink-0 ${isCollapsed && isSidebarOpen && window.innerWidth >= 1024 ? '' : 'mr-3'} text-white/70 hover:text-red-500`} />
          {(!isCollapsed || !isSidebarOpen || window.innerWidth < 1024) && (
            <span className="text-sm font-medium">Logout</span>
          )}
          {isCollapsed && isSidebarOpen && window.innerWidth >= 1024 && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-white/90 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;