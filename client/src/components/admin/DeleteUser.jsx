import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import bg from '../../assets/images/bg3.jpeg'

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const Toast = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3000); 
    return () => clearTimeout(timer); 
  }, [id, onClose]);

  return (
    <div
      className={`flex items-center p-4 mb-2 rounded-lg shadow-lg transition-transform transform translate-x-0 opacity-100 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600 '
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

const DeleteUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUsers, setDeletingUsers] = useState({});
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  let toastIdCounter = 0; // Fallback for toast IDs

  const addToast = (message, type) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${toastIdCounter++}`;
    setToasts(prev => [...prev, { id, message, type }].slice(-3)); // Limit to 3 toasts
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        const response = await axios.get(`${API_BASE_URL}/user/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
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
      console.error('Error deleting user:', err);
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
      if (!token) {
        throw new Error('No token found');
      }
      const response = await axios.get(`${API_BASE_URL}/user/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-400"
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
            />
            <path
              className="text-white bg-gray-900 opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
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
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage: `url('${bg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-4xl mx-auto bg-black bg-opacity-70 opacity-80 rounded-lg shadow">
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
        <header className="sticky top-0 bg-black bg-opacity-75 rounded-lg shadow p-4 mb-6 flex items-center justify-between opacity-75">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="p-2 text-blue-400 hover:text-blue-300"
              aria-label="Back to admin dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-white ml-2">Manage Users</h1>
          </div>
        </header>

        {/* User List */}
        {users.length === 0 ? (
          <div className="text-center py-10 bg-black bg-opacity-75 opacity-75 rounded-lg p-4">
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
            <div className="hidden sm:block rounded-lg shadow overflow-hidden" role="table">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-black bg-opacity-75 text-white text-left text-sm" role="row">
                    <th className="px-4 py-3" role="columnheader">Username</th>
                    <th className="px-4 py-3" role="columnheader">Email</th>
                    <th className="px-4 py-3" role="columnheader">Role</th>
                    <th className="px-4 py-3" role="columnheader">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr
                      key={user._id}
                      className="border-t border-gray-800 text-white "
                      role="row"
                    >
                      <td className="px-4 py-3 text-sm" role="cell">{user.username}</td>
                      <td className="px-4 py-3 text-sm" role="cell">{user.email}</td>
                      <td className="px-4 py-3 text-sm" role="cell">{user.role}</td>
                      <td className="px-4 py-3" role="cell">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={deletingUsers[user._id]}
                          className={`px-3 py-1 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm ${
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
                            'Delete'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
              {users.map(user => (
                <div
                  key={user._id}
                  className="bg-black bg-opacity-75 rounded-lg shadow p-4 text-white opacity-75"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-white">{user.email}</p>
                      <p className="text-xs text-white">Role: {user.role}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={deletingUsers[user._id]}
                      className={`px-3 py-1 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm ${
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
                        'Delete'
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