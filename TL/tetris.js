const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ]
};

class Tetris {
    constructor() {
        this.board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        this.currentPiece = this.newPiece();
        this.gameOver = false;
        this.score = 0;
        this.gameLoop = null;
        this.speed = 1000;
        this.highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
        this.isPaused = false;
        this.isMusicPlaying = false;
        this.init();
        this.displayHighScores();
        this.setupPauseButton();
        this.setupMusicButton();
    }

    setupPauseButton() {
        const pauseButton = document.getElementById('pause-button');
        const pauseOverlay = document.getElementById('pause-overlay');

        pauseButton.addEventListener('click', () => {
            this.togglePause();
        });

        // Add keyboard shortcut (P key) for pause
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p' && !this.gameOver) {
                this.togglePause();
            }
        });
    }

    setupMusicButton() {
        const musicButton = document.getElementById('music-button');
        const bgMusic = document.getElementById('bg-music');
        
        // Set initial volume
        bgMusic.volume = 0.6;
        
        // Start with music off
        this.isMusicPlaying = false;
        musicButton.textContent = 'MUSIC OFF';
        musicButton.classList.add('muted');
        
        // Handle first user interaction
        const startMusic = () => {
            if (!this.isMusicPlaying) {
                bgMusic.play().catch(error => {
                    console.log("Playback failed:", error);
                });
            }
        };

        // Try to play on any user interaction
        document.addEventListener('click', startMusic, { once: true });
        document.addEventListener('keydown', startMusic, { once: true });

        musicButton.addEventListener('click', () => {
            this.isMusicPlaying = !this.isMusicPlaying;
            
            if (this.isMusicPlaying) {
                bgMusic.play().catch(error => {
                    console.log("Playback failed:", error);
                    this.isMusicPlaying = false;
                    musicButton.textContent = 'MUSIC OFF';
                    musicButton.classList.add('muted');
                });
                musicButton.textContent = 'MUSIC ON';
                musicButton.classList.remove('muted');
            } else {
                bgMusic.pause();
                musicButton.textContent = 'MUSIC OFF';
                musicButton.classList.add('muted');
            }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseButton = document.getElementById('pause-button');
        const pauseOverlay = document.getElementById('pause-overlay');

        if (this.isPaused) {
            clearInterval(this.gameLoop);
            pauseButton.textContent = 'RESUME';
            pauseButton.classList.add('paused');
            pauseOverlay.style.display = 'flex';
        } else {
            this.startGame();
            pauseButton.textContent = 'PAUSE';
            pauseButton.classList.remove('paused');
            pauseOverlay.style.display = 'none';
        }
    }

    init() {
        this.createBoard();
        this.addEventListeners();
        this.startGame();
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.classList.add('block');
                gameBoard.appendChild(cell);
            }
        }
    }

    newPiece() {
        const shapes = Object.keys(SHAPES);
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        return {
            shape: shape,
            matrix: SHAPES[shape],
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[shape][0].length / 2),
            y: 0
        };
    }

    draw() {
        const gameBoard = document.getElementById('game-board');
        const cells = gameBoard.children;
        
        // Clear board
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const index = y * BOARD_WIDTH + x;
                cells[index].className = 'block';
                if (this.board[y][x]) {
                    cells[index].classList.add(this.board[y][x]);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            this.currentPiece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const boardY = this.currentPiece.y + y;
                        const boardX = this.currentPiece.x + x;
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                            const index = boardY * BOARD_WIDTH + boardX;
                            cells[index].classList.add(this.currentPiece.shape);
                        }
                    }
                });
            });
        }
    }

    moveDown() {
        this.currentPiece.y++;
        if (this.collision()) {
            this.currentPiece.y--;
            this.merge();
            this.clearLines();
            this.currentPiece = this.newPiece();
            if (this.collision()) {
                this.gameOver = true;
                this.stopGame();
            }
        }
        this.draw();
    }

    moveLeft() {
        this.currentPiece.x--;
        if (this.collision()) {
            this.currentPiece.x++;
        }
        this.draw();
    }

    moveRight() {
        this.currentPiece.x++;
        if (this.collision()) {
            this.currentPiece.x--;
        }
        this.draw();
    }

    rotate() {
        const originalMatrix = this.currentPiece.matrix;
        const N = this.currentPiece.matrix.length;
        const rotated = Array(N).fill().map(() => Array(N).fill(0));
        
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                rotated[x][N - 1 - y] = this.currentPiece.matrix[y][x];
            }
        }
        
        this.currentPiece.matrix = rotated;
        if (this.collision()) {
            this.currentPiece.matrix = originalMatrix;
        }
        this.draw();
    }

    collision() {
        return this.currentPiece.matrix.some((row, y) => {
            return row.some((value, x) => {
                if (value === 0) return false;
                const boardY = this.currentPiece.y + y;
                const boardX = this.currentPiece.x + x;
                return (
                    boardY >= BOARD_HEIGHT ||
                    boardX < 0 ||
                    boardX >= BOARD_WIDTH ||
                    (boardY >= 0 && this.board[boardY][boardX])
                );
            });
        });
    }

    merge() {
        this.currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                        this.board[boardY][boardX] = this.currentPiece.shape;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100;
            document.getElementById('score').textContent = `Score: ${this.score}`;
            
            // Play dinosaur roar sound
            const roarSound = document.getElementById('roar-sound');
            roarSound.currentTime = 0; // Reset sound to start
            roarSound.play().catch(e => console.log('Audio play failed:', e));
            
            // Increase speed when score reaches 300
            if (this.score >= 300 && this.speed === 1000) {
                this.speed = 600;
                clearInterval(this.gameLoop);
                this.startGame();
            }
            
            // Show dinosaur animation when score reaches 500
            if (this.score >= 500) {
                this.showDinosaur();
            }
        }
    }

    showDinosaur() {
        const container = document.getElementById('dinosaur-container');
        container.style.display = 'block';
        
        const dinosaur = document.createElement('div');
        dinosaur.className = 'dinosaur';
        dinosaur.textContent = '🦖';
        dinosaur.style.left = Math.random() * 80 + 10 + 'vw';
        
        container.appendChild(dinosaur);
        
        // Remove dinosaur after animation completes
        dinosaur.addEventListener('animationend', () => {
            dinosaur.remove();
            if (container.children.length === 0) {
                container.style.display = 'none';
            }
        });
    }

    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            // Prevent default scrolling behavior for arrow keys and space
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case ' ':
                    this.rotate();
                    break;
            }
        });
    }

    startGame() {
        this.gameLoop = setInterval(() => {
            this.moveDown();
        }, this.speed);
    }

    stopGame() {
        clearInterval(this.gameLoop);
        if (this.score > 0) {
            this.showNameInput();
        } else {
            alert(`Game Over! Score: ${this.score}`);
        }
    }

    showNameInput() {
        const nameInput = document.getElementById('name-input');
        nameInput.style.display = 'block';
        const playerName = document.getElementById('player-name');
        playerName.focus();

        document.getElementById('submit-score').addEventListener('click', () => {
            const name = playerName.value.trim() || 'ANON';
            this.saveScore(name);
            nameInput.style.display = 'none';
            playerName.value = '';
            alert(`Game Over! Score: ${this.score}`);
        });
    }

    saveScore(name) {
        this.highScores.push({
            name: name.toUpperCase(),
            score: this.score,
            date: new Date().toLocaleDateString()
        });

        // Sort scores in descending order
        this.highScores.sort((a, b) => b.score - a.score);

        // Keep only top 10 scores
        this.highScores = this.highScores.slice(0, 10);

        // Save to localStorage
        localStorage.setItem('tetrisHighScores', JSON.stringify(this.highScores));

        // Update display
        this.displayHighScores();
    }

    displayHighScores() {
        const highScoresList = document.getElementById('high-scores');
        highScoresList.innerHTML = '';

        this.highScores.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'score-entry';
            li.innerHTML = `
                <span>${index + 1}. ${entry.name}</span>
                <span>${entry.score}</span>
            `;
            highScoresList.appendChild(li);
        });
    }
}

// Start the game when the page loads
window.onload = () => {
    new Tetris();
}; 