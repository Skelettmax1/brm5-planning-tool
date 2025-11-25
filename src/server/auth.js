// Authentication handler for BRM5 Planner
// Manages user registration, login, and session management

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStorage, saveUser, getUserByUsername } from './storage.js';

const SECRET_KEY = process.env.JWT_SECRET || 'brm5_secret_key';

export const handleAuth = (req, res, next) => {
    // Registration endpoint
    if (req.method === 'POST' && req.path === '/register') {
        registerUser(req, res);
    }
    // Login endpoint
    else if (req.method === 'POST' && req.path === '/login') {
        loginUser(req, res);
    }
    // Verify token endpoint
    else if (req.method === 'POST' && req.path === '/verify') {
        verifyToken(req, res);
    }
    else {
        res.status(404).json({ error: 'Not Found' });
    }
};

async function registerUser(req, res) {
    try {
        const { username, password, platoon } = req.body;
        
        if (!username || !password || !platoon) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate platoon type
        const validPlatoons = ['Red', 'Green', 'Blue', 'Red_Lieutenant', 'Green_Lieutenant', 'Blue_Lieutenant'];
        if (!validPlatoons.includes(platoon)) {
            return res.status(400).json({ error: 'Invalid platoon type' });
        }

        const storage = await getStorage();
        const existingUser = await getUserByUsername(username);
        
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            password: hashedPassword,
            platoon,
            createdAt: new Date().toISOString()
        };

        await saveUser(newUser);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, platoon: newUser.platoon },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                username: newUser.username,
                platoon: newUser.platoon
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}

async function loginUser(req, res) {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, platoon: user.platoon },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                username: user.username,
                platoon: user.platoon
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

function verifyToken(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ valid: true, user: decoded });

    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
