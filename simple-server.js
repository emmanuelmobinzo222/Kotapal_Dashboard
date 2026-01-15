// Simple server to test connection
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

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const path = parsedUrl.pathname;

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Handle preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Route handling
    if (path === '/' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            message: 'Kota Smart Product Platform API is running',
            version: '1.0.0',
            status: 'healthy',
            users: users.length
        }));
        return;
    }

    if (path === '/api/health' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'healthy',
            users: users.length,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    if (path === '/api/auth/register' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { name, email, password, website, plan = 'starter' } = JSON.parse(body);
                
                // Check if user exists
                const existingUser = users.find(u => u.email === email);
                if (existingUser) {
                    res.writeHead(409);
                    res.end(JSON.stringify({ error: 'User with this email already exists' }));
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

                // Generate token
                const token = createToken(newUser);

                const { password: pwd, ...userWithoutPassword } = newUser;
                res.writeHead(201);
                res.end(JSON.stringify({
                    user: userWithoutPassword,
                    token,
                    redirectPage: newUser.plan === 'pro' ? 'analytics' : 
                                 (newUser.plan === 'creatorplus' ? 'integrations' : 
                                 (newUser.plan === 'agency' ? 'integrations' : 'dashboard'))
                }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    if (path === '/api/auth/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                
                // Find user
                const user = users.find(u => u.email === email);
                if (!user) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: 'No account found with this email address' }));
                    return;
                }

                // Verify password
                if (!simpleVerify(password, user.password)) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: 'Incorrect password for this email address' }));
                    return;
                }

                // Generate token
                const token = createToken(user);

                const { password: pwd, ...userWithoutPassword } = user;
                res.writeHead(200);
                res.end(JSON.stringify({
                    user: userWithoutPassword,
                    token,
                    redirectPage: user.plan === 'pro' ? 'analytics' : 
                                 (user.plan === 'creatorplus' ? 'integrations' : 
                                 (user.plan === 'agency' ? 'integrations' : 'dashboard'))
                }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    if (path === '/api/user/profile' && method === 'GET') {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
        }

        const userData = verifyToken(token);
        if (!userData) {
            res.writeHead(403);
            res.end(JSON.stringify({ error: 'Invalid or expired token' }));
            return;
        }

        const user = users.find(u => u.id === userData.id);
        if (!user) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
        }

        const { password, ...userWithoutPassword } = user;
        res.writeHead(200);
        res.end(JSON.stringify(userWithoutPassword));
        return;
    }

    if (path === '/api/debug/users' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
            count: users.length,
            users: users.map(u => ({ 
                id: u.id, 
                name: u.name, 
                email: u.email, 
                plan: u.plan, 
                createdAt: u.createdAt 
            }))
        }));
        return;
    }

    // 404 for all other routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`🚀 Simple Kota Server running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('  - GET  /                    - Health check');
    console.log('  - GET  /api/health          - Server status');
    console.log('  - POST /api/auth/register    - User registration');
    console.log('  - POST /api/auth/login      - User login');
    console.log('  - GET  /api/user/profile    - User profile');
    console.log('  - GET  /api/debug/users      - All users (debug)');
    console.log('');
    console.log('✅ Server is ready to accept connections!');
});

// Handle server errors
server.on('error', (err) => {
    console.error('❌ Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
