import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import bg from '../../assets/images/bg10.png';
import { FaDroplet } from "react-icons/fa6";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/login`, {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('accessId', response.data.user.accessId);
      setLoading(false);
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
      <div className="bg-black/70 bg-opacity-95 shadow-lg rounded-xl p-6 w-full max-w-sm sm:max-w-md">
        {/* Logo Placeholder with Droplet Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center">
            <FaDroplet className='w-16 h-16 text-cyan-500'/>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-white text-center mb-2">Jala Rakshak Login</h2>
        <p className="text-white text-center text-sm mb-6">Access your water monitoring dashboard</p>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="username" className="block text-sm font-medium text-white mb-1">
              Username
            </label>
            <div className="flex items-center">
              <i className="fas fa-user absolute left-3 text-cyan-500"></i>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
              Password
            </label>
            <div className="flex items-center">
              <i className="fas fa-lock absolute left-3 text-cyan-500"></i>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm text-cyan-500 hover:underline flex items-center"
            >
              <i className="fas fa-question-circle mr-1"></i>
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-500 text-white py-2 rounded-lg font-medium hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Logging In...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </>
            )}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-white">
          Don't have an account?{' '}
          <a href="/login" className="text-cyan-500 hover:underline font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;