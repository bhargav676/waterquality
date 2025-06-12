import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/user/Login';
import Layout from './components/user/layout/Layout';
import DashboardHomePage from './components/user/DashboardHomePage';
import Alerts from './components/user/Alerts';
import AdminDashboard from './components/admin/AdminDashboard';
import AddUser from './components/admin/AddUser';
import DeleteUser from './components/admin/DeleteUser';
import DeviceDetailsPage from './components/admin/DeviceDetailPage/DeviceDetailsPage';
import Records from './components/admin/DeviceDetailPage/Records';
import Download from './components/admin/DeviceDetailPage/Download';
import MoreDetails from './components/admin/DeviceDetailPage/MoreDetails';
import Realtime from './components/admin/DeviceDetailPage/Realtime';
import IntroPage from './components/Intro';
import IoTGatewayHealthPage from './components/admin/DeviceDetailPage/IoTGatewayHealthPage';
import GatewayHealth from './components/user/GatewayHealth';
import Analytics from './components/user/Analytics';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to='/login' />;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const expirationTime = payload.exp * 1000;
    if (Date.now() >= expirationTime) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessId');
      return <Navigate to='/login' />;
    }
    // Role-based access
    if (requireAdmin && payload.role !== 'admin') return <Navigate to='/login' />;
    if (!requireAdmin && payload.role !== 'user') return <Navigate to='/login' />;
    return children;
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('accessId');
    return <Navigate to='/login' />;
  }
};

// Wrapper component to provide navigate to AddUser
const AddUserWrapper = () => {
  const navigate = useNavigate();
  return <AddUser onClose={() => navigate('/admin')} />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<IntroPage />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/adduser" element={<ProtectedRoute requireAdmin={true}><AddUserWrapper /></ProtectedRoute>} />
        <Route path="/deleteuser" element={<ProtectedRoute requireAdmin={true}><DeleteUser /></ProtectedRoute>} />
        <Route path="/device-detail/:deviceId" element={<ProtectedRoute requireAdmin={true}><DeviceDetailsPage /></ProtectedRoute>} />
        <Route path="/admin/device-detail/:deviceId" element={<ProtectedRoute requireAdmin={true}><DeviceDetailsPage /></ProtectedRoute>} />
        <Route path="/admin/device-detail/:deviceId/records" element={<ProtectedRoute requireAdmin={true}><Records /></ProtectedRoute>} />
        <Route path="/admin/device-detail/:deviceId/download-csv" element={<ProtectedRoute requireAdmin={true}><Download /></ProtectedRoute>} />
        <Route path="/admin/device-detail/:deviceId/realtime" element={<ProtectedRoute requireAdmin={true}><Realtime /></ProtectedRoute>} />
        <Route path="/admin/device-detail/:deviceId/more-details" element={<ProtectedRoute requireAdmin={true}><MoreDetails /></ProtectedRoute>} />
        <Route path="/admin/device-detail/:deviceId/health" element={<ProtectedRoute requireAdmin={true}><IoTGatewayHealthPage /></ProtectedRoute>} />

        {/* User Routes */}
        <Route element={<ProtectedRoute requireAdmin={false}><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardHomePage />} />
          <Route path="/dashboard/alerts" element={<Alerts />} />
          <Route path="/dashboard/gateway-health" element={<GatewayHealth />} />
          <Route path="/dashboard/analytics" element={<Analytics/>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;