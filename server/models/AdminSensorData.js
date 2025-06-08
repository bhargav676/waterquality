const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  ph: { type: Number, required: true },
  turbidity: { type: Number, required: true },
  tds: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AdminSensorData', sensorDataSchema);