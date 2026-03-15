const statusText = document.getElementById("status");
const summaryText = document.getElementById("summary");
const canvas = document.getElementById("plinko-canvas");
const histogram = document.getElementById("histogram");
const toggleRunButton = document.getElementById("toggle-run");
const resetButton = document.getElementById("reset");
const rowsDial = document.getElementById("rows-dial");
const speedDial = document.getElementById("speed-dial");
const rowsValue = document.getElementById("rows-value");
const binsValue = document.getElementById("bins-value");
const speedValue = document.getElementById("speed-value");
const ctx = canvas.getContext("2d");

const PEG_RADIUS = 5;
const PARTICLE_RADIUS = 4;
const BASE_DROP_INTERVAL_MS = 85;
const BASE_STEP_TIME_MS = 140;
const MAX_PARTICLES_ON_BOARD = 220;

const board = {
  width: canvas.width,
  height: canvas.height,
  topY: 65,
  leftX: 120,
  rightX: canvas.width - 120,
};

const state = {
  rows: Number(rowsDial.value),
  speedMultiplier: Number(speedDial.value),
  pegs: [],
  bucketCounts: [],
  bars: [],
  particles: [],
  totalDropped: 0,
  lastDropTime: 0,
  isRunning: true,
  rowSpacingY: 38,
  colSpacingX: 0,
  bucketY: 0,
};

function randomBeachColor() {
  const palette = ["#ff7f6a", "#ffb703", "#00b4d8", "#48cae4", "#ffd166"];
  return palette[Math.floor(Math.random() * palette.length)];
}

function updateDialReadout() {
  rowsValue.textContent = `${state.rows}`;
  binsValue.textContent = `${state.rows + 1}`;
  speedValue.textContent = `${state.speedMultiplier.toFixed(1)}×`;
}

function buildBoardGeometry() {
  state.colSpacingX = (board.rightX - board.leftX) / state.rows;
  state.rowSpacingY = Math.min(44, (board.height - board.topY - 170) / (state.rows + 1));
  state.bucketY = board.topY + state.rowSpacingY * (state.rows + 1);

  state.pegs = [];
  for (let row = 0; row < state.rows; row += 1) {
    const cols = row + 1;
    const rowY = board.topY + state.rowSpacingY * (row + 1);
    const offset = ((state.rows - row) * state.colSpacingX) / 2;

    for (let col = 0; col < cols; col += 1) {
      state.pegs.push({
        x: board.leftX + offset + col * state.colSpacingX,
        y: rowY,
      });
    }
  }
}

function rebuildHistogram() {
  histogram.innerHTML = "";
  state.bucketCounts = Array.from({ length: state.rows + 1 }, () => 0);
  state.bars = state.bucketCounts.map((_, i) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.innerHTML = `<span class="bucket-label">${i}</span><strong class="bucket-count">0</strong>`;
    histogram.appendChild(bar);
    return bar;
  });

  histogram.style.gridTemplateColumns = `repeat(${state.bucketCounts.length}, minmax(0, 1fr))`;
}

function createParticle(now) {
  return {
    currentRow: -1,
    positionIndex: 0,
    x: board.width / 2,
    y: board.topY - 35,
    fromX: board.width / 2,
    fromY: board.topY - 35,
    toX: board.width / 2,
    toY: board.topY + state.rowSpacingY,
    arrived: false,
    color: randomBeachColor(),
    lastStep: now,
  };
}

function getDropInterval() {
  return BASE_DROP_INTERVAL_MS / state.speedMultiplier;
}

function getStepTime() {
  return BASE_STEP_TIME_MS / state.speedMultiplier;
}

function spawnParticle(now) {
  if (!state.isRunning || state.particles.length >= MAX_PARTICLES_ON_BOARD) {
    return;
  }

  state.particles.push(createParticle(now));
  state.totalDropped += 1;
}

function updateParticle(particle, now) {
  const elapsed = now - particle.lastStep;
  const progress = Math.min(1, elapsed / getStepTime());

  particle.x = particle.fromX + (particle.toX - particle.fromX) * progress;
  particle.y = particle.fromY + (particle.toY - particle.fromY) * progress;

  if (progress < 1) {
    return;
  }

  particle.lastStep = now;
  particle.currentRow += 1;

  if (particle.currentRow >= state.rows) {
    particle.arrived = true;
    state.bucketCounts[particle.positionIndex] += 1;
    return;
  }

  const goRight = Math.random() >= 0.5;
  if (goRight) {
    particle.positionIndex += 1;
  }

  const nextY = board.topY + state.rowSpacingY * (particle.currentRow + 2);
  const offset = ((state.rows - (particle.currentRow + 1)) * state.colSpacingX) / 2;
  const centerX = board.leftX + offset + particle.positionIndex * state.colSpacingX;
  const wobble = (Math.random() - 0.5) * 10;

  particle.fromX = particle.x;
  particle.fromY = particle.y;
  particle.toX = centerX + wobble;
  particle.toY = nextY;
}

function drawBoard() {
  ctx.clearRect(0, 0, board.width, board.height);

  ctx.fillStyle = "rgba(0, 119, 182, 0.22)";
  ctx.fillRect(board.leftX - 30, state.bucketY + 6, board.rightX - board.leftX + 60, 120);

  ctx.strokeStyle = "#0077b6";
  ctx.lineWidth = 2;

  for (let i = 0; i <= state.bucketCounts.length; i += 1) {
    const x = board.leftX + i * state.colSpacingX - state.colSpacingX / 2;
    ctx.beginPath();
    ctx.moveTo(x, state.bucketY + 8);
    ctx.lineTo(x, board.height - 35);
    ctx.stroke();
  }

  for (const peg of state.pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#f4a261";
    ctx.fill();
    ctx.strokeStyle = "#99582a";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (const particle of state.particles) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 58, 99, 0.7)";
    ctx.stroke();
  }
}

function updateHistogram() {
  const maxCount = Math.max(...state.bucketCounts, 1);

  state.bars.forEach((bar, index) => {
    const value = state.bucketCounts[index];
    const heightPercent = (value / maxCount) * 100;
    const countLabel = bar.querySelector(".bucket-count");

    bar.style.height = `${Math.max(heightPercent, 2)}%`;
    bar.title = `Bucket ${index}: ${value}`;
    countLabel.textContent = `${value}`;
  });

  const collected = state.bucketCounts.reduce((sum, count) => sum + count, 0);
  let modeBucket = 0;
  let modeValue = state.bucketCounts[0];

  state.bucketCounts.forEach((value, index) => {
    if (value > modeValue) {
      modeBucket = index;
      modeValue = value;
    }
  });

  summaryText.textContent = `Dropped: ${state.totalDropped} • Collected: ${collected} • Mode Bucket: ${modeBucket}`;
}

function removeArrivedParticles() {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    if (state.particles[i].arrived) {
      state.particles.splice(i, 1);
    }
  }
}

function resetSimulation(message) {
  state.particles.length = 0;
  state.bucketCounts.fill(0);
  state.totalDropped = 0;
  state.lastDropTime = 0;
  statusText.textContent = message;
}

function applyRows(nextRows) {
  state.rows = nextRows;
  updateDialReadout();
  buildBoardGeometry();
  rebuildHistogram();
  resetSimulation(`Board resized to ${state.rows} rows and ${state.rows + 1} bins.`);
}

function tick(now) {
  if (!state.lastDropTime || now - state.lastDropTime >= getDropInterval()) {
    spawnParticle(now);
    state.lastDropTime = now;
  }

  for (const particle of state.particles) {
    if (!particle.arrived) {
      updateParticle(particle, now);
    }
  }

  removeArrivedParticles();
  drawBoard();
  updateHistogram();
  requestAnimationFrame(tick);
}

toggleRunButton.addEventListener("click", () => {
  state.isRunning = !state.isRunning;
  toggleRunButton.textContent = state.isRunning ? "Pause" : "Resume";
  statusText.textContent = state.isRunning ? "Simulation running automatically." : "Simulation paused.";
});

resetButton.addEventListener("click", () => {
  resetSimulation(state.isRunning ? "Simulation restarted." : "Simulation paused.");
});

rowsDial.addEventListener("input", () => {
  const nextRows = Number(rowsDial.value);
  if (nextRows !== state.rows) {
    applyRows(nextRows);
  }
});

speedDial.addEventListener("input", () => {
  state.speedMultiplier = Number(speedDial.value);
  updateDialReadout();
  statusText.textContent = `Spin speed set to ${state.speedMultiplier.toFixed(1)}×.`;
});

updateDialReadout();
buildBoardGeometry();
rebuildHistogram();
statusText.textContent = "Simulation running automatically.";
requestAnimationFrame(tick);
