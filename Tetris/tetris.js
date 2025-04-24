const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

// Game constants
const BLOCK_SIZE = 30;
const COLS = 10;
const ROWS = 20;
const COLORS = [
  null,
  "#FF0000", // I - Red
  "#00FF00", // J - Green
  "#FFFFFF", // L - White
  "#FFD700", // O - Gold
  "#FF69B4", // S - Pink
  "#FFA500", // T - Orange
  "#00FFFF", // Z - Cyan
];

// Tetromino shapes
const SHAPES = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ], // L
  [
    [0, 4, 4],
    [0, 4, 4],
    [0, 0, 0],
  ], // O
  [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ], // S
  [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // T
  [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ], // Z
];

// Game state
let score = 0;
let board = Array(ROWS)
  .fill()
  .map(() => Array(COLS).fill(0));
let currentPiece = null;
let currentPieceX = 0;
let currentPieceY = 0;
let gameOver = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Create a new piece
function createPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  return {
    type,
    shape: SHAPES[type],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0,
  };
}

// Draw a single square
function drawSquare(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw the game board
function drawBoard() {
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawSquare(x, y, COLORS[value]);
      }
    });
  });
}

// Draw the current piece
function drawPiece() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawSquare(currentPiece.x + x, currentPiece.y + y, COLORS[value]);
      }
    });
  });
}

// Check for collisions
function collide() {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (
        currentPiece.shape[y][x] !== 0 &&
        (board[y + currentPiece.y] &&
          board[y + currentPiece.y][x + currentPiece.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

// Merge the piece into the board
function merge() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + currentPiece.y][x + currentPiece.x] = value;
      }
    });
  });
}

// Clear completed lines
function clearLines() {
  let linesCleared = 0;
  outer: for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    y++;
    linesCleared++;
  }
  if (linesCleared > 0) {
    score += linesCleared * 100;
    scoreElement.textContent = score;

    // Trigger dinosaur animation when score reaches 500
    if (score >= 500 && !document.querySelector(".dinosaur").style.display) {
      const dinosaur = document.querySelector(".dinosaur");
      dinosaur.style.display = "block";
      dinosaur.style.animation = "none";
      dinosaur.offsetHeight; // Trigger reflow
      dinosaur.style.animation = "fallDinosaur 3s linear forwards";

      // Reset dinosaur after animation
      setTimeout(() => {
        dinosaur.style.display = "none";
      }, 3000);
    }
  }
}

// Rotate the piece
function rotate() {
  const originalShape = currentPiece.shape;
  const rows = currentPiece.shape.length;
  const cols = currentPiece.shape[0].length;
  const rotated = Array(cols)
    .fill()
    .map(() => Array(rows).fill(0));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = currentPiece.shape[y][x];
    }
  }

  currentPiece.shape = rotated;
  if (collide()) {
    currentPiece.shape = originalShape;
  }
}

// Move the piece
function movePiece(dx, dy) {
  currentPiece.x += dx;
  currentPiece.y += dy;
  if (collide()) {
    currentPiece.x -= dx;
    currentPiece.y -= dy;
    if (dy > 0) {
      merge();
      clearLines();
      currentPiece = createPiece();
      if (collide()) {
        gameOver = true;
      }
    }
  }
}

// Game loop
function update(time = 0) {
  if (gameOver) {
    alert("Game Over! Your score: " + score);
    document.location.reload();
    return;
  }

  // Adjust drop interval based on score
  if (score >= 300) {
    dropInterval = 500; // Speed up to 500ms when score >= 300
  }

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    movePiece(0, 1);
    dropCounter = 0;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawPiece();
  requestAnimationFrame(update);
}

// Handle keyboard input
document.addEventListener("keydown", (event) => {
  if (gameOver) return;

  // Prevent default behavior for arrow keys and space
  if ([37, 38, 39, 40, 32].includes(event.keyCode)) {
    event.preventDefault();
  }

  switch (event.keyCode) {
    case 37: // Left arrow
      movePiece(-1, 0);
      break;
    case 39: // Right arrow
      movePiece(1, 0);
      break;
    case 40: // Down arrow
      movePiece(0, 1);
      break;
    case 32: // Space
      rotate();
      break;
  }
});

// Start the game
currentPiece = createPiece();
update();
