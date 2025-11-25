// Mission management handler for BRM5 Planner
// Handles mission creation, editing, and retrieval

import { getStorage, saveMission, getMissionsByPlatoon, updateMission, deleteMission } from './storage.js';

export const handleMissions = async (req, res, next) => {
    try {
        // Get missions for user's platoon
        if (req.method === 'GET' && req.path === '/') {
            await getMissions(req, res);
        }
        // Create new mission
        else if (req.method === 'POST' && req.path === '/') {
            await createMission(req, res);
        }
        // Update mission
        else if (req.method === 'PUT' && req.path.startsWith('/')) {
            await updateMissionHandler(req, res);
        }
        // Delete mission
        else if (req.method === 'DELETE' && req.path.startsWith('/')) {
            await deleteMissionHandler(req, res);
        }
        else {
            res.status(404).json({ error: 'Not Found' });
        }
    } catch (error) {
        console.error('Mission handler error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

async function getMissions(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token (simplified for this example)
        // In real implementation, use JWT verification
        
        const userPlatoon = req.query.platoon;
        if (!userPlatoon) {
            return res.status(400).json({ error: 'Platoon required' });
        }

        const missions = await getMissionsByPlatoon(userPlatoon);
        res.json({ missions });

    } catch (error) {
        console.error('Get missions error:', error);
        res.status(500).json({ error: 'Failed to get missions' });
    }
}

async function createMission(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const { platoon, missionType, customType, description, date } = req.body;
        
        if (!platoon || !missionType) {
            return res.status(400).json({ error: 'Platoon and mission type required' });
        }

        // Validate platoon (lieutenant can only create for their platoon)
        const validPlatoons = ['Red', 'Green', 'Blue', 'Red_Lieutenant', 'Green_Lieutenant', 'Blue_Lieutenant'];
        if (!validPlatoons.includes(platoon)) {
            return res.status(400).json({ error: 'Invalid platoon' });
        }

        // Determine actual platoon (remove _Lieutenant suffix)
        const actualPlatoon = platoon.replace('_Lieutenant', '');

        const newMission = {
            id: Date.now().toString(),
            platoon: actualPlatoon,
            missionType: missionType === 'Custom' ? customType : missionType,
            description,
            date: date || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        await saveMission(newMission);
        res.json({ success: true, mission: newMission });

    } catch (error) {
        console.error('Create mission error:', error);
        res.status(500).json({ error: 'Failed to create mission' });
    }
}

async function updateMissionHandler(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const missionId = req.params.id || req.path.split('/')[1];
        const { platoon, missionType, customType, description, date } = req.body;

        const updatedMission = {
            id: missionId,
            platoon: platoon.replace('_Lieutenant', ''),
            missionType: missionType === 'Custom' ? customType : missionType,
            description,
            date: date || new Date().toISOString()
        };

        await updateMission(updatedMission);
        res.json({ success: true, mission: updatedMission });

    } catch (error) {
        console.error('Update mission error:', error);
        res.status(500).json({ error: 'Failed to update mission' });
    }
}

async function deleteMissionHandler(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const missionId = req.params.id || req.path.split('/')[1];
        
        await deleteMission(missionId);
        res.json({ success: true });

    } catch (error) {
        console.error('Delete mission error:', error);
        res.status(500).json({ error: 'Failed to delete mission' });
    }
}
