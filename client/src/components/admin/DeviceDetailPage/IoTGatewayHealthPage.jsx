import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Dnavbar';
import bg from '../../../assets/images/bg9.png';
import { toast } from 'react-toastify';
import io from 'socket.io-client';


const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const socket = io(`${API_BASE_URL}`, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

const SKELETON_CARDS = [1, 2, 3, 4];

// Helper to format date/time
const formatDate = (date) =>
    date ? new Date(date).toLocaleString('en-US', { hour12: false }) : 'N/A';

// Helper to download CSV
const downloadCSV = (data) => {
    if (!data.length) return;
    const header = Object.keys(data[0]);
    const csvRows = [
        header.join(','),
        ...data.map(row => header.map(field => JSON.stringify(row[field] ?? '')).join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensor_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
};

const HEALTH_THRESHOLDS = {
    temperature: { min: 0, max: 60 },
    battery: { min: 3.3, warn: 3.7, max: 5 },
    capacity: { min: 0, warn: 500, max: 5000 }
};

const IoTGatewayHealthPage = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();

    const [deviceData, setDeviceData] = useState(null);
    const [sensorData, setSensorData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [live, setLive] = useState(false);
    const [error, setError] = useState(null);

    // Fetch device & sensor data
    const fetchDeviceData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token not found. Please log in.');

            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                throw new Error('Session expired. Please log in again.');
            }

            const deviceResponse = await axios.get(`${API_BASE_URL}/admin/devices`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const device = deviceResponse.data.find((d) => d.deviceId === deviceId);
            if (!device || !device.userId) {
                throw new Error(`Device not found or has no associated user for deviceId: ${deviceId}`);
            }

            const userId = device.userId;
            const sensorResponse = await axios.get(`${API_BASE_URL}/admin/user-sensor-data/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { _t: Date.now() },
            });

            setDeviceData({
                deviceId: device.deviceId,
                name: device.name,
                userId: device.userId,
            });
            setSensorData(sensorResponse.data.sensorData || []);
        } catch (err) {
            const errorMsg =
                err.response?.status === 404
                    ? 'Device or user not found.'
                    : err.message || 'Failed to load device data.';
            setError(errorMsg);
            toast.error(errorMsg, { theme: 'dark' });
            if (err.response?.status === 401 || err.message.includes('expired')) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeviceData();
    }, [deviceId]);

    useEffect(() => {
        socket.on('sensorDataUpdate', (data) => {
            if (data.deviceId === deviceId && data.userId) {
                setSensorData((prev) => {
                    const newData = [
                        {
                            temperature: data.temperature != null ? data.temperature : null,
                            battery: data.battery != null ? data.battery : null,
                            capacity: data.capacity != null ? data.capacity : null,
                            timestamp: data.timestamp || new Date().toISOString(),
                        },
                        ...prev,
                    ].slice(0, 50);
                    return newData;
                });
                setLive(true);
                setTimeout(() => setLive(false), 2500);
            }
        });
        return () => {
            socket.off('sensorDataUpdate');
        };
        // eslint-disable-next-line
    }, [deviceId]);

    // Health data logic
    const healthData = useMemo(() => {
        if (!sensorData.length || !deviceData) return null;
        const latest = sensorData[0];
        const timestamp = new Date(latest.timestamp);
        const isOnline = timestamp.getTime() > Date.now() - 5 * 60 * 1000;
        // Warnings
        let warnings = [];
        if (latest.temperature > HEALTH_THRESHOLDS.temperature.max)
            warnings.push('High temperature!');
        if (latest.battery < HEALTH_THRESHOLDS.battery.warn)
            warnings.push('Low battery voltage!');
        if (latest.capacity < HEALTH_THRESHOLDS.capacity.warn)
            warnings.push('Battery capacity low!');
        return {
            temperature: latest.temperature != null ? `${latest.temperature.toFixed(1)} °C` : 'N/A',
            battery: latest.battery != null ? `${latest.battery.toFixed(2)} V` : 'N/A',
            capacity: latest.capacity != null ? `${latest.capacity.toFixed(0)} mAh` : 'N/A',
            status: isOnline ? 'Online' : 'Offline',
            lastUpdated: formatDate(latest.timestamp),
            warnings,
            raw: latest,
        };
    }, [sensorData, deviceData]);

    // Chart data (reverse for time order)
    const chartData = useMemo(() => {
        return [...sensorData]
            .slice(0, 20)
            .reverse()
            .map((d) => ({
                ...d,
                time: d.timestamp ? new Date(d.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '',
            }));
    }, [sensorData]);

    // Card component
    const HealthCard = ({ title, value, icon, badge, warning }) => (
        <div className={`transition-all duration-300 bg-black/85 p-4 rounded-lg border shadow-md border-cyan-500/30 hover:scale-105`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {badge && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${badge === 'Online' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{badge}</span>
                )}
            </div>
            <p className="text-xl font-bold text-cyan-200">{value}</p>
            {warning && <div className="text-xs text-yellow-400 mt-2">{warning}</div>}
        </div>
    );

    // Skeleton
    const SkeletonCard = () => (
        <div className="animate-pulse bg-gray-800/40 rounded-lg p-4 h-24" />
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-4">
                <Navbar />
                <div className="flex gap-4 w-full max-w-2xl">
                    {SKELETON_CARDS.map((_, idx) => <SkeletonCard key={idx} />)}
                </div>
                <p>Loading IoT gateway health...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <p className="text-lg text-red-500">{error}</p>
                    <button
                        onClick={() => navigate(`/device-details/${deviceId}`)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-cyan-500 transition-colors"
                    >
                        Back to Device Details
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-cover bg-center pt-20"
            style={{ backgroundImage: `url(${bg})` }}
        >
            <Navbar />
            <div className="max-w-7xl mx-auto p-4">
                <div className="flex flex-col md:flex-row md:justify-between items-center mb-4 gap-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-white">
                            IoT Gateway Health: {deviceData?.name || deviceId}
                        </h1>
                        {live && <span className="ml-2 animate-pulse w-2 h-2 rounded-full bg-green-400" title="Live update" />}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchDeviceData} className="px-3 py-1.5 rounded bg-cyan-700 text-white hover:bg-cyan-800 transition">Refresh</button>
                        <button onClick={() => downloadCSV(sensorData)} className="px-3 py-1.5 rounded bg-gray-700 text-white hover:bg-gray-800 transition">Download CSV</button>
                    </div>
                </div>

                <div className="bg-black/70 backdrop-blur-md p-6 rounded-lg shadow-xl">
                    {healthData?.warnings?.length > 0 && (
                        <div className="mb-3 p-3 rounded bg-yellow-800/60 text-yellow-200 text-sm font-semibold animate-pulse">
                            {healthData.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <HealthCard
                            title="Temperature"
                            value={healthData?.temperature}
                            icon={<svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>}
                            warning={healthData?.raw.temperature > HEALTH_THRESHOLDS.temperature.max ? 'High!' : undefined}
                        />
                        <HealthCard
                            title="Battery Voltage"
                            value={healthData?.battery}
                            icon={<svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" /><rect x="21" y="10" width="2" height="4" /></svg>}
                            warning={healthData?.raw.battery < HEALTH_THRESHOLDS.battery.warn ? 'Low!' : undefined}
                        />
                        <HealthCard
                            title="Battery Capacity"
                            value={healthData?.capacity}
                            icon={<svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="16" rx="5" /></svg>}
                            warning={healthData?.raw.capacity < HEALTH_THRESHOLDS.capacity.warn ? 'Low!' : undefined}
                        />
                        <HealthCard
                            title="Device Status"
                            value={healthData?.status}
                            badge={healthData?.status}
                            icon={<svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>}
                        />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                        <span className="text-gray-300 text-sm">Last updated: <span className="font-mono">{healthData?.lastUpdated}</span></span>
                        <span className="text-gray-400 text-xs">Device ID: <span className="font-mono">{deviceData?.deviceId}</span></span>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default IoTGatewayHealthPage;