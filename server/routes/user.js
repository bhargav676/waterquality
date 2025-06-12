const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSensorData = require('../models/UserSensorData');
const Device = require('../models/Device');
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { v4: uuidv4 } = require('uuid');


const adminMiddleware = (req, res, next) => { 
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

router.post('/add-user', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const accessId = uuidv4();

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      accessId,
      role: 'user',
    });
    await newUser.save();

    await sendEmail(
      email,
      'Welcome to Water Monitoring System',
      `Hi ${username},\n\nYour account has been created by an admin. Your access ID is: ${accessId}\n\nLogin with your username and password to get started.`
    ).catch((emailErr) => {
      console.error(`Failed to send welcome email to ${email}:`, emailErr.message);
    });

    res.status(201).json({
      message: 'User added successfully by admin',
      user: { username: newUser.username, email: newUser.email, accessId: newUser.accessId, role: newUser.role },
    });
  } catch (err) {
    console.error('Error adding user:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate key error: username, email, or access ID already exists' });
    }
    res.status(500).json({ message: 'Server error: Unable to add user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const payload = { userId: user._id, username: user.username, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { username: user.username, email: user.email, accessId: user.accessId, role: user.role },
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error: Unable to login' });
  }
});
router.post('/sensor', async (req, res) => {
  try {
    const { ph, turbidity, tds, latitude, longitude, accessId, deviceId, temperature, battery,capacity } = req.body;

    // Validate accessId
    if (!accessId) {
      return res.status(400).json({ message: 'accessId is required' });
    }

    // Find user by accessId
    const user = await User.findOne({ accessId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid access ID' });
    }

    console.log('Received data:', {
      userId: user._id,
      deviceId: deviceId || user.username,
      username: user.username,
      ph,
      turbidity,
      tds,
      latitude,
      longitude,
      temperature,
      battery,
      capacity,
    });

   
    const sensorData = new UserSensorData({
      userId: user._id,
      deviceId: deviceId || user.username,
      ph: ph != null ? ph : null,
      turbidity: turbidity != null ? turbidity : null,
      tds: tds != null ? tds : null,
      latitude: latitude != null ? latitude : null,
      longitude: longitude != null ? longitude : null,
      temperature: temperature != null ? temperature : null,
      battery: battery != null ? battery : null,
      capacity: capacity != null ? capacity : null,
    });
    await sensorData.save();

    // Update or insert device
    await Device.updateOne(
      { deviceId: deviceId || user.username },
      {
        $set: {
          deviceId: deviceId || user.username,
          name: user.username,
          userId: user._id,
          location: {
            type: 'Point',
            coordinates: [longitude != null ? longitude : 0, latitude != null ? latitude : 0],
          },
          lastActive: new Date(),
          temperature: temperature != null ? temperature : null,
          battery: battery != null ? battery : null,
          capacity: capacity != null ? capacity : null,
        },
      },
      { upsert: true }
    );

    // Prepare Socket.IO payload
    const io = req.app.get('io');
    const sensorDataPayload = {
      userId: user._id.toString(),
      deviceId: deviceId || user.username,
      username: user.username,
      ph: ph != null ? ph : null,
      turbidity: turbidity != null ? turbidity : null,
      tds: tds != null ? tds : null,
      latitude: latitude != null ? latitude : null,
      longitude: longitude != null ? longitude : null,
      temperature: temperature != null ? temperature : null,
      battery: battery != null ? battery : null,
      capacity:  capacity!= null ?  capacity: null,
      timestamp: sensorData.timestamp,
    };

    // pH alert
    if (ph != null && (ph > 8.5 || ph < 6.5)) {
      sensorDataPayload.alert = `High pH level detected: ${ph}`;
      sendEmail(
        user.email,
        'Water Quality Alert: High pH Level',
        `Warning: The pH level of your water is ${ph}, which exceeds the safe threshold of 8.0. Please take action.`
      ).catch((emailErr) => {
        console.error(`Failed to send email to ${user.email} for pH ${ph}:`, emailErr.message);
      });
    }

    io.emit('sensorDataUpdate', sensorDataPayload);

    res.status(200).json({ message: 'Sensor data saved successfully' });
  } catch (err) {
    console.error('Error saving sensor data:', err);
    res.status(500).json({ message: 'Server error: Unable to save sensor data', details: err.message });
  }
});

router.get('/sensor/data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1, // Default to page 1
      limit = 50, // Default to 50 records per page
      sort = 'desc', // Default to descending order
      startDate, // Optional date range filter
      endDate,
      deviceId, // Optional device ID filter
    } = req.query;

    // Validate query parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ message: 'Invalid page or limit' });
    }

    // Build query
    const query = { userId };
    if (deviceId) query.deviceId = deviceId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Execute query with pagination and sorting
    const data = await UserSensorData.find(query)
      .select('ph turbidity tds latitude longitude temperature battery capacity deviceId timestamp') // Select only needed fields
      .sort({ timestamp: sort === 'asc' ? 1 : -1 }) // Sort by timestamp
      .skip((pageNum - 1) * limitNum) // Skip records for pagination
      .limit(limitNum) // Limit records per page
      .lean(); // Use lean() for faster queries by returning plain JS objects

    // Get total count for pagination metadata
    const totalRecords = await UserSensorData.countDocuments(query);

    res.status(200).json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    });
  } catch (err) {
    console.error('Error fetching sensor data:', err);
    res.status(500).json({ message: 'Server error: Unable to fetch sensor data' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('username email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error: Unable to fetch profile' });
  }
});

router.delete('/delete/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userIdToDelete = req.params.id;

    if (userIdToDelete === req.user.userId) {
      return res.status(403).json({ message: 'Admins cannot delete themselves' });
    }

    const user = await User.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, email } = user;

    // Delete user, sensor data, and devices
    await User.findByIdAndDelete(userIdToDelete);
    await UserSensorData.deleteMany({ userId: userIdToDelete });
    await Device.deleteMany({ userId: userIdToDelete });

    await sendEmail(
      email,
      'Account Deletion Notification',
      `Hi ${username},\n\nYour account has been deleted by an admin. If you believe this is a mistake, please contact support.`
    ).catch((emailErr) => {
      console.error(`Failed to send deletion email to ${email}:`, emailErr.message);
    });

    res.status(200).json({ message: 'User, sensor data, and devices deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error: Unable to delete user' });
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('username email role accessId');
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error: Unable to fetch users' });
  } 
});

router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Fetch sensor data for the user
    const sensorData = await UserSensorData.find({ userId }).sort({ timestamp: -1 });

    const alerts = sensorData.reduce((acc, data) => {
      const deviceAlerts = [];

      if (data.ph != null && (data.ph < 6.5 || data.ph > 8.5)) {
        deviceAlerts.push({
          id: `${data._id}-ph`,
          type: 'ph',
          message: `High pH level detected: ${data.ph}`,
          timestamp: data.timestamp,
          deviceId: data.deviceId,
        });
      }

      // Turbidity alert (example threshold: > 5 NTU)
      if (data.turbidity != null && data.turbidity > 5) {
        deviceAlerts.push({
          id: `${data._id}-turbidity`,
          type: 'turbidity',
          message: `High turbidity level detected: ${data.turbidity} NTU`,
          timestamp: data.timestamp,
          deviceId: data.deviceId,
        });
      }

      // TDS alert (example threshold: > 1000 ppm)
      if (data.tds != null && data.tds > 1000) {
        deviceAlerts.push({
          id: `${data._id}-tds`,
          type: 'tds',
          message: `High TDS level detected: ${data.tds} ppm`,
          timestamp: data.timestamp,
          deviceId: data.deviceId,
        });
      }

      return [...acc, ...deviceAlerts];
    }, []);

    res.status(200).json(alerts);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ message: 'Server error: Unable to fetch alerts' });
  }
});


router.get('/sensor/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const latestData = await UserSensorData.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: '$deviceId',
          latest: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latest' } },
    ]);
    res.status(200).json(latestData);
  } catch (err) {
    console.error('Error fetching sensor summary:', err);
    res.status(500).json({ message: 'Server error: Unable to fetch sensor summary' });
  }
});


module.exports = router;