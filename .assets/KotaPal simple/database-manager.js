// Enhanced Database Manager for KotaPal
// Handles user data storage, authentication, and account management

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'data.json');
        this.data = this.loadDatabase();
    }

    // Load database from JSON file
    loadDatabase() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const fileContent = fs.readFileSync(this.dbPath, 'utf8');
                return JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Error loading database:', error);
        }
        
        // Initialize with default structure
        return {
            users: [],
            blocks: [],
            integrations: [],
            clicks: [],
            analytics: [],
            sessions: []
        };
    }

    // Save database to JSON file
    saveDatabase() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving database:', error);
            return false;
        }
    }

    // User Management Methods
    async createUser(userData) {
        const { name, email, password, plan = 'starter' } = userData;
        
        // Check if user already exists
        if (this.getUserByEmail(email)) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            plan,
            createdAt: new Date().toISOString().split('T')[0],
            lastLogin: null,
            isActive: true,
            affiliateIds: {},
            preferences: {
                notifications: true,
                emailUpdates: true,
                theme: 'light'
            },
            stats: {
                totalBlocks: 0,
                totalClicks: 0,
                totalRevenue: 0,
                lastActivity: null
            }
        };

        this.data.users.push(newUser);
        this.saveDatabase();
        
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            plan: newUser.plan,
            createdAt: newUser.createdAt,
            affiliateIds: newUser.affiliateIds,
            preferences: newUser.preferences,
            stats: newUser.stats
        };
    }

    async authenticateUser(email, password) {
        const user = this.getUserByEmail(email);
        if (!user) {
            throw new Error('No account found with this email address');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Incorrect password for this email address');
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveDatabase();

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            affiliateIds: user.affiliateIds,
            preferences: user.preferences,
            stats: user.stats
        };
    }

    getUserByEmail(email) {
        return this.data.users.find(user => user.email === email);
    }

    getUserById(id) {
        return this.data.users.find(user => user.id === id);
    }

    getAllUsers() {
        return this.data.users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            stats: user.stats
        }));
    }

    // Update user data
    updateUser(userId, updateData) {
        const user = this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Update allowed fields
        const allowedFields = ['name', 'plan', 'affiliateIds', 'preferences'];
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                user[field] = updateData[field];
            }
        });

        user.updatedAt = new Date().toISOString();
        this.saveDatabase();
        
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            affiliateIds: user.affiliateIds,
            preferences: user.preferences,
            stats: user.stats
        };
    }

    // SmartBlocks Management
    createBlock(userId, blockData) {
        const user = this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const newBlock = {
            id: uuidv4(),
            userId,
            title: blockData.title,
            layout: blockData.layout || 'grid',
            ctaText: blockData.ctaText || 'Buy Now',
            products: blockData.products || [],
            retailer: blockData.retailer || 'amazon',
            status: 'active',
            clicks: 0,
            revenue: 0,
            ctr: 0,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        this.data.blocks.push(newBlock);
        
        // Update user stats
        user.stats.totalBlocks = (user.stats.totalBlocks || 0) + 1;
        user.stats.lastActivity = new Date().toISOString();
        
        this.saveDatabase();
        return newBlock;
    }

    getUserBlocks(userId) {
        return this.data.blocks.filter(block => block.userId === userId);
    }

    // Analytics and Click Tracking
    recordClick(userId, blockId, clickData) {
        const click = {
            id: uuidv4(),
            userId,
            blockId,
            timestamp: new Date().toISOString(),
            ip: clickData.ip || 'unknown',
            userAgent: clickData.userAgent || 'unknown',
            referrer: clickData.referrer || 'direct',
            revenue: clickData.revenue || 0
        };

        this.data.clicks.push(click);

        // Update block stats
        const block = this.data.blocks.find(b => b.id === blockId);
        if (block) {
            block.clicks = (block.clicks || 0) + 1;
            block.revenue = (block.revenue || 0) + (clickData.revenue || 0);
            block.lastUpdated = new Date().toISOString();
        }

        // Update user stats
        const user = this.getUserById(userId);
        if (user) {
            user.stats.totalClicks = (user.stats.totalClicks || 0) + 1;
            user.stats.totalRevenue = (user.stats.totalRevenue || 0) + (clickData.revenue || 0);
            user.stats.lastActivity = new Date().toISOString();
        }

        this.saveDatabase();
        return click;
    }

    getUserAnalytics(userId) {
        const user = this.getUserById(userId);
        if (!user) return null;

        const userBlocks = this.getUserBlocks(userId);
        const userClicks = this.data.clicks.filter(click => click.userId === userId);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                plan: user.plan
            },
            stats: {
                totalBlocks: userBlocks.length,
                totalClicks: userClicks.length,
                totalRevenue: userClicks.reduce((sum, click) => sum + (click.revenue || 0), 0),
                activeBlocks: userBlocks.filter(block => block.status === 'active').length
            },
            blocks: userBlocks,
            recentClicks: userClicks.slice(-10).reverse()
        };
    }

    // Database Health Check
    getDatabaseStats() {
        return {
            totalUsers: this.data.users.length,
            activeUsers: this.data.users.filter(user => user.isActive).length,
            totalBlocks: this.data.blocks.length,
            totalClicks: this.data.clicks.length,
            totalRevenue: this.data.clicks.reduce((sum, click) => sum + (click.revenue || 0), 0),
            lastUpdated: new Date().toISOString()
        };
    }

    // Backup and Restore
    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: this.data
        };
        
        const backupPath = path.join(__dirname, `backup_${Date.now()}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        return backupPath;
    }

    // Search functionality
    searchUsers(query) {
        const searchTerm = query.toLowerCase();
        return this.data.users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        ).map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            lastLogin: user.lastLogin
        }));
    }
}

module.exports = DatabaseManager;
