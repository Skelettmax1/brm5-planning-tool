// BRM5 Planner Server - Cloudflare Workers compatible
// Handles authentication, mission management, and storage

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { handleAuth } from './auth.js';
import { handleMissions } from './missions.js';
import { initializeStorage } from './storage.js';

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('src/client'));

// Initialize storage
await initializeStorage();

// Routes
app.use('/api/auth', handleAuth);
app.use('/api/missions', handleMissions);

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile('src/client/index.html', { root: '.' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`BRM5 Planner running on port ${PORT}`);
});

export default app;
