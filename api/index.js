const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for messages (demo)
let messages = [];
const MAX_MESSAGES = 1000;

// Socket.IO
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send existing messages
    socket.emit('load_messages', messages);

    // Handle new message
    socket.on('send_message', (data) => {
        const message = {
            id: Date.now() + Math.random(),
            username: data.username || 'Anonymous',  // Save username
            text: data.text,
            timestamp: Date.now()
        };

        messages.push(message);

        // Keep only last MAX_MESSAGES
        if (messages.length > MAX_MESSAGES) {
            messages = messages.slice(-MAX_MESSAGES);
        }

        // Broadcast
        io.emit('new_message', message);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
