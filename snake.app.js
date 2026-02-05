import {
  createInitialState,
  setDirection,
  step,
  togglePause,
  reset,
  createRng,
} from './snake.logic.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const statusEl = document.querySelector('#status');
const restartBtn = document.querySelector('#restart');
const pauseBtn = document.querySelector('#pause');
const controlsEl = document.querySelector('#controls');
const startScreen = document.querySelector('#start-screen');
const chooseMatveyBtn = document.querySelector('#choose-matvey');
const chooseDenBtn = document.querySelector('#choose-den');

const GRID_SIZE = 14;
let CELL = 32;
const ASSET_VERSION = '2026-02-05-5';
const TICK_MS = 120;

function resizeCanvas() {
  const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth : GRID_SIZE * CELL;
  const maxBoardWidth = Math.floor(window.innerWidth * 0.5);
  const targetWidth = Math.min(parentWidth, maxBoardWidth);
  const nextCell = Math.max(18, Math.floor(targetWidth / GRID_SIZE));
  CELL = nextCell;
  canvas.width = GRID_SIZE * CELL;
  canvas.height = GRID_SIZE * CELL;
}

resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  render();
});

let seed = Date.now() % 100000;
let rng = createRng(seed);
let state = createInitialState({ gridSize: GRID_SIZE, seed, obstacleSpawnEvery: 18, maxObstacles: 6 });

let headImg = new Image();
headImg.src = `./download.png?v=${ASSET_VERSION}`;

let obstacleImg = new Image();
obstacleImg.src = `./download-1.png?v=${ASSET_VERSION}`;

let foodImg = new Image();
foodImg.src = `./food.png?v=${ASSET_VERSION}`;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background grid
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e6e6e6';
  for (let x = 0; x <= GRID_SIZE; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_SIZE; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(canvas.width, y * CELL);
    ctx.stroke();
  }

  const food = state.food || { x: 0, y: 0 };

  // Food
  if (foodImg.complete && foodImg.naturalWidth > 0) {
    ctx.drawImage(foodImg, food.x * CELL, food.y * CELL, CELL, CELL);
  } else {
    ctx.fillStyle = '#d64545';
    ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);
  }

  // Obstacles
  state.obstacles.forEach((o) => {
    if (obstacleImg.complete && obstacleImg.naturalWidth > 0) {
      ctx.drawImage(obstacleImg, o.x * CELL, o.y * CELL, CELL, CELL);
    } else {
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(o.x * CELL, o.y * CELL, CELL, CELL);
    }
  });

  // Snake
  ctx.fillStyle = '#2f2f2f';
  state.snake.forEach((s, i) => {
    if (i === 0 && headImg.complete && headImg.naturalWidth > 0) {
      ctx.drawImage(headImg, s.x * CELL, s.y * CELL, CELL, CELL);
    } else {
      const inset = i === 0 ? 2 : 3;
      ctx.fillRect(s.x * CELL + inset, s.y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
    }
  });

  scoreEl.textContent = String(state.score);

  if (state.gameOver) {
    statusEl.textContent = 'Game Over — press R to restart';
  } else if (state.paused) {
    statusEl.textContent = 'Paused — press Space to resume';
  } else {
    statusEl.textContent = 'Playing';
  }
}

function tick() {
  if (!started) return;
  state = step(state, rng);
  render();
}

let interval = setInterval(tick, TICK_MS);
let started = false;
document.body.classList.add('not-started');

function restart() {
  seed = (seed + 1) % 100000;
  rng = createRng(seed);
  state = reset(state, seed);
  render();
}

function toggle() {
  state = togglePause(state);
  render();
}

function handleDir(dir) {
  state = setDirection(state, dir);
  render();
}

window.addEventListener('keydown', (e) => {
  if (!started) return;
  const key = e.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') handleDir({ x: 0, y: -1 });
  if (key === 'arrowdown' || key === 's') handleDir({ x: 0, y: 1 });
  if (key === 'arrowleft' || key === 'a') handleDir({ x: -1, y: 0 });
  if (key === 'arrowright' || key === 'd') handleDir({ x: 1, y: 0 });
  if (key === ' ') toggle();
  if (key === 'r') restart();
});

restartBtn.addEventListener('click', restart);
pauseBtn.addEventListener('click', toggle);

controlsEl.addEventListener('click', (e) => {
  if (!started) return;
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'up') handleDir({ x: 0, y: -1 });
  if (action === 'down') handleDir({ x: 0, y: 1 });
  if (action === 'left') handleDir({ x: -1, y: 0 });
  if (action === 'right') handleDir({ x: 1, y: 0 });
});

// Show on-screen controls on touch devices
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  controlsEl.classList.add('visible');
}

function beginGame() {
  started = true;
  document.body.classList.remove('not-started');
  startScreen.style.display = 'none';
  render();
}

chooseMatveyBtn.addEventListener('click', () => {
  headImg = new Image();
  headImg.src = `./download.png?v=${ASSET_VERSION}&t=${Date.now()}`;
  obstacleImg = new Image();
  obstacleImg.src = `./download-1.png?v=${ASSET_VERSION}&t=${Date.now()}`;
  foodImg = new Image();
  foodImg.src = `./food.png?v=${ASSET_VERSION}&t=${Date.now()}`;
  headImg.onload = render;
  beginGame();
});

chooseDenBtn.addEventListener('click', () => {
  headImg = new Image();
  headImg.src = `./download-1.png?v=${ASSET_VERSION}&t=${Date.now()}`;
  obstacleImg = new Image();
  obstacleImg.src = `./download-1.png?v=${ASSET_VERSION}&t=${Date.now()}`;
  foodImg = new Image();
  foodImg.src = `./food-den.png?v=${ASSET_VERSION}&t=${Date.now()}`;
  headImg.onload = render;
  beginGame();
});

headImg.onload = render;
obstacleImg.onload = render;
foodImg.onload = render;
render();
