// Storage handler for BRM5 Planner
// Uses Cloudflare Workers KV-compatible storage

let storage = {
    users: {},
    missions: {}
};

export async function initializeStorage() {
    // In Cloudflare Workers, this would connect to KV
    console.log('Storage initialized');
}

export async function getStorage() {
    return storage;
}

export async function saveUser(user) {
    storage.users[user.username] = user;
    console.log(`User saved: ${user.username}`);
}

export async function getUserByUsername(username) {
    return storage.users[username] || null;
}

export async function saveMission(mission) {
    storage.missions[mission.id] = mission;
    console.log(`Mission saved: ${mission.id}`);
}

export async function getMissionsByPlatoon(platoon) {
    const platoonMissions = Object.values(storage.missions).filter(
        mission => mission.platoon === platoon
    );
    return platoonMissions;
}

export async function updateMission(mission) {
    if (storage.missions[mission.id]) {
        storage.missions[mission.id] = { ...storage.missions[mission.id], ...mission };
        console.log(`Mission updated: ${mission.id}`);
    }
}

export async function deleteMission(missionId) {
    if (storage.missions[missionId]) {
        delete storage.missions[missionId];
        console.log(`Mission deleted: ${missionId}`);
    }
}
