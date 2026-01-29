const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

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

// API endpoints for messages
app.get('/api/messages', (req, res) => {
    res.json({ messages });
});

app.post('/api/messages', (req, res) => {
    const { username, text } = req.body;
    if (!username || !text) {
        return res.status(400).json({ error: 'Username and text required' });
    }
    const message = {
        id: Date.now() + Math.random(),
        username,
        text,
        timestamp: Date.now()
    };
    messages.push(message);
    // Keep only last MAX_MESSAGES
    if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
    }
    res.json({ success: true, message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
