let quizData;
let timerInterval; // To store the interval ID
let buzzerSound = new Audio("Audios/Buzzer.wav"); // Path to the buzzer sound
let correctSound = new Audio("Audios/correct-6033.wav"); // Path to the correct answer sound
let tick = new Audio("Audios/30S.mp3");
let warntick = new Audio("Audios/warn.wav");
let timef = new Audio("Audios/timeup.mp3")
let timePassedSound = new Audio("Audios/timeup.mp3");
let pausedTime = 0; // Store the remaining time when paused

// Add these variables at the top with other global variables
let questionHistory = {};
let currentCategory = '';
let currentQuestionIndex = 0;
let teamScoredQuestions = JSON.parse(localStorage.getItem('teamScoredQuestions')) || {}; // Track scored questions per team
let scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || []; // Log of all score changes

// Broadcast state to admin panel
function broadcastState() {
  const state = {
    currentCategory,
    currentQuestionIndex,
    isTimerRunning: !!timerInterval,
    timerValue: document.getElementById("timer") ? document.getElementById("timer").innerText : "0 S",
    currentQuestion: currentCategory && quizData ? quizData.categories[currentCategory][currentQuestionIndex] : null
  };
  localStorage.setItem('quizState', JSON.stringify(state));
}

// Listen for commands from Admin Panel
window.addEventListener('storage', (e) => {
  if (e.key === 'quizCommand') {
    const command = JSON.parse(e.newValue);
    if (!command) return;

    console.log("Received command:", command.type, command.payload);

    switch (command.type) {
      case 'START_TIMER':
        startTimer(command.payload.seconds, timeUp, command.payload.type);
        break;
      case 'PAUSE_TIMER':
        pauseTimer();
        break;
      case 'RESUME_TIMER':
        resumeTimer();
        break;
      case 'RESET_TIMER':
        clearInterval(timerInterval);
        document.getElementById("timer").innerText = "0 S";
        tick.pause();
        warntick.pause();
        break;
      case 'SHOW_ANSWER':
        const q = quizData.categories[currentCategory][currentQuestionIndex];
        displayAnswer(q.correctAnswer, true);
        break;
      case 'PLAY_SOUND':
        if (command.payload.sound === 'buzzer') buzzerSound.play();
        if (command.payload.sound === 'correct') correctSound.play();
        if (command.payload.sound === 'timeup') timef.play();
        break;
      case 'NAVIGATE_NEXT':
        // Logic to go to next question would need to be robust
        // For now, relies on manually selecting in Admin or implementing specific next logic
        break;
      case 'RELOAD_PAGE':
        location.reload();
        break;
    }
  }
});


// Fetch JSON data (Database for the quiz)
fetch("quiz_data.json")
  .then((response) => response.json())
  .then((data) => {
    quizData = data;
    displayCategories();
  })
  .catch((error) => console.error("Error loading quiz data:", error));


// Display categories on the home page
function displayCategories() {
  const categoriesDiv = document.getElementById("categories");
  const categoriesTitle = document.getElementById("categoriesTitle");
  categoriesDiv.innerHTML = ''; // Clear existing content

  // Show the categories title
  if (categoriesTitle) {
    categoriesTitle.style.display = 'block';
  }

  // Add admin link
  const adminLink = document.createElement("a");
  adminLink.href = "admin.html";
  adminLink.className = "admin-link";
  adminLink.innerHTML = '<i class="fas fa-cog"></i> Admin Dashboard';
  categoriesDiv.appendChild(adminLink);

  // Add quiz finished button
  const quizFinishedBtn = document.createElement("button");
  quizFinishedBtn.id = "quizFinishedBtn";
  quizFinishedBtn.className = "quiz-finished-btn";
  quizFinishedBtn.innerHTML = '<i class="fas fa-trophy"></i> Show Winners';
  quizFinishedBtn.onclick = showWinnersModal;
  categoriesDiv.appendChild(quizFinishedBtn);

  // Add completion status section
  const completionSection = document.createElement("div");
  completionSection.className = "completion-section";

  // Get completed categories
  const categories = Object.keys(quizData.categories);
  const completedCategories = categories.filter(category => isCategoryCompleted(category));

  if (completedCategories.length > 0) {
    completionSection.innerHTML = `
      <div class="completion-info">
        <i class="fas fa-check-circle"></i>
        <span>Completed Categories: ${completedCategories.length}/${categories.length}</span>
      </div>
    `;
  }

  categoriesDiv.appendChild(completionSection);

  categories.forEach((category) => {
    const categoryButton = document.createElement("button");
    categoryButton.className = "category-button";

    // Add completion status to the button
    if (isCategoryCompleted(category)) {
      categoryButton.classList.add('category-completed');
    }

    categoryButton.innerHTML = `
      ${category}
      ${isCategoryCompleted(category) ? '<i class="fas fa-check"></i>' : ''}
    `;

    categoryButton.addEventListener("click", () => {
      displayQuestionNumbers(category);
    });

    categoriesDiv.appendChild(categoryButton);
  });
}

// Add function to check if category is completed
function isCategoryCompleted(category) {
  const categoryQuestions = quizData.categories[category];
  const totalQuestions = categoryQuestions.length;
  let answeredQuestions = 0;

  categoryQuestions.forEach((_, index) => {
    if (questionHistory[`${category}-${index}`] !== undefined) {
      answeredQuestions++;
    }
  });

  return answeredQuestions === totalQuestions;
}

// Display question numbers for a selected category
function displayQuestionNumbers(category) {
  const categoriesDiv = document.getElementById("categories");
  const categoriesTitle = document.getElementById("categoriesTitle");
  categoriesDiv.innerHTML = ''; // Clear existing content

  // Hide the categories title
  if (categoriesTitle) {
    categoriesTitle.style.display = 'none';
  }

  // Add back button to return to categories
  const backButton = document.createElement("button");
  backButton.id = "backbtn"
  backButton.className = "back-button";
  backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Categories';
  backButton.addEventListener("click", displayCategories);
  categoriesDiv.appendChild(backButton);

  // Add category title
  const categoryTitle = document.createElement("h2");
  categoryTitle.innerText = category;
  categoryTitle.className = "category-title";
  categoriesDiv.appendChild(categoryTitle);

  // Create container for question buttons
  const questionButtonsContainer = document.createElement("div");
  questionButtonsContainer.className = "question-buttons-container";

  // Get stored button colors
  const questionButtonColors = getQuestionButtonColors();

  quizData.categories[category].forEach((_, index) => {
    const questionButton = document.createElement("button");
    questionButton.innerText = `${index + 1}`;
    questionButton.className = "question-number-button";

    // Add status indicator if question was answered
    if (questionHistory[`${category}-${index}`]) {
      const status = questionHistory[`${category}-${index}`];
      questionButton.classList.add(status ? 'answered-correct' : 'answered-wrong');
    }

    // Restore previously set button color if exists
    const buttonColorKey = `${category}-${index}`;
    if (questionButtonColors[buttonColorKey]) {
      questionButton.style.backgroundColor = questionButtonColors[buttonColorKey].backgroundColor;
      questionButton.style.color = questionButtonColors[buttonColorKey].color;
    }

    questionButton.addEventListener("click", function () {
      // Set and store button color
      questionButton.style.backgroundColor = "#4CAF50";
      questionButton.style.color = "#ffffff";

      // Store the color for this specific question button
      questionButtonColors[buttonColorKey] = {
        backgroundColor: "#4CAF50",
        color: "#ffffff"
      };

      // Save to localStorage
      setQuestionButtonColors(questionButtonColors);

      loadQuestion(category, index);
    });

    questionButtonsContainer.appendChild(questionButton);
  });

  categoriesDiv.appendChild(questionButtonsContainer);
}

// Load a question dynamically
function loadQuestion(category, index) {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("questionPage").style.display = "block";

  const question = quizData.categories[category][index];
  document.getElementById("questionTitle").innerText = question.question;

  // Load question image and audio with error handling
  const questionImage = document.getElementById("questionImage");
  if (question.image) {
    questionImage.src = question.image;
    questionImage.style.display = "block";
    questionImage.onerror = () => (questionImage.style.display = "none"); // Error handling
  } else {
    questionImage.style.display = "none";
  }

  // Load question audio and play instantly
  const questionAudio = document.getElementById("questionAudio");
  if (question.audio) {
    questionAudio.src = question.audio;
    questionAudio.style.display = "block";
    questionAudio.play().catch(() => (questionAudio.style.display = "none")); // Error handling
  } else {
    questionAudio.style.display = "none";
    questionAudio.pause(); // Stop any previously playing audio
  }

  // Clear previous answer display
  const answerDisplay = document.getElementById("answerDisplay");
  answerDisplay.style.display = "none";
  answerDisplay.innerText = "";

  // Reset timer
  clearInterval(timerInterval);

  // Start the first timer automatically (30 seconds) and set it to stop on clicking other timers
  document.getElementById("firstTimerButton").onclick = () =>
    startTimer(30, () => timeUp(), "first");

  document.getElementById("secondTimerButton").onclick = () =>
    startTimer(15, () => timeUp(), "second");

  document.getElementById("thirdTimerButton").onclick = () =>
    startTimer(10, () => timeUp(), "third");

  document.getElementById("forthTimerButton").onclick = () =>
    startTimer(90, () => timeUp(), "forth");

  document.getElementById("firstTimerButton").click();

  // Disable the timer buttons until clicked
  document.getElementById("firstTimerButton").disabled = false;
  document.getElementById("secondTimerButton").disabled = false;
  document.getElementById("thirdTimerButton").disabled = false;
  document.getElementById("forthTimerButton").disabled = false;

  // Add back button to return to question numbers
  const backToQuestionsButton = document.createElement("button");
  backToQuestionsButton.id = 'backquestion'
  backToQuestionsButton.className = "back-button";
  backToQuestionsButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Questions';
  backToQuestionsButton.addEventListener("click", () => {
    document.getElementById("homePage").style.display = "block";
    document.getElementById("questionPage").style.display = "none";
    displayQuestionNumbers(category);
  });

  // Add the back button to the question header
  const questionHeader = document.querySelector(".question-header");
  questionHeader.insertBefore(backToQuestionsButton, questionHeader.firstChild);

  currentCategory = category;
  currentQuestionIndex = index;

  broadcastState(); // Notify admin of new state

  // Show answer after timer ends
  timeUp = () => {
    const timerElement = document.querySelector('span#timer');
    if (timerElement) {
      timerElement.innerHTML = "Time finished";
    }
    const data = {
      timerElementInnerHTML: timerElement ? timerElement.innerHTML : null
    }
    timef.play();
    decision = 1;

  };

  // Set a timer to check if score was given
  setTimeout(checkScoreGiven, 30000); // Check after 30 seconds
}

// Display the correct answer or incorrect message
function displayAnswer(correctAnswer, isCorrect = true) {
  clearInterval(timerInterval); // Stop the timer
  const answerDisplay = document.getElementById("answerDisplay");
  answerDisplay.style.display = "block";

  if (isCorrect) {
    answerDisplay.innerHTML = `
      <div class="answer-content correct">
        <h3>Answer:</h3>
        <p>${correctAnswer}</p>
      </div>
    `;
    correctSound.play();
    showSuccessAnimation();
  } else {
    answerDisplay.innerHTML = `
      <div class="answer-content incorrect">
        <h3>Incorrect!</h3>
      </div>
    `;
    buzzerSound.play();
    showFailureAnimation();
  }

  // Save question status
  const currentQuestion = `${currentCategory}-${currentQuestionIndex}`;
  questionHistory[currentQuestion] = isCorrect;
  saveProgress();
}

// Start the timer and handle button switching
function startTimer(seconds, timeUpCallback, timerType) {
  broadcastState(); // Notify admin
  const timerDiv = document.getElementById("timer");
  const notification = document.getElementById('timerNotification');

  // Hide notification when starting new timer
  if (notification) {
    notification.style.display = 'none';
  }

  timerDiv.innerText = `${seconds} S`;

  // Stop any currently running timer
  clearInterval(timerInterval);
  tick.pause();
  tick.currentTime = 0;
  warntick.pause();
  warntick.currentTime = 0;

  let timeLeft = seconds;
  tick.play();

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDiv.innerText = `${timeLeft} S`;

    if (timeLeft <= 4) {
      tick.currentTime = 0;
      warntick.play();
    }


    if (timeLeft <= 1) {
      clearInterval(timerInterval);
      tick.pause();
      tick.currentTime = 0;
      warntick.pause();
      warntick.currentTime = 0;
      timeUpCallback();
    }
  }, 1000);

  // Update button appearance
  document.getElementById("firstTimerButton").style.backgroundColor =
    timerType === "first" ? "#e0a800" : "#ffc107";
  document.getElementById("secondTimerButton").style.backgroundColor =
    timerType === "second" ? "#e0a800" : "#ffc107";
  document.getElementById("thirdTimerButton").style.backgroundColor =
    timerType === "third" ? "#e0a800" : "#ffc107";
  document.getElementById("forthTimerButton").style.backgroundColor =
    timerType === "forth" ? "#e0a800" : "#ffc107";
}

// Function to pause timer
function pauseTimer() {
  broadcastState(); // Notify admin
  clearInterval(timerInterval);
  tick.pause();
  warntick.pause();

  // Store the remaining time
  const timerDiv = document.getElementById("timer");
  const timeText = timerDiv.innerText;
  pausedTime = parseInt(timeText);
}

// Function to resume timer
function resumeTimer() {
  if (pausedTime > 0) {
    startTimer(pausedTime, timeUp, "first"); // Resume with the stored time
    pausedTime = 0; // Reset stored time
  }
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function (event) {
  // Only handle shortcuts when on question page
  if (document.getElementById("questionPage").style.display === "block") {
    switch (event.key) {
      case 'c':
        // Show correct answer when 'c' is pressed
        const currentQuestion = quizData.categories[currentCategory][currentQuestionIndex];
        displayAnswer(currentQuestion.correctAnswer, true);
        break;
      case 'i':
        // Show incorrect when 'i' is pressed
        displayAnswer(null, false);
        break;
      case '0':
        // Pause timer when '0' is pressed
        pauseTimer();
        break;
      case '5':
        // Resume timer when '5' is pressed
        resumeTimer();
        break;
      case "1": // Key 1 for the first timer
        document.getElementById("firstTimerButton").click();
        break;
      case "2": // Key 2 for the second timer
        document.getElementById("secondTimerButton").click();
        break;
      case "3": // Key 3 for the third timer
        document.getElementById("thirdTimerButton").click();
        break;
      case "4": // key 4 for the forth timer in case sth goes wrong
        document.getElementById("forthTimerButton").click();
        break;
      case "p": //key for buzzer
        buzzerSound.play();
        break;
      case "n":
        window.location.href = "/NationalA/National.html";
        break;
      case "q":
        window.location.href = "index.html";
        break;
      case "a":
        window.location.href = "admin.html";
        break;
      case "f":
        document.getElementById("quizFinishedBtn").click();
        break;
      case 'b':
        document.getElementById('backquestion').click()
        tick.pause()
        warntick.pause()
        break;

      // To go one setp back from the singel category displaying page
      case 'v':
        document.getElementById('backbtn').click()
        tick.pause()
        warntick.pause()
    }
  }
});

// Handle time-up scenario
// Replace your existing timeUp function with this one
function timeUp() {

  const timerElement = document.querySelector('span#timer');
  if (timerElement) {
    timerElement.innerHTML = "Time finished";
  }
  const data = {
    timerElementInnerHTML: timerElement ? timerElement.innerHTML : null
  }
  decision = 1;
  clearInterval(timerInterval);

  // Stop and reset audio
  tick.pause();
  tick.currentTime = 0;
  warntick.pause();
  warntick.currentTime = 0;

  // Play time's up sound
  timef.play();

  // Show the time finished message
  const timeFinish = document.getElementById("timefinish");
  timeFinish.textContent = "Time is Finished!";
  timeFinish.classList.add('show');

  // Hide the message after 3 seconds
  setTimeout(() => {
    timeFinish.classList.remove('show');
    timeFinish.textContent = '';
  }, 3000);

  // Update timer display
  const timerDiv = document.getElementById("timer");
  timerDiv.innerText = "0 S";

  displayAnswer(null, false);
}

// Function to update team scores display and buttons
function updateTeamScoresDisplay() {
  const teams = JSON.parse(localStorage.getItem('quizTeams')) || [];

  // Update team buttons
  const teamButtonsContainer = document.querySelector('.team-scoring-groups');
  if (teamButtonsContainer) {
    teamButtonsContainer.innerHTML = ''; // Clear existing buttons

    teams.forEach((team) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'team-score-group';

      const nameBtn = document.createElement('button');
      nameBtn.className = 'team-name-btn';
      nameBtn.textContent = team.name;
      groupDiv.appendChild(nameBtn);

      const button5 = document.createElement('button');
      button5.className = 'score-btn';
      button5.textContent = '5';
      button5.onclick = () => awardPoints(team.id, 5);
      groupDiv.appendChild(button5);

      const button10 = document.createElement('button');
      button10.className = 'score-btn';
      button10.textContent = '10';
      button10.onclick = () => awardPoints(team.id, 10);
      groupDiv.appendChild(button10);

      teamButtonsContainer.appendChild(groupDiv);
    });
  }
}

// Function to award points to teams
function awardPoints(teamId, points) {
  const questionKey = `${currentCategory}_${currentQuestionIndex}`;
  const teamKey = `team${teamId}`;

  // Initialize team's scored questions if not exists
  if (!teamScoredQuestions[teamKey]) {
    teamScoredQuestions[teamKey] = {};
  }

  // Check if this team has already scored for this question
  if (teamScoredQuestions[teamKey][questionKey]) {
    alert(`Team ${teamId} has already scored for this question!`);
    return;
  }

  // Get teams from localStorage
  let teams = JSON.parse(localStorage.getItem('quizTeams')) || [];

  // Find the team
  const team = teams.find(t => t.id === teamId);
  if (!team) {
    console.warn('Team not found in localStorage');
    return;
  }

  // Update the team's score
  team.score = (team.score || 0) + points;
  localStorage.setItem('quizTeams', JSON.stringify(teams));

  // Mark question as scored for this team
  teamScoredQuestions[teamKey][questionKey] = true;
  localStorage.setItem('teamScoredQuestions', JSON.stringify(teamScoredQuestions));

  // Add to history log
  const logEntry = {
    timestamp: new Date().toISOString(),
    teamId: teamId,
    teamName: team.name,
    points: points,
    reason: `Question: ${currentCategory} - Q${currentQuestionIndex + 1}`,
    action: 'ADD'
  };
  scoreHistory.push(logEntry);
  localStorage.setItem('scoreHistory', JSON.stringify(scoreHistory));

  // Show notification
  showPointsNotification(teamId, points);

  // Play success sound
  correctSound.play();

  // Update the display
  updateTeamScoresDisplay();
}

// Function to deduct points (Negative Marking)
function deductPoints(teamId, points) {
  let teams = JSON.parse(localStorage.getItem('quizTeams')) || [];
  const team = teams.find(t => t.id === teamId);

  if (!team) return;

  // Update score
  team.score = (team.score || 0) - points;
  localStorage.setItem('quizTeams', JSON.stringify(teams));

  // Add to history log
  const logEntry = {
    timestamp: new Date().toISOString(),
    teamId: teamId,
    teamName: team.name,
    points: -points,
    reason: `Deduction: ${currentCategory} - Q${currentQuestionIndex + 1}`,
    action: 'DEDUCT'
  };
  scoreHistory.push(logEntry);
  localStorage.setItem('scoreHistory', JSON.stringify(scoreHistory));

  showPointsNotification(teamId, -points);
  updateTeamScoresDisplay();
}

// Function to show points notification
function showPointsNotification(teamId, points) {
  // Get teams from localStorage
  const teams = JSON.parse(localStorage.getItem('quizTeams')) || [];
  const team = teams.find(t => t.id === teamId);

  if (!team) {
    console.warn('Team not found in localStorage');
    return;
  }

  // Remove any existing notification
  const existingNotification = document.querySelector('.points-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create new notification
  const notification = document.createElement('div');
  notification.className = 'points-notification';
  notification.textContent = `${points} points awarded to ${team.name}!`;

  // Add to document
  document.body.appendChild(notification);

  // Remove notification after animation completes
  setTimeout(() => {
    notification.remove();
  }, 2500);
}

// Function to check if score is given after question display
function checkScoreGiven() {
  const questionKey = `${currentCategory}_${currentQuestionIndex}`;
  const teams = JSON.parse(localStorage.getItem('quizTeams')) || [];

  // Check if any team has scored for this question
  const anyTeamScored = teams.some(team => {
    const teamKey = `team${team.id}`;
    return teamScoredQuestions[teamKey] && teamScoredQuestions[teamKey][questionKey];
  });

  if (!anyTeamScored) {
    alert('Please remember to award points for this question!');
  }
}

// Modify resetGame to clear scored questions from localStorage
function resetGame() {
  if (confirm('Are you sure you want to reset the game? This will clear all progress and scores.')) {
    localStorage.clear();
    questionHistory = {};
    teamScoredQuestions = {};
    scoreHistory = [];

    // Refresh the display to remove colored buttons
    if (typeof displayCategories === 'function') {
      displayCategories();
    }
  }
}

// Global variable to track question button colors using localStorage
function getQuestionButtonColors() {
  const colors = localStorage.getItem('questionButtonColors');
  return colors ? JSON.parse(colors) : {};
}

function setQuestionButtonColors(colors) {
  localStorage.setItem('questionButtonColors', JSON.stringify(colors));
}

function showSuccessAnimation() {
  const animator = document.createElement('div');
  animator.className = 'success-animation';
  document.body.appendChild(animator);
  setTimeout(() => animator.remove(), 1500);
}

function showFailureAnimation() {
  const animator = document.createElement('div');
  animator.className = 'failure-animation';
  document.body.appendChild(animator);
  setTimeout(() => animator.remove(), 1500);
}

// Go back to the home page
function goHome() {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("questionPage").style.display = "none";
  tick.pause();
  warntick.pause();
  clearInterval(timerInterval); // Stop the timer when returning home
  const questionAudio = document.getElementById("questionAudio");
  questionAudio.pause(); // Pause any playing audio
}

document.getElementById("homeButton").onclick = goHome;

// Load progress when the page loads
document.addEventListener('DOMContentLoaded', loadProgress);

//Refreshing Home when first time the page is loaded
for (let index = 0; index < 1; index++) {
  document.getElementById("homeButton").click()

}

document.addEventListener("DOMContentLoaded", () => {
  // Add keyboard shortcuts for timers
  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "1": // Key 1 for the first timer
        document.getElementById("firstTimerButton").click();
        break;
      case "2": // Key 2 for the second timer
        document.getElementById("secondTimerButton").click();
        break;
      case "3": // Key 3 for the third timer
        document.getElementById("thirdTimerButton").click();
        break;
      case "4": // key 4 for the forth timer in case sth goes wrong
        document.getElementById("forthTimerButton").click();
        break;
      case "c": // key c for correct answer
        tick.pause();
        warntick.pause();
        break;
      case "0": // Pausing time for audience
        clearInterval(timerInterval);
        tick.pause();
        warntick.pause();
        break;
      case "i": //key v for incorrect answer
        tick.pause();
        warntick.pause();
        break;
      case "h": //key for incorrect button
        document.getElementById("homeButton").click();
        tick.pause();
        warntick.pause();
        break;
      case "p": //key for buzzer
        buzzerSound.play();
        break;
      case "n":
        window.location.href = "/NationalA/National.html";
        break;
      case "q":
        window.location.href = "index.html";
        break;
      case "a":
        window.location.href = "admin.html";
        break;
      case "f":
        document.getElementById("quizFinishedBtn").click();
        break;
      case 'b':
        document.getElementById('backquestion').click()
        tick.pause()
        warntick.pause()
        break;

      // To go one setp back from the singel category displaying page
      case 'v':
        document.getElementById('backbtn').click()
        tick.pause()
        warntick.pause()
      case 'v':
        document.getElementById('backbtn').click()
        tick.pause()
        warntick.pause()
    }
  });


  // Initial render of scoreboard
  updateMainScoreboard();

  // Leaderboard Modal Logic
  const leaderboardModal = document.getElementById('leaderboardModal');
  const showLeaderboardBtn = document.getElementById('showLeaderboardBtn');
  const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');

  if (showLeaderboardBtn) {
    showLeaderboardBtn.addEventListener('click', () => {
      leaderboardModal.style.display = 'flex';
      updateMainScoreboard(); // Refresh scores when opening
    });
  }

  if (closeLeaderboardBtn) {
    closeLeaderboardBtn.addEventListener('click', () => {
      leaderboardModal.style.display = 'none';
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
      leaderboardModal.style.display = 'none';
    }
  });
});

// Function to update the main page scoreboard
function updateMainScoreboard() {
  const scoreboardGrid = document.getElementById('mainPageScoreboard');
  if (!scoreboardGrid) return; // Not on home page or element missing

  const teams = JSON.parse(localStorage.getItem('quizTeams')) || [];

  // Sort teams by score
  const sortedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));

  if (sortedTeams.length === 0) {
    scoreboardGrid.innerHTML = '<p style="color: #aaa;">Waiting for teams...</p>';
    return;
  }

  scoreboardGrid.innerHTML = sortedTeams.map(team => `
        <div class="live-score-item glass-morphism">
            <span class="live-team-name">${team.name}</span>
            <span class="live-team-score">${team.score || 0}</span>
        </div>
    `).join('');
}

// Update scoreboard when storage changes
window.addEventListener('storage', (e) => {
  if (e.key === 'quizTeams') {
    updateMainScoreboard();
  }
});

// Update handleIncorrectAnswer function
function handleIncorrectAnswer() {
  buzzerSound.play();

  // Save question status
  const currentQuestion = `${currentCategory}-${currentQuestionIndex}`;
  questionHistory[currentQuestion] = false;

  // Save progress to localStorage
  saveProgress();

  // Show failure animation
  showFailureAnimation();
}

// Update saveProgress function
function saveProgress() {
  const progress = {
    history: questionHistory
  };
  localStorage.setItem('quizProgress', JSON.stringify(progress));
}

// Update loadProgress function
function loadProgress() {
  const progress = localStorage.getItem('quizProgress');
  if (progress) {
    const data = JSON.parse(progress);
    questionHistory = data.history || {};
  }

  // Ensure button colors are preserved when loading progress
  const savedQuestionButtonColors = getQuestionButtonColors();
  if (Object.keys(savedQuestionButtonColors).length > 0) {
    // Optionally, you can add a method to restore colors if needed
    // This might involve re-rendering categories or question buttons
  }
}

// Function to show winners modal with confetti
function showWinnersModal() {
  const teams = JSON.parse(localStorage.getItem('quizTeams')) || [];

  // Sort teams by score in descending order
  const sortedTeams = teams.sort((a, b) => b.score - a.score);

  // Get top 3 teams
  const winners = sortedTeams.slice(0, 3);

  // Create winners list HTML
  const winnersListHTML = winners.map((team, index) => {
    const position = ['first', 'second', 'third'][index];
    const medal = ['🥇', '🥈', '🥉'][index];
    return `
      <div class="winner-item">
        <div class="winner-position ${position}">${index + 1}</div>
        <div class="winner-details">
          <div class="winner-name">${team.name} ${medal}</div>
          <div class="winner-score">Score: ${team.score}</div>
        </div>
      </div>
    `;
  }).join('');

  // Update modal content
  document.getElementById('winnersList').innerHTML = winnersListHTML;

  // Show modal and overlay
  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('winnersModal').classList.add('show');

  // Create confetti
  createConfetti();
}

// Function to create confetti effect
function createConfetti() {
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffbe0b'];

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(confetti);

    // Remove confetti after animation
    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }
}

// Function to close winners modal
function closeWinnersModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('winnersModal').classList.remove('show');
}

// Close modal when clicking overlay
document.getElementById('modalOverlay').addEventListener('click', closeWinnersModal);

// Close modal when clicking overlay
document.getElementById('modalOverlay').addEventListener('click', closeWinnersModal);

document.addEventListener('DOMContentLoaded', () => {
  updateTeamScoresDisplay();
  loadProgress();
});

// Listen for storage changes
window.addEventListener('storage', function (e) {
  if (e.key === 'quizTeams') {
    updateTeamScoresDisplay();
  }
});

// Auto-refresh scores every 2 seconds
setInterval(updateTeamScoresDisplay, 2000);

// Add score animation style
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes scoreUpdated {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .score-updated {
    animation: scoreUpdated 0.5s ease-out;
  }
`, styleSheet.cssRules.length);

document.getElementById("resetButton").onclick = resetGame;
