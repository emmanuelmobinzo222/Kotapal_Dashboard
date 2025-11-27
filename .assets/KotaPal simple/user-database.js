// Simple Database System for User Storage
class UserDatabase {
    constructor() {
        this.databaseKey = 'kotapal_users_db';
        this.users = this.loadUsers();
    }

    // Load users from localStorage or create empty database
    loadUsers() {
        try {
            const stored = localStorage.getItem(this.databaseKey);
            if (stored) {
                const data = JSON.parse(stored);
                console.log('✅ Database loaded:', data.users.length, 'users');
                return data.users || [];
            }
        } catch (e) {
            console.log('Error loading database:', e);
        }
        console.log('🆕 Creating new database');
        return [];
    }

    // Save users to localStorage
    saveUsers() {
        try {
            const data = {
                users: this.users,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem(this.databaseKey, JSON.stringify(data));
            console.log('✅ Database saved:', this.users.length, 'users');
            return true;
        } catch (e) {
            console.error('Error saving database:', e);
            return false;
        }
    }

    // Create new user
    createUser(userData) {
        try {
            // Check if user already exists
            const existingUser = this.findUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create user object
            const newUser = {
                id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: userData.name,
                email: userData.email.toLowerCase().trim(),
                password: userData.password,
                website: userData.website || '',
                plan: userData.plan || 'starter',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                settings: userData.settings || { notifications: true, theme: 'light' }
            };

            // Add to database
            this.users.push(newUser);
            
            // Save database
            if (this.saveUsers()) {
                console.log('✅ User created successfully:', newUser.email);
                return newUser;
            } else {
                throw new Error('Failed to save user to database');
            }
        } catch (e) {
            console.error('Error creating user:', e);
            throw e;
        }
    }

    // Find user by email
    findUserByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        return this.users.find(user => user.email === normalizedEmail);
    }

    // Authenticate user (login)
    authenticateUser(email, password) {
        try {
            const user = this.findUserByEmail(email);
            if (!user) {
                throw new Error('User not found');
            }

            if (user.password !== password) {
                throw new Error('Invalid password');
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers();

            console.log('✅ User authenticated successfully:', user.email);
            return user;
        } catch (e) {
            console.error('Authentication error:', e);
            throw e;
        }
    }

    // Get all users (for debugging)
    getAllUsers() {
        return this.users;
    }

    // Get user count
    getUserCount() {
        return this.users.length;
    }

    // Clear database (for testing)
    clearDatabase() {
        this.users = [];
        localStorage.removeItem(this.databaseKey);
        console.log('🗑️ Database cleared');
    }

    // Export database (for backup)
    exportDatabase() {
        return {
            users: this.users,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Import database (for restore)
    importDatabase(data) {
        try {
            if (data.users && Array.isArray(data.users)) {
                this.users = data.users;
                this.saveUsers();
                console.log('✅ Database imported successfully:', this.users.length, 'users');
                return true;
            } else {
                throw new Error('Invalid database format');
            }
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
}

// Create global database instance
window.userDB = new UserDatabase();

// Debug functions for console
window.debugDB = {
    showUsers: () => {
        console.log('=== USER DATABASE ===');
        console.log('Total users:', window.userDB.getUserCount());
        console.log('Users:', window.userDB.getAllUsers());
    },
    clearDB: () => {
        window.userDB.clearDatabase();
        console.log('Database cleared');
    },
    exportDB: () => {
        const data = window.userDB.exportDatabase();
        console.log('Exported data:', data);
        return data;
    }
};

console.log('✅ User Database System Initialized');
console.log('Available commands:');
console.log('- debugDB.showUsers() - Show all users');
console.log('- debugDB.clearDB() - Clear database');
console.log('- debugDB.exportDB() - Export database');
