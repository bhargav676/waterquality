import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Wifi, WifiOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_API_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Helper for online detection
const isDeviceOnline = (device) => {
  const timestamp =
    device.latestData?.timestamp ||
    device.lastSeen ||
    device.timestamp ||
    (device.sensorData && device.sensorData[0]?.timestamp);
  if (!timestamp) return false;
  try {
    const time = new Date(timestamp).getTime();
    return time > Date.now() - 5 * 60 * 1000;
  } catch {
    return false;
  }
};

const DeviceItem = ({ device, selectedDevice, onDeviceClick, onClose }) => {
  const navigate = useNavigate();
  const online = isDeviceOnline(device);

  const handleUserClick = () => {
    const deviceId = device.deviceId;
    if (!deviceId || !device.userId) return;
    onDeviceClick(device);
    navigate(`/device-detail/${deviceId}`, {
      state: { deviceId, userId: device.userId },
    });
    if (onClose) onClose();
  };

  return (
    <motion.div
      className={`flex items-center p-3 rounded-lg bg-[rgba(0,0,0,0.6)] ${
        selectedDevice?.deviceId === device.deviceId ? 'border border-cyan-500/50' : ''
      } cursor-pointer transition-all duration-200 ease-in-out`}
      onClick={handleUserClick}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.8)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-1 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center">
          <span className="text-white text-xs font-medium">
            {device.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <p className="text-sm font-medium text-white truncate">{device.name}</p>
      </div>
      {/* Online/offline dot */}
      <div className="flex items-center justify-end ml-2">
        <span
          className={`inline-block w-3 h-3 rounded-full border-2 border-white ${
            online ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      </div>
    </motion.div>
  );
};

const SidebarContent = ({
  filteredDevices,
  onlineCount,
  offlineCount,
  searchTerm,
  onSearch,
  isLoading,
  isDropdownOpen,
  toggleDropdown,
  selectedDevice,
  onDeviceClick,
  onClose
}) => (
  <>
    <div className="p-4 border-b border-[rgba(255,255,255,0.2)]">
      <h2 className="text-xl font-bold text-white tracking-tight">Devices</h2>
    </div>
    <div className="p-4 flex flex-col gap-2 border-b border-[rgba(255,255,255,0.2)]">
      <div className="relative mb-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-500" />
        <input
          type="text"
          placeholder="Search devices..."
          className="w-full pl-11 pr-4 py-2.5 bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.3)] rounded-lg text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-[rgba(96,165,250,1)] focus:border-[rgba(96,165,250,1)] transition-all duration-200"
          value={searchTerm}
          onChange={onSearch}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-white/80">
        <Wifi className="w-4 h-4 text-green-400" />
        <span className="mr-2">{onlineCount} Online</span>
        <WifiOff className="w-4 h-4 text-gray-400 ml-2" />
        <span>{offlineCount} Offline</span>
        <span className="ml-auto text-cyan-300 font-semibold">{filteredDevices.length} Total</span>
      </div>
    </div>
    <div className="flex-1 p-4">
      <button
        onClick={toggleDropdown}
        className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 text-white ${
          isDropdownOpen
            ? 'bg-[rgba(0,0,0,0.9)] border border-cyan-500 shadow-lg shadow-cyan-500/20'
            : 'bg-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.8)]'
        }`}
      >
        <span className={`text-sm font-medium ${isDropdownOpen ? 'text-cyan-400' : 'text-white'}`}>
          {filteredDevices.length} Device{filteredDevices.length !== 1 ? 's' : ''}
        </span>
        {isDropdownOpen ? (
          <ChevronUp className="ml-auto w-5 h-5 text-cyan-500" />
        ) : (
          <ChevronDown className="ml-auto w-5 h-5 text-cyan-500" />
        )}
      </button>
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-2 overflow-y-auto max-h-60 bg-[rgba(0,0,0,0.5)] rounded-lg p-2 scrollbar-hide"
          >
            {isLoading && <p className="text-sm text-white/80 animate-pulse">Loading devices...</p>}
            {!isLoading && filteredDevices.length === 0 && (
              <p className="text-sm text-white/80 text-center">No devices found.</p>
            )}
            {!isLoading &&
              filteredDevices.map((device) => (
                <DeviceItem
                  key={device.deviceId}
                  device={device}
                  selectedDevice={selectedDevice}
                  onDeviceClick={onDeviceClick}
                  onClose={onClose}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </>
);

const DeviceListPanel = ({
  devices,
  selectedDevice,
  onDeviceClick,
  searchTerm,
  onSearch,
  isLoading,
  isOpen = false, // Only used for mobile
  onClose
}) => {
  const [deviceList, setDeviceList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  useEffect(() => {
    const uniqueDevices = [];
    const seenDeviceIds = new Set();
    for (const device of devices) {
      if (!seenDeviceIds.has(device.deviceId) && device.userId) {
        seenDeviceIds.add(device.deviceId);
        uniqueDevices.push(device);
      }
    }
    setDeviceList(uniqueDevices);

    socket.on('sensorDataUpdate', (data) => {
      setDeviceList((prev) => {
        if (!data.userId || !data.deviceId) return prev;
        const updatedDevices = prev.filter((d) => d.deviceId !== data.deviceId);
        updatedDevices.push({
          deviceId: data.deviceId,
          name: data.username,
          userId: data.userId,
          location: { type: 'Point', coordinates: [data.longitude, data.latitude] },
          timestamp: data.timestamp,
        });
        const uniqueUpdated = [];
        const seenIds = new Set();
        for (const device of updatedDevices) {
          if (!seenIds.has(device.deviceId) && device.userId) {
            seenIds.add(device.deviceId);
            uniqueUpdated.push(device);
          }
        }
        return uniqueUpdated;
      });
    });

    return () => {
      socket.off('sensorDataUpdate');
    };
  }, [devices]);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  // --- Devices filtering and sorting (online first) ---
  const filteredDevices = deviceList
    .filter(
      (device) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Online devices first
      const onlineA = isDeviceOnline(a);
      const onlineB = isDeviceOnline(b);
      if (onlineA === onlineB) return 0;
      return onlineA ? -1 : 1;
    });

  const onlineCount = filteredDevices.filter(isDeviceOnline).length;
  const offlineCount = filteredDevices.length - onlineCount;

  // --- Responsive rendering ---
  return (
    <>
      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;    
          }
        `}
      </style>
      {/* Desktop - always visible, fixed left */}
      <aside
        className={`
          hidden md:flex flex-col
          w-72 bg-[rgba(0,0,0,0.8)] border-r ml-5 mt-3 border-[rgba(255,255,255,0.2)]
          fixed top-20 left-0 h-[calc(100vh-5rem)] z-30 backdrop-blur-md rounded-r-xl shadow-2xl
          transition-all duration-300
        `}
      >
        <SidebarContent
          filteredDevices={filteredDevices}
          onlineCount={onlineCount}
          offlineCount={offlineCount}
          searchTerm={searchTerm}
          onSearch={onSearch}
          isLoading={isLoading}
          isDropdownOpen={isDropdownOpen}
          toggleDropdown={toggleDropdown}
          selectedDevice={selectedDevice}
          onDeviceClick={onDeviceClick}
          onClose={onClose}
        />
      </aside>

      {/* Mobile - overlay, toggled with isOpen */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              key="panel-backdrop"
              className="fixed inset-0 bg-black/70 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            {/* Sidebar panel */}
            <motion.aside
              key="panel-mobile"
              className={`
                flex flex-col w-72 bg-[rgba(0,0,0,0.95)] border-r border-[rgba(255,255,255,0.2)]
                fixed top-0 left-0 h-full z-50 backdrop-blur-md rounded-r-xl shadow-2xl
                transition-all duration-300 md:hidden
              `}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Close button */}
              <button
                className="absolute top-3 right-3 z-60 p-2 rounded-full hover:bg-white/10"
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <SidebarContent
                filteredDevices={filteredDevices}
                onlineCount={onlineCount}
                offlineCount={offlineCount}
                searchTerm={searchTerm}
                onSearch={onSearch}
                isLoading={isLoading}
                isDropdownOpen={isDropdownOpen}
                toggleDropdown={toggleDropdown}
                selectedDevice={selectedDevice}
                onDeviceClick={onDeviceClick}
                onClose={onClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DeviceListPanel;