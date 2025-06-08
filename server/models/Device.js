// models/Device.js
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  lastActive: { type: Date, default: null },
  temperature: { type: Number, default: null }, // °C
  battery: { type: Number, default: null },
  capacity: { type: Number, default: null }, // %
});

deviceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Device', deviceSchema);