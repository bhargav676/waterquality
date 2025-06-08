import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaVial, FaSmog, FaTint } from 'react-icons/fa';

const Alerts = () => {
  const { alerts, isDarkMode, formatTimestampToIST } = useOutletContext();

  const getAlertStyle = (alert) => {
    const base = `rounded-lg shadow-md p-4 flex items-center`;
    if (!alert) return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
    if (alert.type === 'ph') {
      return `${base} ${isDarkMode ? 'bg-red-700/30 text-red-200' : 'bg-pink-100 text-red-700'}`;
    }
    if (alert.type === 'turbidity') {
      return `${base} ${isDarkMode ? 'bg-yellow-600/30 text-yellow-200' : 'bg-yellow-100 text-yellow-700'}`;
    }
    if (alert.type === 'tds') {
      return `${base} ${isDarkMode ? 'bg-red-700/30 text-red-200' : 'bg-pink-100 text-red-700'}`;
    }
    return `${base} ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`;
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'ph':
        return <FaVial className={`text-2xl ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />;
      case 'turbidity':
        return <FaSmog className={`text-2xl ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />;
      case 'tds':
        return <FaTint className={`text-2xl ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />;
      default:
        return null;
    }
  };

  return (
    <div className='mb-6'>
      <ToastContainer newestOnTop position='top-right' />
      <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-sky-900'}`}>Alerts History</h1>
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-sky-600'}`}>All recorded alerts for your water quality monitoring.</p>
      <div className='mt-6 space-y-4'>
        {alerts.length > 0 ? (
          alerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((alert) => (
              <div key={alert.id} className={getAlertStyle(alert)}>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 ${
                    isDarkMode ? 'bg-sky-900/20' : 'bg-sky-100'
                  }`}
                >
                  {getAlertIcon(alert.type)}
                </div>
                <div>
                  <p className='text-sm font-medium'>{alert.message}</p>
                  <p className='text-xs text-slate-400 dark:text-slate-500'>{formatTimestampToIST(alert.timestamp)}</p>
                </div>
              </div>
            ))
        ) : (
          <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-sky-800' : 'bg-white'}`}>
            <p className='text-blue-500 dark:text-sky-400'>No alerts available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;