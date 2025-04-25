// Multiplayer Networking and Game Over Animation Implementation

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  null,
  "#FF0D72",
  "#0DC2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF",
];

const SHAPES = [
  null,
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
    [0, 4, 4],
    [0, 4, 4],
    [0, 0, 0],
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

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const nextPieceCanvas = document.getElementById("next-piece-canvas");
const nextPieceCtx = nextPieceCanvas.getContext("2d");
let score = 0,
  level = 1,
  lines = 0,
  dropInterval = 1000;
let dropCounter = 0,
  lastTime = 0;
let gameOver = false,
  paused = false;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

let piece = { pos: { x: 0, y: 0 }, matrix: null, type: null };
let nextPiece = { type: Math.floor(Math.random() * 7) + 1, matrix: null };

function init() {
  createNewPiece();
  updateNextPiece();
  updateScore();
  requestAnimationFrame(gameLoop);
}

function gameLoop(time = 0) {
  if (gameOver) return;
  if (paused) {
    requestAnimationFrame(gameLoop);
    return;
  }
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    moveDown();
    dropCounter = 0;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

function moveDown() {
  piece.pos.y++;
  if (collide()) {
    piece.pos.y--;
    merge();
    clearLines();
    createNewPiece();
    updateNextPiece();
    if (collide()) {
      showGameOver();
    }
  }
  dropCounter = 0;
}

function createNewPiece() {
  piece.type = nextPiece.type;
  piece.matrix = SHAPES[piece.type];
  piece.pos.y = 0;
  piece.pos.x = Math.floor(COLS / 2) - Math.floor(piece.matrix[0].length / 2);
}

function updateNextPiece() {
  nextPiece.type = Math.floor(Math.random() * 7) + 1;
  nextPiece.matrix = SHAPES[nextPiece.type];
  drawNextPiece();
}

function drawNextPiece() {
  nextPieceCtx.fillStyle = "#000";
  nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  const blockSize = 25;
  const offsetX =
    (nextPieceCanvas.width - nextPiece.matrix[0].length * blockSize) / 2;
  const offsetY =
    (nextPieceCanvas.height - nextPiece.matrix.length * blockSize) / 2;
  nextPiece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        nextPieceCtx.fillStyle = COLORS[value];
        nextPieceCtx.fillRect(
          offsetX + x * blockSize,
          offsetY + y * blockSize,
          blockSize - 1,
          blockSize - 1
        );
      }
    });
  });
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(piece.matrix, piece.pos);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(
          (x + offset.x) * BLOCK_SIZE,
          (y + offset.y) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });
}

function collide() {
  const m = piece.matrix,
    o = piece.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge() {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + piece.pos.y][x + piece.pos.x] = value;
      }
    });
  });
}

function rotate() {
  const m = piece.matrix;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
    }
  }
  m.reverse();
}

function hardDrop() {
  while (!collide()) {
    piece.pos.y++;
  }
  piece.pos.y--;
  merge();
  clearLines();
  createNewPiece();
  updateNextPiece();
}

function clearLines() {
  let linesCleared = 0;
  outer: for (let y = board.length - 1; y >= 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) continue outer;
    }
    board.splice(y, 1);
    board.unshift(new Array(COLS).fill(0));
    ++y;
    linesCleared++;
  }
  if (linesCleared > 0) {
    lines += linesCleared;
    score += linesCleared * 100 * level;
    level = Math.min(Math.floor(lines / 10) + 1, 5);
    dropInterval = 1000 / Math.pow(1.5, level - 1);
    updateScore();
  }
}

function showGameOver() {
  const gameOverScreen = document.getElementById("game-over");
  gameOverScreen.classList.remove("hidden");
  gameOverScreen.classList.add("fade-in");
  gameOver = true;
}

function updateScore() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  document.getElementById("lines").textContent = lines;
}

// Multiplayer Networking using WebSocket
function initTwoPlayerMode() {
  const ws = new WebSocket("wss://yourserver.example.com");
  ws.onopen = () => console.log("Connected to multiplayer server");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "sync") {
      // Sync opponent board or score
      document.getElementById("p2-score").textContent = data.score;
    }
  };
  ws.onerror = (err) => console.error("WebSocket error", err);
  ws.onclose = () => console.log("Disconnected from multiplayer");

  // Send player's score every 2 seconds
  setInterval(() => {
    if (!gameOver) {
      ws.send(JSON.stringify({ type: "sync", score: score }));
    }
  }, 2000);
}

document.addEventListener("keydown", (event) => {
  if (gameOver) return;
  if (event.key === "p") {
    paused = !paused;
    return;
  }
  if (paused) return;
  switch (event.key) {
    case "ArrowLeft":
      moveLeft();
      break;
    case "ArrowRight":
      moveRight();
      break;
    case "ArrowDown":
      moveDown();
      break;
    case "ArrowUp":
      rotate();
      break;
    case " ":
      hardDrop();
      break;
  }
});

function moveLeft() {
  piece.pos.x--;
  if (collide()) piece.pos.x++;
}
function moveRight() {
  piece.pos.x++;
  if (collide()) piece.pos.x--;
}

init();
