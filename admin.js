// Team Management
let teams = JSON.parse(localStorage.getItem('quizTeams')) || [];

// Add storage event listener for real-time updates
window.addEventListener('storage', function (e) {
    if (e.key === 'quizTeams') {
        teams = JSON.parse(e.newValue) || [];
        updateTeamsList();
        updateScoreboard();
    }
});

function addTeam(name, members) {
    const teamId = teams.length + 1; // Use sequential IDs for compatibility
    teams.push({
        id: teamId,
        name: name,
        members: members,
        score: 0
    });
    saveTeams();
    updateTeamsList();
    updateScoreboard();
}

function removeTeam(id) {
    teams = teams.filter(team => team.id !== id);
    saveTeams();
    updateTeamsList();
    updateScoreboard();
}

function saveTeams() {
    localStorage.setItem('quizTeams', JSON.stringify(teams));
}

function updateTeamName(teamId, newName) {
    const team = teams.find(t => t.id === teamId);
    if (team) {
        team.name = newName;
        saveTeams();
        updateScoreboard();
    }
}

function updateTeamMembers(teamId, newMembers) {
    const team = teams.find(t => t.id === teamId);
    if (team) {
        team.members = newMembers;
        saveTeams();
    }
}

function updateTeamsList() {
    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '';

    teams.forEach(team => {
        const teamElement = document.createElement('div');
        teamElement.className = 'team-item';
        teamElement.innerHTML = `
            <div class="team-info">
                <div class="team-name">
                    <input type="text" class="team-name-input" value="${team.name}" 
                           onchange="updateTeamName(${team.id}, this.value)">
                </div>
                <div class="team-members">
                    <input type="text" class="team-members-input" value="${team.members}"
                           onchange="updateTeamMembers(${team.id}, this.value)">
                </div>
                <div class="team-score">
                    Score: 
                    <input type="number" class="score-input" value="${team.score || 0}" 
                           onchange="updateTeamScore(${team.id}, this.value)"
                           min="0">
                </div>
            </div>
            <div class="team-actions">
                <button class="admin-btn" onclick="removeTeam(${team.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        teamsList.appendChild(teamElement);
    });
}

function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = '';

    // Sort teams by score in descending order
    const sortedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));

    sortedTeams.forEach(team => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-item';
        scoreElement.innerHTML = `
            <span class="score-team">${team.name}</span>
            <span class="score-value">${team.score || 0} points</span>
        `;
        scoreboard.appendChild(scoreElement);
    });
}

function updateTeamScore(teamId, newScore) {
    // Convert score to number and ensure it's not negative
    newScore = Math.max(0, parseInt(newScore) || 0);

    // Find and update the team's score
    const team = teams.find(t => t.id === teamId);
    if (team) {
        team.score = newScore;
        saveTeams();
        updateScoreboard();

        // Log manual update
        addToHistory(teamId, team.name, newScore - (team.score - newScore), "Manual Update", "UPDATE");

        // Show success message
        showMessage('Score updated successfully!', 'success');
    }
}

function addToHistory(teamId, teamName, points, reason, action) {
    let history = JSON.parse(localStorage.getItem('scoreHistory')) || [];
    history.push({
        timestamp: new Date().toISOString(),
        teamId,
        teamName,
        points,
        reason,
        action
    });
    localStorage.setItem('scoreHistory', JSON.stringify(history));
    updateHistoryLog();
}

function showMessage(text, type = 'success') {
    const message = document.createElement('div');
    message.className = `admin-message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);

    // Remove message after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Event Listeners
document.getElementById('teamForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('teamName');
    const membersInput = document.getElementById('teamMembers');

    addTeam(nameInput.value, membersInput.value);

    nameInput.value = '';
    membersInput.value = '';
});

// Reset game functionality
document.getElementById('resetButton').addEventListener('click', function () {
    if (confirm('Are you sure you want to reset all game progress? This action cannot be undone!')) {
        // Clear all stored progress
        localStorage.clear();
        teams = [];

        // Show success message
        const message = document.createElement('div');
        message.className = 'admin-message success';
        message.textContent = 'Game reset successfully!';
        document.body.appendChild(message);

        // Remove message after 2 seconds
        setTimeout(() => message.remove(), 2000);

        // Refresh team list and scoreboard
        updateTeamsList();
        updateScoreboard();
    }
});

// Initialize the dashboard
updateTeamsList();
updateScoreboard();

// Auto-refresh scoreboard every 2 seconds
setInterval(() => {
    const storedTeams = JSON.parse(localStorage.getItem('quizTeams')) || [];
    if (JSON.stringify(teams) !== JSON.stringify(storedTeams)) {
        teams = storedTeams;
        updateTeamsList();
        updateScoreboard();
    }
}, 2000);

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "q": // Redirect to the homepage
                window.location.href = "index.html";
                break;
        }
    });

    // Start monitoring loop
    monitorLoop();
    updateHistoryLog();
});

// --- Live Control Room Logic ---

function sendCommand(type, payload = {}) {
    const command = {
        id: Date.now(),
        type: type,
        payload: payload
    };
    localStorage.setItem('quizCommand', JSON.stringify(command));

    // Clear command after a brief delay to allow re-sending same command
    setTimeout(() => {
        // We don't actually need to clear it, but modifying the ID ensures the next identical command triggers the event
    }, 100);
}

// Monitor State
function monitorLoop() {
    setInterval(() => {
        const stateStr = localStorage.getItem('quizState');
        if (stateStr) {
            const state = JSON.parse(stateStr);
            updateMonitorUI(state);
        }
    }, 500); // Check every 500ms
}

function updateMonitorUI(state) {
    document.getElementById('monitorCategory').textContent = state.currentCategory || 'None';

    // Improve question display
    let questionText = '-';
    if (state.currentQuestion) {
        questionText = `Q${state.currentQuestionIndex + 1}: ${state.currentQuestion.question.substring(0, 30)}...`;
    }
    document.getElementById('monitorQuestion').textContent = questionText;

    document.getElementById('monitorTimer').textContent = state.timerValue || '0 S';

    // Update active class based on timer
    const controlSection = document.querySelector('.active-monitor');
    if (state.isTimerRunning) {
        controlSection.style.borderColor = '#ffc107'; // Yellow when running
        controlSection.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.2)';
    } else {
        controlSection.style.borderColor = '#4CAF50';
        controlSection.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.2)';
    }
}

// History Log
window.addEventListener('storage', function (e) {
    if (e.key === 'scoreHistory') {
        updateHistoryLog();
    }
});

function updateHistoryLog() {
    const history = JSON.parse(localStorage.getItem('scoreHistory')) || [];
    // Sort by timestamp desc
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const container = document.getElementById('historyLogContainer'); // We need to add this container to HTML
    if (!container) return; // Guard clause

    container.innerHTML = history.map(entry => `
        <div class="log-item">
            <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
            <div class="log-details">
                <strong>${entry.teamName}</strong>: 
                <span class="log-action ${entry.action}">${entry.points > 0 ? '+' : ''}${entry.points}</span>
                <span class="log-reason">(${entry.reason})</span>
            </div>
        </div>
    `).join('');
}
