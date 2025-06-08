import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Import AnimatePresence here
import DeviceListPanel from './DeviceListPanel'; // Adjust path as needed

// A simple hook to detect screen size (you might want a more robust one)
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};

const AppLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)'); // Tailwind's lg breakpoint is 1024px

  const [devices, setDevices] = useState([
    { deviceId: '1', name: 'Living Room Thermostat', status: 'normal' },
    { deviceId: '2', name: 'Kitchen Camera', status: 'alert' },
    { deviceId: '3', name: 'Bedroom Light', status: 'warning' },
    { deviceId: '4', name: 'Office Sensor', status: 'normal' },
  ]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    // if (isMobile) setSidebarOpen(false); // Sidebar can also close itself via its own props
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    // Add filtering logic here if devices are not filtered by an API
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Filter devices based on search term (client-side example)
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Rendering Logic */}
      {isMobile ? (
        <AnimatePresence>
          {isSidebarOpen && (
            <DeviceListPanel
              devices={filteredDevices}
              selectedDevice={selectedDevice}
              onDeviceClick={handleDeviceClick}
              searchTerm={searchTerm}
              onSearch={handleSearch}
              isLoading={isLoading}
              isMobile={true}
              onClose={closeSidebar} // Pass the close function
            />
          )}
        </AnimatePresence>
      ) : (
        // On desktop, always render it. The initial animation will play once.
        <DeviceListPanel
          devices={filteredDevices}
          selectedDevice={selectedDevice}
          onDeviceClick={handleDeviceClick}
          searchTerm={searchTerm}
          onSearch={handleSearch}
          isLoading={isLoading}
          isMobile={false}
        />
      )}

      {/* Main Content Area */}
      {/* Adjust left margin on desktop when sidebar is present */}
      <main className={`flex-1 p-4 sm:p-6 overflow-y-auto ${!isMobile ? 'lg:ml-72' : ''}`}>
        {/* Hamburger Button - only on mobile (lg:hidden) */}
        <button
          onClick={toggleSidebar}
          className="p-2 mb-4 text-slate-600 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 lg:hidden"
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-3.75 5.25h12.75" />
          </svg>
        </button>

        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-semibold text-slate-800">
            {selectedDevice ? selectedDevice.name : 'Dashboard'}
          </h1>
          <p className="text-slate-600 mt-2">
            {selectedDevice ? `Details for ${selectedDevice.deviceId}` : 'Select a device to see details.'}
          </p>
          {/* Your main content here */}
        </div>
      </main>

      {/* Backdrop for mobile - click to close sidebar */}
      {isMobile && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/30 z-20 lg:hidden" // z-20 is below sidebar (z-30)
        />
      )}
    </div>
  );
};

export default AppLayout;