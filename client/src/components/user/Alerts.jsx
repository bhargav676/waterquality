import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaVial, FaSmog, FaTint, FaArrowDown, FaArrowUp, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const ALERT_DETAILS = {
  ph: {
    label: 'pH Level',
    icon: <FaVial />,
    color: 'red',
    tooltip: 'pH out of safe range',
    badge: 'pH',
  },
  turbidity: {
    label: 'Turbidity',
    icon: <FaSmog />,
    color: 'yellow',
    tooltip: 'Turbidity spike detected' ,
    badge: 'Turb',
  },
  tds: {
    label: 'TDS',
    icon: <FaTint />,
    color: 'blue',
    tooltip: 'Total Dissolved Solids high',
    badge: 'TDS',
  },
};

const Alerts = () => {
  const { alerts, isDarkMode, formatTimestampToIST, isLoading } = useOutletContext();
  const [showNoData, setShowNoData] = useState(true);
  const [sortDesc, setSortDesc] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowNoData(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoData(false);
    }
  }, [isLoading]);


  let filtered = alerts || [];
  if (filterType !== 'all') filtered = filtered.filter((a) => a.type === filterType);
  if (search.trim())
    filtered = filtered.filter((a) =>
      a.message.toLowerCase().includes(search.trim().toLowerCase())
    );
  filtered = filtered.sort((a, b) =>
    sortDesc
      ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getAlertStyle = (alert) => {
    const base = `rounded-xl shadow-lg p-5 flex items-center transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl border-l-4`;
    if (!alert) return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`;
    if (alert.type === 'ph') {
      return `${base} ${isDarkMode ? 'bg-red-900/20 text-red-100 border-red-500' : 'bg-red-50 text-red-800 border-red-600'}`;
    }
    if (alert.type === 'turbidity') {
      return `${base} ${isDarkMode ? 'bg-yellow-900/20 text-yellow-100 border-yellow-400' : 'bg-yellow-50 text-yellow-800 border-yellow-500'}`;
    }
    if (alert.type === 'tds') {
      return `${base} ${isDarkMode ? 'bg-blue-900/20 text-blue-100 border-blue-500' : 'bg-blue-50 text-blue-800 border-blue-600'}`;
    }
    return `${base} ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`;
  };

  const getAlertIcon = (type) => (
    <span
      title={ALERT_DETAILS[type]?.tooltip}
      className={`text-3xl ${
        type === 'ph'
          ? isDarkMode
            ? 'text-red-400'
            : 'text-red-600'
          : type === 'turbidity'
          ? isDarkMode
            ? 'text-yellow-400'
            : 'text-yellow-600'
          : type === 'tds'
          ? isDarkMode
            ? 'text-blue-400'
            : 'text-blue-600'
          : ''
      }`}
    >
      {ALERT_DETAILS[type]?.icon}
    </span>
  );

  const getBadge = (alert) => (
    <span
      className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold shadow ${
        alert.type === 'ph'
          ? isDarkMode
            ? 'bg-red-900 text-red-200'
            : 'bg-red-100 text-red-700'
          : alert.type === 'turbidity'
          ? isDarkMode
            ? 'bg-yellow-800 text-yellow-100'
            : 'bg-yellow-100 text-yellow-700'
          : alert.type === 'tds'
          ? isDarkMode
            ? 'bg-blue-900 text-blue-100'
            : 'bg-blue-100 text-blue-700'
          : ''
      }`}
    >
      {ALERT_DETAILS[alert.type]?.badge}
    </span>
  );

  return (
    <div
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}
    >
      <ToastContainer
        newestOnTop
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 mt-20 gap-4">
        <div>
          <h1
            className={`text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-slate-100' : 'text-sky-900'
            } animate-fade-in`}
          >
            Alerts History
          </h1>
          <p
            className={`text-base mb-1 ${
              isDarkMode ? 'text-slate-300' : 'text-sky-600'
            } animate-fade-in`}
          >
            All recorded alerts for your water quality monitoring.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`rounded px-3 py-1 border outline-none shadow-sm transition ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white border-sky-300 text-sky-800'
            }`}
            title="Filter by alert type"
          >
            <option value="all">All Types</option>
            <option value="ph">pH</option>
            <option value="turbidity">Turbidity</option>
            <option value="tds">TDS</option>
          </select>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search message..."
            className={`rounded px-3 py-1 border outline-none shadow-sm transition ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-400'
                : 'bg-white border-sky-300 text-sky-800 placeholder:text-sky-400'
            }`}
            title="Search alert message"
          />
          {/* Sort */}
          <button
            className={`flex items-center gap-1 rounded px-3 py-1 border shadow-sm transition font-semibold ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-sky-300 text-sky-800 hover:bg-sky-100'
            }`}
            onClick={() => setSortDesc((d) => !d)}
            title={`Sort by date ${sortDesc ? 'descending' : 'ascending'}`}
          >
            {sortDesc ? <FaArrowDown /> : <FaArrowUp />} Date
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {isLoading && showNoData ? (
          <div
            className={`rounded-xl shadow-lg p-6 text-center ${
              isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-sky-600'
            } animate-fade-in`}
          >
            <p className="text-base font-medium">No data found</p>
          </div>
        ) : isLoading && !showNoData ? (
          <div className="flex justify-center items-center py-8">
            <div
              className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${
                isDarkMode ? 'border-slate-300' : 'border-sky-600'
              }`}
            ></div>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((alert, index) => (
            <div
              key={alert.id || index}
              className={getAlertStyle(alert)}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mr-4 shrink-0 text-3xl shadow ${
                  isDarkMode ? 'bg-sky-900/30' : 'bg-sky-100'
                }`}
              >
                {getAlertIcon(alert.type)}
              </div>
              {/* Main body */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base font-semibold">{alert.message}</span>
                  {getBadge(alert)}
                  {/* Resolved badge */}
                  {alert.resolved !== undefined && (
                    alert.resolved ? (
                      <span className="flex items-center ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 gap-1">
                        <FaCheckCircle className="text-green-500" /> Resolved
                      </span>
                    ) : (
                      <span className="flex items-center ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 gap-1">
                        <FaExclamationCircle className="text-red-500" /> Active
                      </span>
                    )
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-slate-400 dark:text-slate-500">
                    {formatTimestampToIST(alert.timestamp)}
                  </span>
                  {alert.value !== undefined && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded shadow text-xs font-medium ${
                        isDarkMode
                          ? 'bg-slate-900 text-slate-100'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      Value: <b>{alert.value}</b>
                      {alert.threshold !== undefined && (
                        <>
                          {' '}
                          | Limit: <b>{alert.threshold}</b>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className={`rounded-xl shadow-lg p-6 text-center ${
              isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-sky-600'
            } animate-fade-in`}
          >
            <p className="text-base font-medium">No alerts available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;