const Device = require('../models/Device');
const SensorData = require('../models/SensorData');

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  } 
};
 
exports.getSensorData = async (req, res) => {
  try {
    const { deviceId } = req.params;  
    const sensorData = await SensorData.find({ deviceId }).sort({ timestamp: -1 }).limit(10); 
    res.json(sensorData);
  } catch (error) { 
    res.status(500).json({ message: 'Server error' });
  }
};

