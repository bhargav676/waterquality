const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  accessId: {
    type: String,
    unique: true,
    default: uuidv4,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user', 
  },
});

module.exports = mongoose.model('User', userSchema);