const express = require('express');
const router = express.Router();
const { getDevices, getSensorData } = require('../controllers/deviceController');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');

router.get('/devices', getDevices);
router.get('/sensor-data/:deviceId', getSensorData);
router.post('/sensor-data', async (req, res) => {
  const { deviceId, ph, turbidity, tds, latitude, longitude } = req.body;

  try {
    
    if (!deviceId || !ph || !turbidity || !tds || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await Device.findOneAndUpdate( 
      { deviceId },
      {
        deviceId,
        name: `Water Monitor ${deviceId}`,
        location: { type: 'Point', coordinates: [longitude, latitude] },
      },
      { upsert: true }
    );

    // Save sensor data
    const sensorData = new SensorData({ deviceId, ph, turbidity, tds });
    await sensorData.save();

    res.status(201).json({ message: 'Data saved' });
  } catch (error) {
    console.error('POST /sensor-data error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;