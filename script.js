// DOM Elements
const testScreen = document.getElementById('test-screen');
const resultsScreen = document.getElementById('results-screen');
const scoreboardScreen = document.getElementById('scoreboard-screen');
const characterEl = document.getElementById('character');
const currentScoreEl = document.getElementById('current-score');
const scoreboardListEl = document.getElementById('scoreboard-list');

// Buttons
const nextBtn = document.getElementById('next-btn');
const cantSeeBtn = document.getElementById('cant-see-btn');
const restartBtn = document.getElementById('restart-btn');
const viewScoreboardBtn = document.getElementById('view-scoreboard-btn');
const testAgainBtn = document.getElementById('test-again-btn');
const backToResultsBtn = document.getElementById('back-to-results-btn');
const clearScoresBtn = document.getElementById('clear-scores-btn');

// Constants
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 120;
const STORAGE_KEY = 'eyesightTestScores';

// Size reduction strategies
const STRATEGIES = {
    LINEAR: {
        name: 'Linear',
        decrement: (size) => Math.max(MIN_FONT_SIZE, size - (size >= 20 ? 5 : size >= 10 ? 2 : 1))
    },
    SNELLEN: {
        name: 'Snellen Chart',
        decrement: (size) => Math.max(MIN_FONT_SIZE, size * 0.8) // Approximately 0.1 logMAR steps
    },
    GEOMETRIC: {
        name: 'Geometric',
        decrement: (size) => Math.max(MIN_FONT_SIZE, Math.floor(size * 0.9))
    }
};

// Default strategy
let currentStrategy = STRATEGIES.SNELLEN;

// State
let currentFontSize = MAX_FONT_SIZE;
let score = 0;
let scores = loadScores();
let lastFontSize = 0; // Keep track of last visible font size

// Functions
function generateRandomChar() {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    return CHARS[randomIndex];
}

function displayChar() {
    const char = generateRandomChar();
    characterEl.textContent = char;
    characterEl.style.fontSize = `${currentFontSize}px`;
}

function decreaseFontSize() {
    lastFontSize = currentFontSize;
    currentFontSize = currentStrategy.decrement(currentFontSize);
    
    // Round to 1 decimal place for better precision
    currentFontSize = Math.round(currentFontSize * 10) / 10;
}

function resetTest() {
    currentFontSize = MAX_FONT_SIZE;
    score = 0;
    displayChar();
}

function showScreen(screen) {
    [testScreen, resultsScreen, scoreboardScreen].forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

function saveScore() {
    const newScore = {
        date: new Date().toLocaleString(),
        score: score,
        lastVisibleSize: lastFontSize,
        strategy: currentStrategy.name
    };
    
    scores.push(newScore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function loadScores() {
    const storedScores = localStorage.getItem(STORAGE_KEY);
    return storedScores ? JSON.parse(storedScores) : [];
}

function renderScoreboard() {
    scoreboardListEl.innerHTML = '';
    
    if (scores.length === 0) {
        scoreboardListEl.innerHTML = '<p>No scores yet.</p>';
        return;
    }
    
    // Sort scores by date (newest first)
    scores.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    scores.forEach(scoreItem => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-item';
        
        scoreElement.innerHTML = `
            <div class="date">${scoreItem.date}</div>
            <div class="score-details">
                <div class="score">${scoreItem.score} characters</div>
                <div class="size">Last visible: ${scoreItem.lastVisibleSize || 'N/A'}px</div>
                ${scoreItem.strategy ? `<div class="strategy">Method: ${scoreItem.strategy}</div>` : ''}
            </div>
        `;
        
        scoreboardListEl.appendChild(scoreElement);
    });
}

// Add strategy selector to the UI
function addStrategySelector() {
    const container = document.createElement('div');
    container.className = 'strategy-selector';
    container.innerHTML = `
        <p>Testing method:</p>
        <select id="strategy-select">
            <option value="SNELLEN">Snellen Chart (Recommended)</option>
            <option value="GEOMETRIC">Geometric Decrease</option>
            <option value="LINEAR">Linear Decrease</option>
        </select>
    `;
    
    testScreen.insertBefore(container, document.querySelector('.buttons'));
    
    // Add event listener
    document.getElementById('strategy-select').addEventListener('change', (e) => {
        currentStrategy = STRATEGIES[e.target.value];
        resetTest();
    });
}

// Event Listeners
nextBtn.addEventListener('click', () => {
    score++;
    decreaseFontSize();
    displayChar();
});

cantSeeBtn.addEventListener('click', () => {
    currentScoreEl.textContent = score;
    
    // Add information about the smallest size they could see
    const resultInfo = document.createElement('p');
    resultInfo.innerHTML = `Smallest visible size: <strong>${lastFontSize}px</strong>`;
    
    // Replace existing info or add new
    const existingInfo = resultsScreen.querySelector('.size-info');
    if (existingInfo) {
        existingInfo.replaceWith(resultInfo);
    } else {
        resultsScreen.insertBefore(resultInfo, document.getElementById('view-scoreboard-btn'));
    }
    resultInfo.className = 'size-info';
    
    saveScore();
    showScreen(resultsScreen);
});

restartBtn.addEventListener('click', () => {
    resetTest();
});

viewScoreboardBtn.addEventListener('click', () => {
    renderScoreboard();
    showScreen(scoreboardScreen);
});

testAgainBtn.addEventListener('click', () => {
    resetTest();
    showScreen(testScreen);
});

backToResultsBtn.addEventListener('click', () => {
    showScreen(resultsScreen);
});

clearScoresBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all scores?')) {
        scores = [];
        localStorage.removeItem(STORAGE_KEY);
        renderScoreboard();
    }
});

// Initialize
addStrategySelector();
resetTest();
