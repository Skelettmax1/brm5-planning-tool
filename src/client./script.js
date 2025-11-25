// BRM5 Planner Client Script
// Handles authentication, mission management, and UI interactions

let currentUser = null;
let currentToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadToken();
    checkAuthStatus();
});

// Load token from localStorage
function loadToken() {
    const token = localStorage.getItem('brm5_token');
    const user = localStorage.getItem('brm5_user');
    
    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
    }
}

// Check authentication status
async function checkAuthStatus() {
    if (currentToken && currentUser) {
        // Verify token
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showPlanner();
            } else {
                clearAuth();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            clearAuth();
        }
    } else {
        showAuth();
    }
}

// Show authentication screen
function showAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('planner-screen').style.display = 'none';
}

// Show planner screen
function showPlanner() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('planner-screen').style.display = 'block';
    
    // Update user info
    document.getElementById('current-user').textContent = currentUser.username;
    document.getElementById('current-platoon').textContent = formatPlatoon(currentUser.platoon);
    
    // Show create section for lieutenants
    const isLieutenant = currentUser.platoon.includes('_Lieutenant');
    document.getElementById('create-section').style.display = isLieutenant ? 'block' : 'none';
    
    // Update missions title
    const platoonColor = getPlatoonColor(currentUser.platoon);
    document.getElementById('missions-title').textContent = `${getPlatoonName(currentUser.platoon)} Missions`;
    document.getElementById('missions-title').style.color = platoonColor;
    
    loadMissions();
}

// Format platoon name for display
function formatPlatoon(platoon) {
    return platoon.replace('_Lieutenant', ' (Lieutenant)');
}

// Get platoon name
function getPlatoonName(platoon) {
    return platoon.replace('_Lieutenant', '');
}

// Get platoon color for styling
function getPlatoonColor(platoon) {
    const basePlatoon = platoon.replace('_Lieutenant', '');
    switch(basePlatoon) {
        case 'Red': return '#ff0055';
        case 'Green': return '#00ff41';
        case 'Blue': return '#0066ff';
        default: return '#ffffff';
    }
}

// Show register form
function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

// Show login form
function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// Register user
async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const platoon = document.getElementById('reg-platoon').value;

    if (!username || !password || !platoon) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, platoon })
        });

        const data = await response.json();

        if (data.success) {
            // Save token and user info
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('brm5_token', currentToken);
            localStorage.setItem('brm5_user', JSON.stringify(currentUser));
            
            showPlanner();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed');
    }
}

// Login user
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Save token and user info
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('brm5_token', currentToken);
            localStorage.setItem('brm5_user', JSON.stringify(currentUser));
            
            showPlanner();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
}

// Logout user
function logout() {
    clearAuth();
    showAuth();
}

// Clear authentication data
function clearAuth() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('brm5_token');
    localStorage.removeItem('brm5_user');
}

// Handle mission type change
document.getElementById('mission-type').addEventListener('change', function() {
    const customGroup = document.getElementById('custom-type-group');
    if (this.value === 'Custom') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
});

// Create new mission
async function createMission() {
    const missionType = document.getElementById('mission-type').value;
    const customType = document.getElementById('custom-type').value;
    const description = document.getElementById('mission-desc').value;
    const date = document.getElementById('mission-date').value;

    let finalType = missionType;
    if (missionType === 'Custom' && customType.trim()) {
        finalType = customType;
    } else if (missionType === 'Custom' && !customType.trim()) {
        alert('Please enter a custom mission type');
        return;
    }

    if (!description.trim()) {
        alert('Please enter a mission description');
        return;
    }

    try {
        const response = await fetch('/api/missions/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                platoon: currentUser.platoon,
                missionType: missionType,
                customType: customType,
                description: description,
                date: date
            })
        });

        const data = await response.json();

        if (data.success) {
            loadMissions();
            // Reset form
            document.getElementById('mission-desc').value = '';
            document.getElementById('mission-date').value = '';
            document.getElementById('custom-type').value = '';
            document.getElementById('custom-type-group').style.display = 'none';
        } else {
            alert(data.error || 'Failed to create mission');
        }
    } catch (error) {
        console.error('Create mission error:', error);
        alert('Failed to create mission');
    }
}

// Load missions for user's platoon
async function loadMissions() {
    if (!currentToken) return;

    try {
        const response = await fetch(`/api/missions/?platoon=${getPlatoonName(currentUser.platoon)}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (data.missions) {
            displayMissions(data.missions);
        }
    } catch (error) {
        console.error('Load missions error:', error);
    }
}

// Display missions in the UI
function displayMissions(missions) {
    const missionsList = document.getElementById('missions-list');
    missionsList.innerHTML = '';

    if (missions.length === 0) {
        missionsList.innerHTML = '<p class="no-missions">No missions available</p>';
        return;
    }

    missions.forEach(mission => {
        const missionItem = document.createElement('div');
        missionItem.className = 'mission-item';
        
        const isLieutenant = currentUser.platoon.includes('_Lieutenant');
        
        missionItem.innerHTML = `
            <h4>${mission.missionType}</h4>
            <div class="mission-details">
                <p><strong>Description:</strong> ${mission.description}</p>
                <p><strong>Date:</strong> ${new Date(mission.date).toLocaleDateString()}</p>
                <p><strong>Created:</strong> ${new Date(mission.createdAt).toLocaleString()}</p>
            </div>
            ${isLieutenant ? `
            <div class="mission-actions">
                <button class="action-btn" onclick="editMission('${mission.id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteMission('${mission.id}')">Delete</button>
            </div>
            ` : ''}
        `;
        
        missionsList.appendChild(missionItem);
    });
}

// Edit mission
function editMission(missionId) {
    // This would open the edit modal with mission data
    // For simplicity, we'll just alert the ID
    alert(`Edit mission: ${missionId}`);
    // In a real implementation, you would populate the modal with mission data
    // and handle the save functionality
}

// Delete mission
async function deleteMission(missionId) {
    if (!confirm('Are you sure you want to delete this mission?')) {
        return;
    }

    try {
        const response = await fetch(`/api/missions/${missionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            loadMissions();
        } else {
            alert('Failed to delete mission');
        }
    } catch (error) {
        console.error('Delete mission error:', error);
        alert('Failed to delete mission');
    }
}

// Modal functions
function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function saveEdit() {
    // Implementation for saving edited mission
    closeModal();
}

// Handle custom type visibility for edit modal too
document.getElementById('edit-mission-type').addEventListener('change', function() {
    const customGroup = document.getElementById('edit-custom-group');
    if (this.value === 'Custom') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
});
