import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import bg from '../../assets/images/bg7.jpeg';
import { FaDroplet } from "react-icons/fa6";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const AddUser = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/user/add-user`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500); // Show success message for 1.5 seconds before closing
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${bg}')`,
      }}
    >
      <div className="bg-black/60 bg-opacity-95 shadow-lg rounded-xl p-6 w-full max-w-sm sm:max-w-md">
        {/* Logo Placeholder with Droplet Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center">
            <FaDroplet className='w-16 h-16 text-cyan-500 mt-20'/>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="mr-2 p-1 text-cyan-500 hover:text-cyan-600"
              aria-label="Back to admin dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-cyan-500 hover:text-red-500"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-white text-center text-sm mb-6">Create a new user for Aquamonitor</p>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-1">Username</label>
            <div className="flex items-center">
              <i className="fas fa-user absolute left-3 text-cyan-500"></i>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-1">Email</label>
            <div className="flex items-center">
              <i className="fas fa-envelope absolute left-3 text-cyan-500"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="Enter email"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-1">Password</label>
            <div className="flex items-center">
              <i className="fas fa-lock absolute left-3 text-cyan-500"></i>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-white mb-1">Role</label>
            <div className="flex items-center">
              <i className="fas fa-user-tag absolute left-3 text-cyan-500"></i>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors"
              disabled={loading || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Adding...
                </>
              ) : success ? (
                <>
                  <i className="fas fa-check-circle mr-2"></i>
                  Added Successfully
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2"></i>
                  Add User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;