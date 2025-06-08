import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/register`, {
        username, email, password, confirmPassword,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('accessId', response.data.user.accessId); 
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex items-center justify-center antialiased">
      <div className="bg-white shadow-md rounded-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Sign Up for AquaWatch</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-1" htmlFor="username">Username</label>
            <input
              id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username" required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-1" htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email" required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-1" htmlFor="password">Password</label>
            <input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password" required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm text-slate-600 mb-1" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your password" required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign Up
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;