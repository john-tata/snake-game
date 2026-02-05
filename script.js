const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboardList');

let grid, snake, dx, dy, food, score, count;
let gameRunning = false;
let paused = false;
let leaderboard = [];

// 🔊 Sounds
const eatSound = new Audio('eat.mp3');
const gameOverSound = new Audio('gameover.mp3');
const pauseSound = new Audio('pause.mp3');

// --- Responsive canvas ---
function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  canvas.width = Math.floor(size / 20) * 20; // 🔒 lock to grid
  canvas.height = canvas.width;
  grid = canvas.width / 20;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Reset game ---
function resetGame() {
  snake = [{
    x: grid * 10,
    y: grid * 10
  }];
  dx = 0;
  dy = 0;
  score = 0;
  count = 0;
  gameRunning = false;
  paused = false;
  scoreDisplay.textContent = score;
  placeFood();
}

// --- Place food ---
function placeFood() {
  food = {
    x: Math.floor(Math.random() * (canvas.width / grid)) * grid,
    y: Math.floor(Math.random() * (canvas.height / grid)) * grid
  };

  // avoid spawning on snake
  if (snake.some(s => s.x === food.x && s.y === food.y)) {
    placeFood();
  }
}

// --- Keyboard ---
document.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === ' ') {
    paused = !paused;
    pauseSound.play();
    return;
  }

  if (!gameRunning) gameRunning = true;
  if (paused) return;

  if (e.key === 'ArrowLeft' && dx === 0) { dx = -grid; dy = 0; }
  if (e.key === 'ArrowRight' && dx === 0) { dx = grid; dy = 0; }
  if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -grid; }
  if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = grid; }
});

// --- Swipe controls ---
let startX = 0;
let startY = 0;

canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
}, { passive: false });

canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dxSwipe = t.clientX - startX;
  const dySwipe = t.clientY - startY;

  if (!gameRunning) gameRunning = true;
  if (paused) return;

  if (Math.abs(dxSwipe) > Math.abs(dySwipe)) {
    if (dxSwipe > 30 && dx === 0) { dx = grid; dy = 0; }
    if (dxSwipe < -30 && dx === 0) { dx = -grid; dy = 0; }
  } else {
    if (dySwipe > 30 && dy === 0) { dx = 0; dy = grid; }
    if (dySwipe < -30 && dy === 0) { dx = 0; dy = -grid; }
  }
});

// --- Leaderboard ---
function updateLeaderboard(score) {
  leaderboard.push(score);
  leaderboard.sort((a,b) => b - a);
  leaderboard = leaderboard.slice(0,5);

  leaderboardList.innerHTML = '';
  leaderboard.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    leaderboardList.appendChild(li);
  });
}

// --- Game loop ---
function gameLoop() {
  requestAnimationFrame(gameLoop);
  if (!gameRunning || paused) return;
  if (++count < 15) return;
  count = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const head = {
    x: snake[0].x + dx,
    y: snake[0].y + dy
  };

  // ✅ correct wall collision
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= canvas.width ||
    head.y >= canvas.height ||
    snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    gameOverSound.play();
    updateLeaderboard(score);
    resetGame();
    return;
  }

  snake.unshift(head);

  // ✅ food collision now PERFECT
  if (head.x === food.x && head.y === food.y) {
    score++;
    eatSound.play();
    scoreDisplay.textContent = score;
    placeFood();
  } else {
    snake.pop();
  }

  ctx.fillStyle = 'red';
  ctx.fillRect(food.x, food.y, grid - 1, grid - 1);

  ctx.fillStyle = 'lime';
  snake.forEach(s => ctx.fillRect(s.x, s.y, grid - 1, grid - 1));
}

resetGame();
requestAnimationFrame(gameLoop);
