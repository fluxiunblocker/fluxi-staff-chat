const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for messages (demo)
let messages = [];
const MAX_MESSAGES = 1000;

// Load users
let users = [];
function loadUsers() {
    try {
        const data = fs.readFileSync(path.join(__dirname, '../public/users.json'), 'utf8');
        users = JSON.parse(data).users;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}
loadUsers();

// Save users
function saveUsers() {
    try {
        fs.writeFileSync(path.join(__dirname, '../public/users.json'), JSON.stringify({ users }, null, 2));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

// API endpoints for user management
app.get('/api/users', (req, res) => {
    res.json({ users });
});

app.post('/api/users', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    users.push({ username, password });
    saveUsers();
    res.json({ success: true });
});

app.delete('/api/users/:username', (req, res) => {
    const { username } = req.params;
    if (username === 'admin') {
        return res.status(400).json({ error: 'Cannot delete admin user' });
    }
    const index = users.findIndex(u => u.username === username);
    if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    users.splice(index, 1);
    saveUsers();
    res.json({ success: true });
});

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
