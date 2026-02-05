console.log("Snake game loaded");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

// 🔲 Cell size
const CELL = 20;
let cols, rows;

// Game state
let snake, dx, dy, food, score, count;
let gameRunning = false;
let paused = false;

// Levels & speed
let level = 1;
let speed = 12; // lower = faster

// Sounds
const eatSound = new Audio("./eat.mp3");
const gameOverSound = new Audio("./gameover.mp3");
const pauseSound = new Audio("./pause.mp3");

// Device detection
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Backgrounds
const desktopBackgrounds = [
  "./images/level1.jpeg",
  "./images/level2.jpeg",
  "./images/level3.jpeg",
  "./images/level4.jpeg"
];

const mobileBackgrounds = [
  "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  "linear-gradient(135deg, #232526, #414345)",
  "linear-gradient(135deg, #1c1c1c, #323232)",
  "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
];

// ---------------- Responsive Canvas ----------------
function resizeCanvas() {
  const factor = isMobile ? 0.8 : 0.9;
  const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) * factor);
  canvas.width = Math.floor(size / CELL) * CELL;
  canvas.height = canvas.width;

  cols = canvas.width / CELL;
  rows = canvas.height / CELL;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---------------- Reset Game ----------------
function resetGame() {
  snake = [{ x: Math.floor(cols / 2) * CELL, y: Math.floor(rows / 2) * CELL }];
  dx = 0;
  dy = 0;
  score = 0;
  level = 1;
  speed = isMobile ? 10 : 12;
  count = 0;
  gameRunning = false;
  paused = false;
  scoreDisplay.textContent = score;
  updateBackground();
  placeFood();
}

// ---------------- Place Food ----------------
function placeFood() {
  food = {
    x: Math.floor(Math.random() * cols) * CELL,
    y: Math.floor(Math.random() * rows) * CELL
  };

  if (snake.some(s => s.x === food.x && s.y === food.y)) {
    placeFood();
  }
}

// ---------------- Update Background ----------------
function updateBackground() {
  if (isMobile) {
    document.body.style.background = mobileBackgrounds[(level - 1) % mobileBackgrounds.length];
  } else {
    document.body.style.backgroundImage =
      `url(${desktopBackgrounds[(level - 1) % desktopBackgrounds.length]})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  }
}

// ---------------- Keyboard (Desktop) ----------------
document.addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();

  if (e.key === " ") {
    paused = !paused;
    pauseSound.play();
    return;
  }

  if (!gameRunning) gameRunning = true;
  if (paused) return;

  if (e.key === "ArrowLeft" && dx === 0) { dx = -CELL; dy = 0; }
  if (e.key === "ArrowRight" && dx === 0) { dx = CELL; dy = 0; }
  if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -CELL; }
  if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = CELL; }
});

// ---------------- Swipe Controls (Mobile) ----------------
let startX = 0, startY = 0;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
}, { passive: false });

canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

canvas.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  const dxSwipe = t.clientX - startX;
  const dySwipe = t.clientY - startY;

  if (!gameRunning) gameRunning = true;
  if (paused) return;

  if (Math.abs(dxSwipe) > Math.abs(dySwipe)) {
    if (dxSwipe > 30 && dx === 0) { dx = CELL; dy = 0; }
    if (dxSwipe < -30 && dx === 0) { dx = -CELL; dy = 0; }
  } else {
    if (dySwipe > 30 && dy === 0) { dx = 0; dy = CELL; }
    if (dySwipe < -30 && dy === 0) { dx = 0; dy = -CELL; }
  }
});

// ---------------- Overlay ----------------
function drawOverlay(text) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = `${CELL}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// ---------------- Level Up ----------------
function checkLevelUp() {
  const newLevel = Math.floor(score / 5) + 1;
  if (newLevel !== level) {
    level = newLevel;
    speed = Math.max(5, speed - 1); // faster per level
    updateBackground();
  }
}

// ---------------- Game Loop ----------------
function gameLoop() {
  requestAnimationFrame(gameLoop);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw food
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, CELL, CELL);

  // Draw snake
  ctx.fillStyle = "lime";
  snake.forEach(s => ctx.fillRect(s.x, s.y, CELL, CELL));

  if (!gameRunning) {
    drawOverlay("Swipe to start");
    return;
  }

  if (paused) {
    drawOverlay("Paused");
    return;
  }

  if (++count < speed) return;
  count = 0;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Collisions
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= canvas.width ||
    head.y >= canvas.height ||
    snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    gameOverSound.play();
    resetGame();
    return;
  }

  snake.unshift(head);

  // Eating food
  if (head.x === food.x && head.y === food.y) {
    score++;
    eatSound.play();
    scoreDisplay.textContent = score;
    checkLevelUp();
    placeFood();
  } else {
    snake.pop();
  }
}

// ---------------- Start ----------------
resetGame();
requestAnimationFrame(gameLoop);
