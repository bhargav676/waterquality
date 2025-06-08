// routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserSensorData = require('../models/UserSensorData');
const Device = require('../models/Device');
const authMiddleware = require('../middleware/auth');

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

// Get all devices with user association
router.get('/devices', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const devices = await Device.find().populate('userId', 'username');
    const validDevices = [];
    const seenDeviceIds = new Set();

    for (const device of devices) {
      if (!seenDeviceIds.has(device.deviceId) && device.userId) {
        seenDeviceIds.add(device.deviceId);
        const deviceData = {
          deviceId: device.deviceId,
          name: device.userId.username,
          userId: device.userId._id.toString(),
          location: device.location,
          lastActive: device.lastActive,
          temperature: device.temperature,
          battery: device.battery,
          capacity:device.capacity
        };
        validDevices.push(deviceData);
        console.log('Device sent:', deviceData);
      } else {
        console.log('Skipped device:', {
          deviceId: device.deviceId,
          userId: device.userId ? device.userId.toString() : null,
          reason: !device.userId ? 'No user' : 'Duplicate',
        });
      }
    }

    console.log('Total valid devices sent:', validDevices.length);
    res.status(200).json(validDevices);
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sensor data for a specific user
router.get('/user-sensor-data/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select('username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sensorData = await UserSensorData.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json({
      username: user.username,
      sensorData: sensorData.length > 0 ? sensorData : [],
    });
  } catch (err) {
    console.error('Error fetching user sensor data:', err);
    res.status(500).json({ message: 'Server error: Unable to fetch user sensor data' });
  }
});

// Get all sensor data across users
router.get('/user-sensor-data', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const data = await UserSensorData.find().populate('userId', 'username');
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching sensor data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/alerts/:userId', authMiddleware, async (req, res) => {
  const alerts = await UserSensorData.find({
    userId: req.params.userId,
    $or: [
      { ph: { $lt: 6.5 } },
      { ph: { $gt: 8.5 } },
      { turbidity: { $gt: 5 } },
      { tds: { $gt: 500 } },
    ],
  })
    .sort({ timestamp: -1 })
    .limit(3)
    .select('ph turbidity tds timestamp');
  res.json(
    alerts.map((a) => ({
      message: `${
        a.ph < 6.5 ? 'Low pH' : a.ph > 8.5 ? 'High pH' : ''
      }${a.turbidity > 5 ? 'High Turbidity' : ''}${a.tds > 500 ? 'High TDS' : ''}`,
      timestamp: a.timestamp,
    }))
  );
});

module.exports = router;