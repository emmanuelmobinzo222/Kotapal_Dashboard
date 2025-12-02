// Robust server for Kota Smart Product Platform
const http = require('http');
const url = require('url');

const PORT = 3000;

// Simple in-memory database
let users = [];
let nextId = 1;

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Simple password hashing (for demo purposes)
function simpleHash(password) {
    return Buffer.from(password).toString('base64');
}

function simpleVerify(password, hash) {
    return simpleHash(password) === hash;
}

// Simple JWT-like token (for demo purposes)
function createToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
    try {
        return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
        return null;
    }
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, corsHeaders);
    res.end(JSON.stringify(data));
}

// Helper function to parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const path = parsedUrl.pathname;

    console.log(`${method} ${path}`);

    // Handle preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    try {
        // Route handling
        if (path === '/' && method === 'GET') {
            sendJSON(res, 200, {
                message: 'Kota Smart Product Platform API is running',
                version: '1.0.0',
                status: 'healthy',
                users: users.length,
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (path === '/api/health' && method === 'GET') {
            sendJSON(res, 200, {
                status: 'healthy',
                users: users.length,
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (path === '/api/auth/register' && method === 'POST') {
            const { name, email, password, website, plan = 'starter' } = await parseBody(req);
            
            // Validate required fields
            if (!name || !email || !password) {
                sendJSON(res, 400, { error: 'Name, email, and password are required' });
                return;
            }
            
            // Check if user exists
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                sendJSON(res, 409, { error: 'User with this email already exists' });
                return;
            }

            // Create user
            const newUser = {
                id: `user_${nextId++}`,
                name,
                email,
                password: simpleHash(password),
                website: website || '',
                plan,
                createdAt: new Date().toISOString(),
                affiliateIds: {},
                settings: {
                    notifications: true,
                    theme: 'light'
                }
            };

            users.push(newUser);
            console.log('User registered:', { id: newUser.id, name: newUser.name, email: newUser.email, plan: newUser.plan });

            // Generate token
            const token = createToken(newUser);

            const { password: pwd, ...userWithoutPassword } = newUser;
            sendJSON(res, 201, {
                user: userWithoutPassword,
                token,
                redirectPage: newUser.plan === 'pro' ? 'analytics' : 
                             (newUser.plan === 'creatorplus' ? 'integrations' : 
                             (newUser.plan === 'agency' ? 'integrations' : 'dashboard'))
            });
            return;
        }

        if (path === '/api/auth/login' && method === 'POST') {
            const { email, password } = await parseBody(req);
            
            // Validate required fields
            if (!email || !password) {
                sendJSON(res, 400, { error: 'Email and password are required' });
                return;
            }
            
            // Find user
            const user = users.find(u => u.email === email);
            if (!user) {
                sendJSON(res, 401, { error: 'No account found with this email address' });
                return;
            }

            // Verify password
            if (!simpleVerify(password, user.password)) {
                sendJSON(res, 401, { error: 'Incorrect password for this email address' });
                return;
            }

            console.log('User logged in:', { id: user.id, name: user.name, email: user.email, plan: user.plan });

            // Generate token
            const token = createToken(user);

            const { password: pwd, ...userWithoutPassword } = user;
            sendJSON(res, 200, {
                user: userWithoutPassword,
                token,
                redirectPage: user.plan === 'pro' ? 'analytics' : 
                             (user.plan === 'creatorplus' ? 'integrations' : 
                             (user.plan === 'agency' ? 'integrations' : 'dashboard'))
            });
            return;
        }

        if (path === '/api/user/profile' && method === 'GET') {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            
            if (!token) {
                sendJSON(res, 401, { error: 'Access token required' });
                return;
            }

            const userData = verifyToken(token);
            if (!userData) {
                sendJSON(res, 403, { error: 'Invalid or expired token' });
                return;
            }

            const user = users.find(u => u.id === userData.id);
            if (!user) {
                sendJSON(res, 404, { error: 'User not found' });
                return;
            }

            const { password, ...userWithoutPassword } = user;
            sendJSON(res, 200, userWithoutPassword);
            return;
        }

        if (path === '/api/debug/users' && method === 'GET') {
            sendJSON(res, 200, {
                count: users.length,
                users: users.map(u => ({ 
                    id: u.id, 
                    name: u.name, 
                    email: u.email, 
                    plan: u.plan, 
                    createdAt: u.createdAt 
                }))
            });
            return;
        }

        // 404 for all other routes
        sendJSON(res, 404, { error: 'Not found' });

    } catch (error) {
        console.error('Server error:', error);
        sendJSON(res, 500, { error: 'Internal server error' });
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Robust Kota Server running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('  - GET  /                    - Health check');
    console.log('  - GET  /api/health          - Server status');
    console.log('  - POST /api/auth/register    - User registration');
    console.log('  - POST /api/auth/login      - User login');
    console.log('  - GET  /api/user/profile    - User profile');
    console.log('  - GET  /api/debug/users      - All users (debug)');
    console.log('');
    console.log('✅ Server is ready to accept connections!');
    console.log('🔗 Test the server: http://localhost:3000');
});

// Handle server errors
server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.log('⚠️  Port 3000 is already in use. Please stop the existing server first.');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
