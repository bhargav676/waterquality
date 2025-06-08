const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');


router.post('/ingest', async (req, res) => {
  const {
    deviceId, // This is the key from ESP, e.g., "ESP001"
    latitude,
    longitude,
    ph,
    turbidity,
    temperature,
    tds,
    conductivity,
    // timestamp from ESP is ignored by default if SensorData has default: Date.now
  } = req.body;

  // Basic Validation
  if (!deviceId || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Missing or invalid required fields: deviceId (string), latitude (number), or longitude (number)' });
  }

  try {
    // --- Part 1: Upsert Device Document ---
    // Define what fields to set if the document is new (on insert)
    const fieldsOnInsert = {
      deviceId: deviceId, // Set the unique deviceId from ESP
      name: `Device ${deviceId}`, // Default name for a new device
      // We can also set initial location/latest values here,
      // but $set below will cover them for both new and existing docs.
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      latestPh: ph,
      latestTurbidity: turbidity,
      latestTemperature: temperature,
      latestTds: tds,
      latestConductivity: conductivity,
      lastReportedAt: new Date(),
    };

    // Define what fields to update if the document already exists (or on insert too)
    const fieldsToSet = {
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      lastReportedAt: new Date(),
      latestPh: ph,
      latestTurbidity: turbidity,
      latestTemperature: temperature,
      latestTds: tds,
      latestConductivity: conductivity,
      // Note: We don't try to $set deviceId here because it's part of the query
      // and $setOnInsert handles it for new documents.
    };

    const updatedOrNewDevice = await Device.findOneAndUpdate(
      { deviceId: deviceId }, // The query condition: find a device with this deviceId
      {
        $set: fieldsToSet,         // Fields to always update (or set if new)
        $setOnInsert: fieldsOnInsert // Fields to set ONLY if a new document is created
      },
      {
        upsert: true,        // If no document matches, create a new one
        new: true,           // Return the modified document (or new one)
        runValidators: true, // Ensure schema validations are run
      }
    );

    if (!updatedOrNewDevice) {
      // This case should ideally not be hit if upsert:true is working with findOneAndUpdate
      // unless there's a deeper issue or a race condition not handled by MongoDB's atomicity.
      return res.status(500).json({ message: 'Failed to update or create device.' });
    }

    // --- Part 2: Create Historical SensorData Document ---
    const sensorReadingPayload = {
      device: updatedOrNewDevice._id, // Link to the Device's MongoDB ObjectId
      ph: ph,
      turbidity: turbidity,
      temperature: temperature,
      tds: tds,
      conductivity: conductivity,
      // If your ESP sends a timestamp and you want to use it:
      // timestamp: new Date(req.body.timestamp), // Ensure it's a valid Date
    };

    const newSensorData = new SensorData(sensorReadingPayload);
    await newSensorData.save();

    res.status(201).json({
      message: 'Data ingested successfully',
      device: updatedOrNewDevice,
      reading: newSensorData
    });

  } catch (error) {
    console.error('Error ingesting data:', error);
    if (error.code === 11000) { // Specifically handle duplicate key errors
      return res.status(409).json({
        message: 'Duplicate key error. This often means a unique constraint was violated.',
        errorDetails: {
          collection: error.message.includes("devices") ? "devices" : error.message.includes("sensordatas") ? "sensordatas" : "unknown",
          keyPattern: error.keyPattern,
          keyValue: error.keyValue,
          fullError: error.message
        }
      });
    }
    res.status(500).json({ message: 'Server error while ingesting data', error: error.message });
  }
});

// Endpoint for the admin dashboard to get device locations and latest data for the map
// GET /api/sensors/devices-for-map
router.get('/devices-for-map', async (req, res) => {
  try {
    const devices = await Device.find({},
      'deviceId name location latestPh latestTurbidity latestTemperature latestTds latestConductivity lastReportedAt'
    );
    res.status(200).json(devices);
  } catch (error) {
    console.error('Error fetching devices for map:', error);
    res.status(500).json({ message: 'Server error while fetching devices' });
  }
});

// Endpoint for ESP to fetch static/dynamic configuration
// GET /api/sensors/esp-config
router.get('/esp-config', (req, res) => {
  const espDeviceId = req.query.deviceId; // ESP can optionally send its ID

  // Example: Default configuration
  let config = {
    firmwareVersion: "1.0.2-demo",
    reportingIntervalSeconds: 60, // Default: report every 60 seconds
    sensorEnableFlags: {
      ph: true,
      turbidity: true,
      temperature: true,
      tds: true,
      conductivity: true
    },
    alertThresholds: {
      ph_low: 6.5,
      ph_high: 8.5,
      turbidity_high: 30
    },
    message: "Default configuration loaded."
  };

  // Example: Device-specific configuration (you would fetch this from DB or a config file)
  if (espDeviceId === "ESP_UNIQUE_ID_001") {
    config.reportingIntervalSeconds = 30;
    config.message = "Special config for ESP_UNIQUE_ID_001 loaded.";
    config.sensorEnableFlags.temperature = false; // Disable temp for this specific device
  }

  res.status(200).json(config);
});


router.get('/readings/:deviceIdParam', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceIdParam });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const readings = await SensorData.find({ device: device._id })
                                     .sort({ timestamp: -1 })
                                     .limit(100); // Example limit

    res.status(200).json({ device, readings });
  } catch (error) {
    console.error(`Error fetching readings for device ${req.params.deviceIdParam}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;