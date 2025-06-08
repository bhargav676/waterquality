const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./db/db');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  }, 
});

app.use(cors());
app.use(express.json()); 
app.set('io', io);


console.log('userRoutes type:', typeof userRoutes);
console.log('adminRoutes type:', typeof adminRoutes);


app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);


io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


connectDB();


const PORT = process.env.PORT || 5000;
server.listen(PORT,'0.0.0.0', () => { 
  console.log(`Server running on port ${PORT}`);
});