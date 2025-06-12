import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Removed background image import and usage
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// --- Toast Component (unchanged style) ---
const Toast = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onClose]);
  return (
    <div
      className={`flex items-center p-4 mb-2 rounded-lg shadow-lg transition-transform transform translate-x-0 opacity-100 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      } text-white text-sm`}
    >
      <span>{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-auto p-1 text-white hover:text-gray-300"
        aria-label="Close toast"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12;"
          />
        </svg>
      </button>
    </div>
  );
};

const UserBadge = ({ role }) => {
  // Add a colored badge for role
  let color = 'bg-gray-700';
  if (role === 'admin') color = 'bg-blue-600';
  if (role === 'moderator') color = 'bg-purple-600';
  if (role === 'user') color = 'bg-gray-700';
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded-full font-semibold uppercase ${color} text-white`}>
      {role}
    </span>
  );
};

// --- Animated Icon Button ---
const IconButton = ({ icon, label, ...props }) => (
  <button
    className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-900 bg-gray-800 text-blue-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600"
    aria-label={label}
    {...props}
  >
    {icon}
    <span className="ml-2 hidden md:inline">{label}</span>
  </button>
);

const DeleteUser = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState(''); // Search feature!
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUsers, setDeletingUsers] = useState({});
  const [toasts, setToasts] = useState([]);
  const [sortBy, setSortBy] = useState('username'); // Sorting feature
  const [sortDir, setSortDir] = useState('asc');
  const navigate = useNavigate();
  let toastIdCounter = 0;

  const addToast = (message, type) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${toastIdCounter++}`;
    setToasts(prev => [...prev, { id, message, type }].slice(-3));
  };
  const removeToast = (id) => setToasts(prev => prev.filter(toast => toast.id !== id));

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const response = await axios.get(`${API_BASE_URL}/user/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeletingUsers(prev => ({ ...prev, [userId]: true }));
    try {
      await axios.delete(`${API_BASE_URL}/user/delete/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(users.filter(user => user._id !== userId));
      addToast('User deleted successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setDeletingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleBack = () => navigate('/admin');
  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await axios.get(`${API_BASE_URL}/user/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Search and sort
  const filteredUsers = users
    .filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let v1 = a[sortBy], v2 = b[sortBy];
      if (typeof v1 === 'string') v1 = v1.toLowerCase();
      if (typeof v2 === 'string') v2 = v2.toLowerCase();
      if (v1 < v2) return sortDir === 'asc' ? -1 : 1;
      if (v1 > v2) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (column) => {
    if (sortBy === column) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  // --- UI ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="text-white bg-gray-900 opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-lg text-white">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <p className="text-lg text-red-600">{error}</p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-white text-white rounded-lg hover:bg-gray-700"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-0 md:p-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-5xl mx-auto bg-gray-900 bg-opacity-90 rounded-xl shadow-2xl p-4 md:p-8 mt-8">
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
            />
          ))}
        </div>
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <IconButton
              icon={(
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
              label="Back"
              onClick={handleBack}
            />
            <h1 className="text-2xl font-semibold text-white ml-3">Manage Users</h1>
          </div>
          <div className="flex items-center space-x-2">
            <input
              className="px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border-2 border-gray-700 focus:outline-none focus:border-blue-500 transition-all"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
            />
            <span className="text-gray-500 text-xs ml-2">{filteredUsers.length} users</span>
          </div>
        </header>
        {/* Features: Export CSV */}
        <div className="flex justify-end mb-2">
          <button
            className="flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-white text-sm font-medium shadow transition-all"
            onClick={() => {
              // Export to CSV feature
              const csv = [
                ['Username', 'Email', 'Role'],
                ...filteredUsers.map(u => [u.username, u.email, u.role])
              ].map(row => row.join(',')).join('\n');
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              const a = document.createElement('a');
              a.href = url;
              a.download = `users-${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Export CSV
          </button>
        </div>
        {/* User List Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 bg-gray-900 bg-opacity-75 rounded-lg p-4">
            <p className="text-white text-lg">No users found.</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Admin Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl shadow overflow-hidden" role="table">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-black bg-opacity-80 text-white text-left text-sm" role="row">
                    <th
                      className="px-4 py-3 cursor-pointer select-none"
                      role="columnheader"
                      onClick={() => handleSort('username')}
                    >
                      Username
                      {sortBy === 'username' && (
                        <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none"
                      role="columnheader"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {sortBy === 'email' && (
                        <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none"
                      role="columnheader"
                      onClick={() => handleSort('role')}
                    >
                      Role
                      {sortBy === 'role' && (
                        <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th className="px-4 py-3" role="columnheader">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr
                      key={user._id}
                      className="border-t border-gray-800 text-white group hover:bg-gray-800 transition"
                      role="row"
                    >
                      <td className="px-4 py-3 text-sm font-medium flex items-center space-x-2" role="cell">
                        <span className="rounded-full bg-blue-700 w-8 h-8 flex items-center justify-center text-white font-bold mr-2 text-base">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                        <span>{user.username}</span>
                      </td>
                      <td className="px-4 py-3 text-sm" role="cell">{user.email}</td>
                      <td className="px-4 py-3 text-sm" role="cell">
                        <UserBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3" role="cell">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={deletingUsers[user._id]}
                          className={`px-3 py-1 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm shadow transition-all ${
                            deletingUsers[user._id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                          }`}
                          aria-label={`Delete user ${user.username}`}
                        >
                          {deletingUsers[user._id] ? (
                            <div className="flex items-center">
                              <svg
                                className="animate-spin h-5 w-5 text-white mr-2"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Deleting...
                            </div>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map(user => (
                <div
                  key={user._id}
                  className="bg-gray-800 bg-opacity-90 rounded-xl shadow p-4 text-white opacity-95 flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-3">
                    <span className="rounded-full bg-blue-700 w-10 h-10 flex items-center justify-center text-white font-bold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-base font-medium">{user.username}</p>
                      <p className="text-xs text-gray-200">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <UserBadge role={user.role} />
                  </div>
                  <div className="flex mt-2">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={deletingUsers[user._id]}
                      className={`w-full px-3 py-2 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm shadow ${
                        deletingUsers[user._id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                      }`}
                      aria-label={`Delete user ${user.username}`}
                    >
                      {deletingUsers[user._id] ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin h-5 w-5 text-white mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Deleting...
                        </div>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteUser;