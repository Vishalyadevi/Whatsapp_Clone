const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const socketHandler = require('./src/sockets/socket');

// Connect to Database
connectDB();

// Create Server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Socket state
const userSockets = new Map(); // userId -> socketId

// Make io and userSockets accessible in express controllers if needed
app.set('io', io);
app.set('userSockets', userSockets);

// Initialize Socket Events
socketHandler(io, userSockets);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
