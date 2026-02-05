// Classic Snake game logic (deterministic and testable)

export function createRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    // LCG parameters from Numerical Recipes
    s = (1664525 * s + 1013904223) >>> 0;
    return (s & 0xffffffff) / 0x100000000;
  };
}

export function createInitialState({ gridSize = 20, seed = 1, obstacleSpawnEvery = 18, maxObstacles = 6 } = {}) {
  const startX = Math.floor(gridSize / 2);
  const startY = Math.floor(gridSize / 2);
  const snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];

  const rng = createRng(seed);
  const obstacles = [];
  const food = placeFood(snake, obstacles, gridSize, rng);

  return {
    gridSize,
    snake,
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food,
    obstacles,
    obstacleSpawnEvery,
    maxObstacles,
    ticks: 0,
    score: 0,
    gameOver: false,
    paused: false,
    seed,
  };
}

export function setDirection(state, newDir) {
  const { dir, snake } = state;
  if (!newDir) return state;

  // Prevent reversing direction when snake length > 1
  if (snake.length > 1 && dir.x + newDir.x === 0 && dir.y + newDir.y === 0) {
    return state;
  }

  return { ...state, nextDir: newDir };
}

export function step(state, rng) {
  if (state.gameOver || state.paused) return state;

  const dir = state.nextDir || state.dir;
  const head = state.snake[0];
  const next = { x: head.x + dir.x, y: head.y + dir.y };

  // Boundary collision
  if (next.x < 0 || next.y < 0 || next.x >= state.gridSize || next.y >= state.gridSize) {
    return { ...state, dir, gameOver: true };
  }

  // Self collision
  for (let i = 0; i < state.snake.length; i += 1) {
    const s = state.snake[i];
    if (s.x === next.x && s.y === next.y) {
      return { ...state, dir, gameOver: true };
    }
  }

  // Obstacle collision
  for (let i = 0; i < state.obstacles.length; i += 1) {
    const o = state.obstacles[i];
    if (o.x === next.x && o.y === next.y) {
      return { ...state, dir, gameOver: true };
    }
  }

  const ateFood = next.x === state.food.x && next.y === state.food.y;
  const newSnake = [next, ...state.snake];
  if (!ateFood) newSnake.pop();

  const nextFood = ateFood ? placeFood(newSnake, state.obstacles, state.gridSize, rng) : state.food;
  const nextScore = ateFood ? state.score + 1 : state.score;

  let nextObstacles = state.obstacles;
  const nextTicks = state.ticks + 1;
  if (nextTicks % state.obstacleSpawnEvery === 0 && state.obstacles.length < state.maxObstacles) {
    const spawned = placeObstacle(newSnake, nextFood, state.obstacles, state.gridSize, rng);
    if (spawned) nextObstacles = [...state.obstacles, spawned];
  }

  return {
    ...state,
    dir,
    snake: newSnake,
    food: nextFood,
    obstacles: nextObstacles,
    ticks: nextTicks,
    score: nextScore,
  };
}

export function placeFood(snake, obstacles, gridSize, rng) {
  const occupied = new Set([
    ...snake.map((p) => `${p.x},${p.y}`),
    ...obstacles.map((p) => `${p.x},${p.y}`),
  ]);
  const open = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) open.push({ x, y });
    }
  }
  if (open.length === 0) return { x: 0, y: 0 };
  const idx = Math.floor(rng() * open.length);
  return open[idx];
}

export function placeObstacle(snake, food, obstacles, gridSize, rng) {
  const occupied = new Set([
    ...snake.map((p) => `${p.x},${p.y}`),
    ...obstacles.map((p) => `${p.x},${p.y}`),
    `${food.x},${food.y}`,
  ]);
  const open = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) open.push({ x, y });
    }
  }
  if (open.length === 0) return null;
  const idx = Math.floor(rng() * open.length);
  return open[idx];
}

export function togglePause(state) {
  if (state.gameOver) return state;
  return { ...state, paused: !state.paused };
}

export function reset(state, seed) {
  return createInitialState({
    gridSize: state.gridSize,
    seed,
    obstacleSpawnEvery: state.obstacleSpawnEvery,
    maxObstacles: state.maxObstacles,
  });
}
