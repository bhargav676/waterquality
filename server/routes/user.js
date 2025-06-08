const express = require('express');
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
    const data = await UserSensorData.find({ userId: req.user.userId });
    res.status(200).json(data);
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


module.exports = router;