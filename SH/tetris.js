// tetris.js

class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextPieceCanvas = document.getElementById('next-piece-canvas');
        this.nextPieceCtx = this.nextPieceCanvas.getContext('2d');

        this.music = document.getElementById('bg-music');
        this.music.volume = 0.2;

        this.lineClearSound = new Audio('laser.mp3');
        this.DinoRoar = new Audio('roar.mp3');
        this.lineClearSound.volume = 0.7;
        this.DinoRoar.volume = 0.7;

        this.blockSize = 30;
        this.rows = 20;
        this.cols = 10;
        this.score = 0;
        this.level = 1;
        this.lines = 0;

        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameOver = false;
        this.isPaused = false;

        this.shapes = [
            [[1,1,1,1]],            // I
            [[1,1],[1,1]],          // O
            [[1,1,1],[0,1,0]],      // T
            [[1,1,1],[1,0,0]],      // L
            [[1,1,1],[0,0,1]],      // J
            [[1,1,0],[0,1,1]],      // S
            [[0,1,1],[1,1,0]]       // Z
        ];
        this.colors = ['#00f0f0','#f0f000','#a000f0','#f0a000','#0000f0','#00f000','#f00000'];

        document.getElementById('start-button')
            .addEventListener('click', () => this.startGame());
        document.getElementById('pause-button')
            .addEventListener('click', () => this.togglePause());
        document.addEventListener('keydown', e => this.handleKeyPress(e));

        this.drawBoard();
    }

    startGame() {
        if (this.gameOver) this.resetGame();
        this.gameOver = false;
        this.isPaused = false;
        this.music.currentTime = 0;
        this.music.play();
        this.spawnPiece();
        this.gameLoop();
    }

    resetGame() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0; this.level = 1; this.lines = 0;
        this.updateScore();
        this.drawBoard();
    }

    checkGameOver() {
        const test = { ...this.currentPiece, y: 0 };
        return test.shape.some((row, i) =>
            row.some((v, j) => {
                if (!v) return false;
                const y = test.y + i, x = test.x + j;
                return y >= 0 && y < this.rows && x >= 0 && x < this.cols && this.board[y][x];
            })
        );
    }

    checkCollision() {
        return this.currentPiece.shape.some((row, i) =>
            row.some((v, j) => {
                if (!v) return false;
                const x = this.currentPiece.x + j, y = this.currentPiece.y + i;
                return (
                    x < 0 || x >= this.cols ||
                    y >= this.rows ||
                    (y >= 0 && this.board[y][x])
                );
            })
        );
    }

    spawnPiece() {
        if (!this.nextPiece) this.nextPiece = this.randomPiece();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.drawNextPiece();

        if (this.checkGameOver()) {
            this.gameOver = true;
            this.music.pause();
            alert('Game Over!');
            return;
        }
        this.drawBoard();
    }

    randomPiece() {
        const s = this.shapes[Math.floor(Math.random() * this.shapes.length)];
        const c = this.colors[Math.floor(Math.random() * this.colors.length)];
        const x = Math.floor(this.cols / 2) - Math.ceil(s[0].length / 2);
        return { shape: s, color: c, x, y: 0 };
    }

    drawNextPiece() {
        const ctx = this.nextPieceCtx;
        const shape = this.nextPiece.shape;
        const bs = 20;
        ctx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        ctx.fillStyle = this.nextPiece.color;
        const offX = (this.nextPieceCanvas.width - shape[0].length * bs) / 2;
        const offY = (this.nextPieceCanvas.height - shape.length * bs) / 2;
        shape.forEach((row, i) =>
            row.forEach((v, j) => {
                if (v) ctx.fillRect(offX + j * bs, offY + i * bs, bs - 1, bs - 1);
            })
        );
    }

    drawBoard() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.board.forEach((row, i) =>
            row.forEach((v, j) => {
                if (v) {
                    ctx.fillStyle = v;
                    ctx.fillRect(j * this.blockSize, i * this.blockSize,
                                 this.blockSize - 1, this.blockSize - 1);
                }
            })
        );
        if (this.currentPiece) {
            ctx.fillStyle = this.currentPiece.color;
            this.currentPiece.shape.forEach((row, i) =>
                row.forEach((v, j) => {
                    if (v) ctx.fillRect(
                        (this.currentPiece.x + j) * this.blockSize,
                        (this.currentPiece.y + i) * this.blockSize,
                        this.blockSize - 1, this.blockSize - 1
                    );
                })
            );
        }
    }

    movePiece(dx, dy) {
        if (this.gameOver || this.isPaused) return false;
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            return false;
        }
        this.drawBoard();
        return true;
    }

    rotatePiece() {
        if (this.gameOver || this.isPaused) return;
        const orig = this.currentPiece.shape;
        const rot = orig[0].map((_, i) => orig.map(row => row[i]).reverse());
        this.currentPiece.shape = rot;
        if (this.checkCollision()) this.currentPiece.shape = orig;
        else this.drawBoard();
    }

    lockPiece() {
        this.currentPiece.shape.forEach((row, i) =>
            row.forEach((v, j) => {
                if (v) {
                    const y = this.currentPiece.y + i;
                    if (y >= 0) this.board[y][this.currentPiece.x + j] = this.currentPiece.color;
                }
            })
        );
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let cleared = 0;
        for (let i = this.rows - 1; i >= 0; i--) {
            if (this.board[i].every(c => c)) {
                this.board.splice(i, 1);
                this.board.unshift(Array(this.cols).fill(0));
                cleared++;
                i++;
            }
        }
        if (cleared) {
            this.lineClearSound.currentTime = 0;
            this.lineClearSound.play();
            this.DinoRoar.currentTime = 0;
            this.DinoRoar.play();

            const effects = [
                'line-clear-1','line-clear-2','line-clear-3','line-clear-4','line-clear-5',
                'line-clear-6','line-clear-7','line-clear-8','line-clear-9','line-clear-10'
            ];
            const fx = effects[Math.floor(Math.random() * effects.length)];
            document.body.classList.add(fx, 'show-dino');
            this.canvas.classList.add(fx, 'show-dino');

            setTimeout(() => {
                document.body.classList.remove(fx, 'show-dino');
                this.canvas.classList.remove(fx, 'show-dino');
            }, 1500);

            this.lines += cleared;
            this.score += cleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.updateScore();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    togglePause() {
        if (this.gameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) this.music.pause(); else this.music.play();
        document.getElementById('pause-button').textContent =
            this.isPaused ? 'Resume' : 'Pause';
    }

    handleKeyPress(e) {
        if (this.gameOver || this.isPaused) return;
        switch (e.key) {
            case 'ArrowLeft': this.movePiece(-1, 0); break;
            case 'ArrowRight': this.movePiece(1, 0); break;
            case 'ArrowDown': this.movePiece(0, 1); break;
            case 'ArrowUp': this.rotatePiece(); break;
            case ' ':
                while (this.movePiece(0, 1));
                this.lockPiece();
                break;
        }
    }

    gameLoop() {
        if (this.gameOver || this.isPaused) return;
        if (!this.movePiece(0, 1)) this.lockPiece();
        setTimeout(() => this.gameLoop(), 1000 / this.level);
    }
}

window.addEventListener('load', () => new Tetris());
