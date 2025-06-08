// models/UserSensorData.js
const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  ph: {
    type: Number,
    default: null,
  },
  turbidity: {
    type: Number,
    default: null,
  },
  tds: {
    type: Number,
    default: null,
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  temperature: {
    type: Number, // °C
    default: null,
  },
  battery: {
    type: Number, // % (0-100)
    default: null,
  },
   capacity: {
    type: Number, // % (0-100)
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('UserSensorData', sensorDataSchema);