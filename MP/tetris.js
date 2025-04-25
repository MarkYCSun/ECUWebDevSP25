// Tetris Game Implementation
class Tetris {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.bonusText = document.getElementById('bonusText');
        this.bgMusic = document.getElementById('bgMusic');
        this.rainSound = document.getElementById('rainSound');
        this.thudSound = document.getElementById('thudSound');
        this.musicToggle = document.getElementById('musicToggle');
        this.rainToggle = document.getElementById('rainToggle');
        this.isMusicPlaying = false;
        this.isRainPlaying = false;
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.highScore = 0;
        this.currentPiece = null;
        this.gameOver = false;
        this.dropSpeed = 500; // Faster initial speed
        this.lastDrop = 0;
        this.dinosaurShown = false;
        this.colors = {
            I: '#4a9e4a',  // Jungle Green
            O: '#8b4513',  // Brown
            T: '#ffd700',  // Gold
            S: '#32cd32',  // Lime Green
            Z: '#006400',  // Dark Green
            J: '#228b22',  // Forest Green
            L: '#90ee90'   // Light Green
        };
        
        this.tetrominoes = {
            I: [[1, 1, 1, 1]],
            O: [[1, 1], [1, 1]],
            T: [[0, 1, 0], [1, 1, 1]],
            S: [[0, 1, 1], [1, 1, 0]],
            Z: [[1, 1, 0], [0, 1, 1]],
            J: [[1, 0, 0], [1, 1, 1]],
            L: [[0, 0, 1], [1, 1, 1]]
        };

        // Initialize thud sound
        this.thudSound.volume = 1.0;
        this.thudSound.load();
        
        // Enable sound on first user interaction
        document.addEventListener('click', () => {
            this.thudSound.play().then(() => {
                this.thudSound.pause();
                this.thudSound.currentTime = 0;
            }).catch(() => {});
        }, { once: true });

        this.init();
    }

    init() {
        // Create grid cells
        for (let i = 0; i < 200; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            this.gameBoard.appendChild(cell);
        }

        // Create dinosaur element
        this.dinosaur = document.createElement('div');
        this.dinosaur.classList.add('dinosaur');
        document.body.appendChild(this.dinosaur);

        // Set up keyboard controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Set up music and rain sound controls
        this.setupMusic();
        this.setupRainSound();
        
        // Start game
        this.spawnPiece();
        this.gameLoop();
    }

    setupMusic() {
        // Set initial volume to a lower level
        this.bgMusic.volume = 0.15;
        
        // Add event listeners for music
        this.musicToggle.addEventListener('click', () => this.toggleMusic());
        
        // Handle audio loading errors
        this.bgMusic.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
            this.musicToggle.textContent = '❌ Music Error';
            this.musicToggle.disabled = true;
        });
        
        // Handle audio loading success
        this.bgMusic.addEventListener('canplaythrough', () => {
            console.log('Audio loaded successfully');
        });
        
        // Try to load the audio
        this.bgMusic.load();
    }

    setupRainSound() {
        // Set initial volume to a lower level
        this.rainSound.volume = 0.25;
        
        // Add event listeners for rain sound
        this.rainToggle.addEventListener('click', () => this.toggleRainSound());
        
        // Handle audio loading errors
        this.rainSound.addEventListener('error', (e) => {
            console.error('Error loading rain sound:', e);
            this.rainToggle.textContent = '❌ Rain Sound Error';
            this.rainToggle.disabled = true;
        });
        
        // Handle audio loading success
        this.rainSound.addEventListener('canplaythrough', () => {
            console.log('Rain sound loaded successfully');
            // Enable the button once audio is loaded
            this.rainToggle.disabled = false;
        });
        
        // Try to load the audio
        this.rainSound.load();
        
        // Log to console for debugging
        console.log('Rain sound setup complete');
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.bgMusic.pause();
            this.musicToggle.textContent = '🔈 Toggle Music';
            this.musicToggle.classList.add('muted');
            this.isMusicPlaying = false;
        } else {
            // Use a promise to handle the play() method which returns a promise
            const playPromise = this.bgMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Playback started successfully
                    this.musicToggle.textContent = '🔊 Toggle Music';
                    this.musicToggle.classList.remove('muted');
                    this.isMusicPlaying = true;
                }).catch(error => {
                    // Auto-play was prevented
                    console.error('Playback failed:', error);
                    this.musicToggle.textContent = '🔇 Click to Play';
                    this.musicToggle.classList.add('muted');
                    this.isMusicPlaying = false;
                });
            }
        }
    }

    toggleRainSound() {
        console.log('Toggling rain sound, current state:', this.isRainPlaying);
        
        if (this.isRainPlaying) {
            this.rainSound.pause();
            this.rainToggle.textContent = '☀️ Toggle Rain Sound';
            this.rainToggle.classList.add('muted');
            this.isRainPlaying = false;
            console.log('Rain sound paused');
        } else {
            // Use a promise to handle the play() method which returns a promise
            const playPromise = this.rainSound.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Playback started successfully
                    this.rainToggle.textContent = '🌧️ Toggle Rain Sound';
                    this.rainToggle.classList.remove('muted');
                    this.isRainPlaying = true;
                    console.log('Rain sound playing');
                }).catch(error => {
                    // Auto-play was prevented
                    console.error('Rain sound playback failed:', error);
                    this.rainToggle.textContent = '🔇 Click to Play Rain';
                    this.rainToggle.classList.add('muted');
                    this.isRainPlaying = false;
                });
            }
        }
    }

    spawnPiece() {
        const pieces = Object.keys(this.tetrominoes);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.currentPiece = {
            shape: this.tetrominoes[randomPiece],
            type: randomPiece,
            x: 3,
            y: 0
        };

        if (this.checkCollision()) {
            this.gameOver = true;
            alert('Game Over! Score: ' + this.score);
            this.reset();
        }
    }

    handleKeyPress(event) {
        if (this.gameOver) return;

        // Prevent default behavior for arrow keys and space
        if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' '].includes(event.key)) {
            event.preventDefault();
        }

        switch (event.key) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case ' ':
                this.rotatePiece();
                break;
        }
        this.updateDisplay();
    }

    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;

        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                this.lockPiece();
                this.clearLines();
                this.spawnPiece();
            }
            return false;
        }
        return true;
    }

    rotatePiece() {
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );

        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }

    checkCollision() {
        return this.currentPiece.shape.some((row, dy) =>
            row.some((value, dx) => {
                if (!value) return false;
                const newX = this.currentPiece.x + dx;
                const newY = this.currentPiece.y + dy;
                return (
                    newX < 0 ||
                    newX >= 10 ||
                    newY >= 20 ||
                    (newY >= 0 && this.grid[newY][newX])
                );
            })
        );
    }

    lockPiece() {
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const newY = this.currentPiece.y + dy;
                    const newX = this.currentPiece.x + dx;
                    if (newY >= 0) {
                        this.grid[newY][newX] = this.currentPiece.type;
                    }
                }
            });
        });
        
        // Play thud sound
        this.thudSound.currentTime = 0;
        this.thudSound.volume = 0.5;
        this.thudSound.play().catch(error => {
            console.log('Error playing thud sound:', error);
        });
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.grid.length - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(10).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.score += linesCleared * 100;
            this.scoreElement.textContent = this.score;
            
            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreElement.textContent = this.highScore;
            }
            
            // More aggressive speed increase after score 300
            if (this.score > 300) {
                this.dropSpeed = Math.max(100, 500 - Math.floor((this.score - 300) / 100) * 100);
            } else {
                this.dropSpeed = 500;
            }
            
            // Show dinosaur when score reaches 500
            if (this.score >= 500 && !this.dinosaurShown) {
                this.showDinosaur();
                this.dinosaurShown = true;
            }
        }
    }
    
    showDinosaur() {
        // Position dinosaur in the middle of the game grid
        const gameBoardRect = this.gameBoard.getBoundingClientRect();
        const dinosaurWidth = 150; // Match the CSS width
        const leftPosition = gameBoardRect.left + (gameBoardRect.width / 2) - (dinosaurWidth / 2);
        
        // Reset the dinosaur position and animation
        this.dinosaur.style.left = `${leftPosition}px`;
        this.dinosaur.style.transform = 'translateX(-50%)';
        this.dinosaur.style.top = '-150px';
        this.dinosaur.classList.remove('falling');
        
        // Show bonus text
        this.bonusText.classList.remove('show');
        void this.bonusText.offsetWidth; // Force reflow
        this.bonusText.classList.add('show');
        
        // Force a reflow to restart the animation
        void this.dinosaur.offsetWidth;
        
        // Add the falling class to start the animation
        this.dinosaur.classList.add('falling');
        
        // Clear blocks as dinosaur falls
        const clearInterval = setInterval(() => {
            const dinosaurRect = this.dinosaur.getBoundingClientRect();
            const gameBoardRect = this.gameBoard.getBoundingClientRect();
            
            // Calculate relative position
            const relativeY = dinosaurRect.top - gameBoardRect.top;
            
            // Convert to grid coordinates
            const gridY = Math.floor(relativeY / (gameBoardRect.height / 20));
            
            // Clear entire row when dinosaur reaches it
            if (gridY >= 0 && gridY < 20) {
                for (let x = 0; x < 10; x++) {
                    // Award points for each block destroyed
                    if (this.grid[gridY][x] !== 0) {
                        this.score += 10;
                        this.scoreElement.textContent = this.score;
                        
                        // Update high score if needed
                        if (this.score > this.highScore) {
                            this.highScore = this.score;
                            this.highScoreElement.textContent = this.highScore;
                        }
                    }
                    this.grid[gridY][x] = 0;
                }
                this.updateDisplay();
            }
        }, 50); // Faster interval for smoother clearing
        
        // Remove the falling class and clear interval after animation completes
        setTimeout(() => {
            this.dinosaur.classList.remove('falling');
            clearInterval(clearInterval);
            this.bonusText.classList.remove('show');
        }, 3000);
    }

    reset() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.gameOver = false;
        this.dropSpeed = 500;
        this.dinosaurShown = false;
        this.updateDisplay();
    }

    updateDisplay() {
        const cells = this.gameBoard.children;
        
        // Clear the board
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                const index = y * 10 + x;
                cells[index].style.backgroundColor = '';
                cells[index].classList.remove('tetromino');
            }
        }

        // Draw the grid
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x]) {
                    const index = y * 10 + x;
                    cells[index].style.backgroundColor = this.colors[this.grid[y][x]];
                    cells[index].classList.add('tetromino');
                }
            }
        }

        // Draw the current piece
        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, dy) => {
                row.forEach((value, dx) => {
                    if (value) {
                        const y = this.currentPiece.y + dy;
                        const x = this.currentPiece.x + dx;
                        if (y >= 0) {
                            const index = y * 10 + x;
                            cells[index].style.backgroundColor = this.colors[this.currentPiece.type];
                            cells[index].classList.add('tetromino');
                        }
                    }
                });
            });
        }
    }

    gameLoop(timestamp) {
        if (!this.gameOver) {
            if (!this.lastDrop) this.lastDrop = timestamp;
            
            if (timestamp - this.lastDrop > this.dropSpeed) {
                this.movePiece(0, 1);
                this.lastDrop = timestamp;
            }
            
            this.updateDisplay();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
}

// Initialize the Tetris game
new Tetris(); 