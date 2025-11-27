// Enhanced Backend Server for KotaPal with Advanced Database Management
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const DatabaseManager = require('./database-manager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kotapal-secret-key-2024';

// Initialize Database Manager
const db = new DatabaseManager();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.options('*', cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Input validation
const validateFields = (rules, data) => {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
        if (rule.required && (!data[field] || data[field].toString().trim() === '')) {
            errors.push(`${field} is required`);
        }
        if (data[field] && rule.maxLength && data[field].length > rule.maxLength) {
            errors.push(`${field} must be less than ${rule.maxLength} characters`);
        }
        if (data[field] && rule.type && typeof data[field] !== rule.type) {
            errors.push(`${field} must be a ${rule.type}`);
        }
    }
    return errors;
};

// Sanitize string input
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    const stats = db.getDatabaseStats();
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: stats
    });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, website, plan = 'starter' } = req.body;

        // Validate input
        const errors = validateFields({
            name: { required: true, type: 'string', maxLength: 120 },
            email: { required: true, type: 'string', maxLength: 200 },
            password: { required: true, type: 'string', maxLength: 200 }
        }, { name, email, password });

        if (errors.length) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        // Sanitize inputs
        const sanitizedData = {
            name: sanitizeString(name),
            email: sanitizeString(email),
            password,
            website: website ? sanitizeString(website) : '',
            plan
        };

        // Create user
        const user = await db.createUser(sanitizedData);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, plan: user.plan },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Determine redirect page based on plan
        const redirectPage = plan === 'pro' ? 'analytics' : 
                           (plan === 'creatorplus' ? 'integrations' : 
                           (plan === 'agency' ? 'integrations' : 'dashboard'));

        res.status(201).json({
            user,
            token,
            redirectPage
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        const errors = validateFields({
            email: { required: true, type: 'string', maxLength: 200 },
            password: { required: true, type: 'string', maxLength: 200 }
        }, { email, password });

        if (errors.length) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        // Authenticate user
        const user = await db.authenticateUser(email, password);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, plan: user.plan },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Determine redirect page based on plan
        const redirectPage = user.plan === 'pro' ? 'analytics' : 
                           (user.plan === 'creatorplus' ? 'integrations' : 
                           (user.plan === 'agency' ? 'integrations' : 'dashboard'));

        res.json({
            user,
            token,
            redirectPage
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const user = db.getUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            affiliateIds: user.affiliateIds,
            preferences: user.preferences,
            stats: user.stats
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const { name, plan, affiliateIds, preferences } = req.body;
        
        const updatedUser = db.updateUser(req.user.userId, {
            name,
            plan,
            affiliateIds,
            preferences
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({ error: error.message });
    }
});

// SmartBlocks Management
app.get('/api/blocks', authenticateToken, (req, res) => {
    try {
        const blocks = db.getUserBlocks(req.user.userId);
        res.json(blocks);
    } catch (error) {
        console.error('Get blocks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/blocks', authenticateToken, (req, res) => {
    try {
        const block = db.createBlock(req.user.userId, req.body);
        res.status(201).json(block);
    } catch (error) {
        console.error('Create block error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Analytics
app.get('/api/analytics', authenticateToken, (req, res) => {
    try {
        const analytics = db.getUserAnalytics(req.user.userId);
        res.json(analytics);
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Click tracking
app.post('/api/clicks', (req, res) => {
    try {
        const { userId, blockId, ...clickData } = req.body;
        const click = db.recordClick(userId, blockId, clickData);
        res.status(201).json(click);
    } catch (error) {
        console.error('Record click error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Admin endpoints (for database management)
app.get('/api/admin/users', authenticateToken, (req, res) => {
    try {
        // Check if user is admin (you can implement admin role checking)
        const users = db.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/stats', authenticateToken, (req, res) => {
    try {
        const stats = db.getDatabaseStats();
        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search users
app.get('/api/admin/search', authenticateToken, (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }
        const results = db.searchUsers(q);
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create database backup
app.post('/api/admin/backup', authenticateToken, (req, res) => {
    try {
        const backupPath = db.createBackup();
        res.json({ 
            message: 'Backup created successfully',
            backupPath: path.basename(backupPath)
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Enhanced KotaPal API server running on port ${PORT}`);
    console.log(`📊 Database: ${db.getDatabaseStats().totalUsers} users, ${db.getDatabaseStats().totalBlocks} blocks`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
