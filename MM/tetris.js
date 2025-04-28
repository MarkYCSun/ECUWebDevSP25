const canvas = document.getElementById('tetris');
const nextPieceCanvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const nextContext = nextPieceCanvas.getContext('2d');
const BLOCK_SIZE = 30;
const ROWS = 20;
const COLS = 11;

// Set up next piece preview canvas
nextPieceCanvas.width = 120;
nextPieceCanvas.height = 120;
document.getElementById('next-piece').appendChild(nextPieceCanvas);
nextContext.scale(30, 30);

// Scale blocks to fit canvas
context.scale(BLOCK_SIZE, BLOCK_SIZE);

// Tetromino colors
const COLORS = [
    null,
    '#FF0000', // I - Red
    '#00FF00', // J - Green
    '#0000FF', // L - Blue
    '#FFFF00', // O - Yellow
    '#FF00FF', // S - Magenta
    '#00FFFF', // T - Cyan
    '#FFA500', // Z - Orange
];

// Tetromino shapes
const PIECES = [
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
    ],
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
    ],
    [
        [4, 4],
        [4, 4],
    ],
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
    ],
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
    ],
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
];

// Game state variables
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let paused = false;
let currentDifficulty = null;
let lastScoreThreshold = 0;
let level = 1;
let nextPiece = null;

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    next: null
};

const arena = createMatrix(COLS, ROWS);

// Audio handling
const bgm = document.getElementById('bgm');
const moveSound = document.getElementById('move-sound');
const rotateSound = document.getElementById('rotate-sound');
const dropSound = document.getElementById('drop-sound');
const lineClearSound = document.getElementById('line-clear');
const gameOverSound = document.getElementById('game-over');
const soundToggle = document.getElementById('sound-toggle');

let isMuted = localStorage.getItem('tetris-muted') === 'true';
let hasInteracted = false;

// Sound control functions
function updateSoundButton() {
    soundToggle.textContent = isMuted ? '🔈' : '🔊';
    soundToggle.classList.toggle('muted', isMuted);
    
    // Update all audio elements
    [bgm, moveSound, rotateSound, dropSound, lineClearSound, gameOverSound].forEach(audio => {
        audio.muted = isMuted;
    });
}

function toggleSound() {
    isMuted = !isMuted;
    localStorage.setItem('tetris-muted', isMuted);
    updateSoundButton();
    
    if (!isMuted && !hasInteracted) {
        startAudio();
    }
}

// Set initial volume levels
function initializeAudio() {
    bgm.volume = 0.3;
    moveSound.volume = 0.5;
    rotateSound.volume = 0.5;
    dropSound.volume = 0.5;
    lineClearSound.volume = 0.6;
    gameOverSound.volume = 0.6;
}

// Function to play sound with error handling
function playSound(sound) {
    if (!isMuted && hasInteracted) {
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.log('Audio playback error:', error);
        });
    }
}

// Function to start audio after user interaction
function startAudio() {
    hasInteracted = true;
    if (!isMuted) {
        bgm.play().catch(error => {
            console.log('Background music playback error:', error);
        });
    }
}

// Event listeners for user interaction
const interactionEvents = ['click', 'keydown', 'touchstart'];
interactionEvents.forEach(event => {
    document.addEventListener(event, function startUserInteraction() {
        if (!hasInteracted) {
            startAudio();
        }
        interactionEvents.forEach(e => {
            document.removeEventListener(e, startUserInteraction);
        });
    }, { once: true });
});

// Initialize audio and update sound button
initializeAudio();
updateSoundButton();
soundToggle.addEventListener('click', toggleSound);

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'IJLOSTZ';
    
    // If there's no next piece, create both current and next
    if (!player.next) {
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
        player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    } else {
        // Use the next piece as current and create new next piece
        player.matrix = player.next;
        player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
                   
    // Draw the next piece preview
    drawNext();
    
    if (collide(arena, player)) {
        showGameOver();
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function createPiece(type) {
    if (type === 'T') {
        return PIECES[5];
    } else if (type === 'O') {
        return PIECES[3];
    } else if (type === 'L') {
        return PIECES[2];
    } else if (type === 'J') {
        return PIECES[1];
    } else if (type === 'I') {
        return PIECES[0];
    } else if (type === 'S') {
        return PIECES[4];
    } else if (type === 'Z') {
        return PIECES[6];
    }
}

function arenaSweep() {
    let rowCount = 1;
    let rowsCleared = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        rowsCleared++;
        player.score += rowCount * 100;
        rowCount *= 2;
        updateSpeed();
    }
    if (rowsCleared > 0) {
        playSound(lineClearSound);
        updateScore();
    }
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
    drawNext();
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Draw the main block
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Draw block border
                context.strokeStyle = '#FFFFFF';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                
                // Add inner shading for 3D effect
                context.fillStyle = 'rgba(255, 255, 255, 0.2)';
                context.fillRect(x + offset.x, y + offset.y, 0.1, 0.1);
                context.fillStyle = 'rgba(0, 0, 0, 0.2)';
                context.fillRect(x + offset.x + 0.9, y + offset.y + 0.9, 0.1, 0.1);
            }
        });
    });
}

function drawNext() {
    // Clear next piece preview area
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, 4, 4);
    
    if (player.next) {
        // Center the piece in the preview
        const offset = {
            x: (4 - player.next[0].length) / 2,
            y: (4 - player.next.length) / 2
        };
        
        player.next.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    nextContext.fillStyle = COLORS[value];
                    nextContext.fillRect(
                        x + offset.x,
                        y + offset.y,
                        1, 1
                    );
                    nextContext.strokeStyle = '#FFF';
                    nextContext.lineWidth = 0.05;
                    nextContext.strokeRect(
                        x + offset.x,
                        y + offset.y,
                        1, 1
                    );
                }
            });
        });
    }
}

function updateScore() {
    document.getElementById('score').textContent = player.score;
    updateLeaderboard(true);
}

function update(time = 0) {
    if (paused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    draw();
    requestAnimationFrame(update);
}

// Leaderboard functionality
let leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard')) || [];
let lastSubmittedScore = null;
let currentGameEntry = null;

function formatScore(score) {
    return score.toString().padStart(6, '0');
}

function updateLeaderboard(isLiveUpdate = false) {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    // Create a temporary leaderboard including current game if score > 0
    let displayLeaderboard = [...leaderboard];
    
    if (isLiveUpdate && player.score > 0) {
        // Create or update current game entry
        currentGameEntry = {
            name: '>>>',
            score: player.score,
            isCurrent: true
        };
        
        // Add current game to display leaderboard
        displayLeaderboard.push(currentGameEntry);
    }
    
    // Sort and limit to top 10 scores
    displayLeaderboard.sort((a, b) => b.score - a.score);
    displayLeaderboard = displayLeaderboard.slice(0, 10);
    
    // Find current game position
    const currentPosition = displayLeaderboard.findIndex(entry => entry.isCurrent);
    
    displayLeaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        
        // Add appropriate classes
        if (entry.isCurrent) {
            li.classList.add('current-game');
        } else if (lastSubmittedScore && 
                  entry.name === lastSubmittedScore.name && 
                  entry.score === lastSubmittedScore.score) {
            li.classList.add('new');
        }
        
        // Show position change indicator for current game
        let positionIndicator = '';
        if (entry.isCurrent && currentPosition !== -1) {
            const nextScore = index > 0 ? displayLeaderboard[index - 1].score : Infinity;
            const pointsNeeded = nextScore - entry.score;
            if (pointsNeeded !== Infinity) {
                positionIndicator = `<span class="points-needed">+${pointsNeeded}</span>`;
            }
        }
        
        li.innerHTML = `
            <span>${(index + 1).toString().padStart(2, '0')}. ${entry.name}</span>
            <span>${formatScore(entry.score)}${positionIndicator}</span>
        `;
        leaderboardList.appendChild(li);
    });
    
    if (!isLiveUpdate) {
        // Only save to localStorage when not a live update
        leaderboard = displayLeaderboard.filter(entry => !entry.isCurrent);
        localStorage.setItem('tetrisLeaderboard', JSON.stringify(leaderboard));
    }
}

function showGameOver() {
    const modal = document.getElementById('game-over-modal');
    const finalScore = document.getElementById('final-score');
    const nameInput = document.getElementById('name-input');
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    
    bgm.pause();
    bgm.currentTime = 0;
    playSound(gameOverSound);
    
    finalScore.textContent = Math.floor(player.score * settings.multiplier);
    modal.style.display = 'flex';
    nameInput.value = '';
    nameInput.focus();
}

function submitScore() {
    const nameInput = document.getElementById('name-input');
    const name = nameInput.value.toUpperCase() || 'AAA';
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    const finalScore = Math.floor(player.score * settings.multiplier);
    
    const newScore = {
        name: name.slice(0, 3),
        score: finalScore,
        timestamp: Date.now()
    };
    
    lastSubmittedScore = newScore;
    currentGameEntry = null;
    
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    updateLeaderboard();
    
    const modal = document.getElementById('game-over-modal');
    modal.style.display = 'none';
    
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    player.next = null;
    playerReset();
    
    // Restart background music
    if (!isMuted && hasInteracted) {
        bgm.currentTime = 0;
        bgm.play().catch(() => {});
    }
}

// Enhance name input handling
document.getElementById('name-input').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
    if (e.target.value.length > 3) {
        e.target.value = e.target.value.slice(0, 3);
    }
});

// Event Listeners
document.getElementById('submit-score').addEventListener('click', submitScore);
document.getElementById('name-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitScore();
    }
});

// Initialize leaderboard
updateLeaderboard();

// Update the keydown event listener to use new sound function
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1);
        playSound(moveSound);
    } else if (event.keyCode === 39) {
        playerMove(1);
        playSound(moveSound);
    } else if (event.keyCode === 40) {
        playerDrop();
        playSound(dropSound);
    } else if (event.keyCode === 32) {
        playerRotate(1);
        playSound(rotateSound);
    }
});

playerReset();
updateScore();
update();

// Add CSS for the current game indicator
const style = document.createElement('style');
style.textContent = `
    .leaderboard-item.current-game {
        background: rgba(0, 255, 255, 0.1);
        border-color: #0ff;
        animation: currentGamePulse 1.5s infinite;
    }
    
    @keyframes currentGamePulse {
        0% { background: rgba(0, 255, 255, 0.1); }
        50% { background: rgba(0, 255, 255, 0.2); }
        100% { background: rgba(0, 255, 255, 0.1); }
    }
    
    .points-needed {
        font-size: 8px;
        color: #0ff;
        margin-left: 5px;
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

// Add difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: {
        initialInterval: 1200,
        speedIncrement: 50,
        scoreThreshold: 500,
        color: '#0f0',
        multiplier: 1.0
    },
    medium: {
        initialInterval: 1000,
        speedIncrement: 75,
        scoreThreshold: 500,
        color: '#ff0',
        multiplier: 1.33
    },
    hard: {
        initialInterval: 800,
        speedIncrement: 100,
        scoreThreshold: 500,
        color: '#f90',
        multiplier: 1.66
    },
    expert: {
        initialInterval: 500,
        speedIncrement: 150,
        scoreThreshold: 500,
        color: '#f00',
        multiplier: 2.0
    }
};

// Initialize game with difficulty selection
function initGame() {
    const difficultyModal = document.getElementById('difficulty-modal');
    difficultyModal.style.display = 'flex';
    
    // Add event listeners to difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', () => {
            setDifficulty(button.dataset.difficulty);
            difficultyModal.style.display = 'none';
            startGame();
        });
    });
}

function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    const settings = DIFFICULTY_SETTINGS[difficulty];
    dropInterval = settings.initialInterval;
    lastScoreThreshold = 0;
    level = 1;
    document.getElementById('level').textContent = level;
    
    // Update level display color based on difficulty
    document.getElementById('level').style.color = settings.color;
    document.getElementById('level').style.textShadow = `0 0 10px ${settings.color}`;
    
    // Update bonus multiplier display
    const bonusMultiplier = document.getElementById('bonus-multiplier');
    bonusMultiplier.textContent = `×${settings.multiplier.toFixed(2)}`;
    bonusMultiplier.style.color = settings.color;
    bonusMultiplier.style.textShadow = `0 0 5px ${settings.color}`;
}

function updateSpeed() {
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    const currentThreshold = Math.floor(player.score / settings.scoreThreshold) * settings.scoreThreshold;
    
    if (currentThreshold > lastScoreThreshold) {
        lastScoreThreshold = currentThreshold;
        dropInterval = Math.max(100, settings.initialInterval - 
            (Math.floor(player.score / settings.scoreThreshold) * settings.speedIncrement));
        level = Math.floor(player.score / settings.scoreThreshold) + 1;
        document.getElementById('level').textContent = level;
    }
}

function startGame() {
    paused = false;
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    playerReset();
    update();
}

// Add continue and change difficulty handlers
document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('game-over-modal').style.display = 'none';
    startGame();
});

document.getElementById('change-difficulty-btn').addEventListener('click', () => {
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('difficulty-modal').style.display = 'flex';
});

// Start the game with difficulty selection
initGame(); 