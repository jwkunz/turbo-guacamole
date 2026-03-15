const statusText = document.getElementById("status");
const summaryText = document.getElementById("summary");
const canvas = document.getElementById("plinko-canvas");
const histogram = document.getElementById("histogram");
const toggleRunButton = document.getElementById("toggle-run");
const resetButton = document.getElementById("reset");
const ctx = canvas.getContext("2d");

const ROWS = 10;
const BUCKETS = ROWS + 1;
const PEG_RADIUS = 5;
const PARTICLE_RADIUS = 4;
const DROP_INTERVAL_MS = 85;
const STEP_TIME_MS = 140;
const MAX_PARTICLES_ON_BOARD = 220;

const board = {
  width: canvas.width,
  height: canvas.height,
  topY: 65,
  leftX: 120,
  rightX: canvas.width - 120,
};

const rowSpacingY = 38;
const colSpacingX = (board.rightX - board.leftX) / ROWS;
const bucketY = board.topY + rowSpacingY * (ROWS + 1);

const pegs = [];
for (let row = 0; row < ROWS; row += 1) {
  const cols = row + 1;
  const rowY = board.topY + rowSpacingY * (row + 1);
  const offset = ((ROWS - row) * colSpacingX) / 2;

  for (let col = 0; col < cols; col += 1) {
    pegs.push({
      x: board.leftX + offset + col * colSpacingX,
      y: rowY,
    });
  }
}

const bucketCounts = Array.from({ length: BUCKETS }, () => 0);
const bars = bucketCounts.map((_, i) => {
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.innerHTML = `<span class="bucket-label">${i}</span><strong class="bucket-count">0</strong>`;
  histogram.appendChild(bar);
  return bar;
});

const particles = [];
let totalDropped = 0;
let lastDropTime = 0;
let isRunning = true;

function randomBeachColor() {
  const palette = ["#ff7f6a", "#ffb703", "#00b4d8", "#48cae4", "#ffd166"];
  return palette[Math.floor(Math.random() * palette.length)];
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
    toY: board.topY + rowSpacingY,
    arrived: false,
    color: randomBeachColor(),
    lastStep: now,
  };
}

function spawnParticle(now) {
  if (!isRunning || particles.length >= MAX_PARTICLES_ON_BOARD) {
    return;
  }

  particles.push(createParticle(now));
  totalDropped += 1;
}

function updateParticle(particle, now) {
  const elapsed = now - particle.lastStep;
  const progress = Math.min(1, elapsed / STEP_TIME_MS);

  particle.x = particle.fromX + (particle.toX - particle.fromX) * progress;
  particle.y = particle.fromY + (particle.toY - particle.fromY) * progress;

  if (progress < 1) {
    return;
  }

  particle.lastStep = now;
  particle.currentRow += 1;

  if (particle.currentRow >= ROWS) {
    particle.arrived = true;
    bucketCounts[particle.positionIndex] += 1;
    return;
  }

  const goRight = Math.random() >= 0.5;
  if (goRight) {
    particle.positionIndex += 1;
  }

  const nextY = board.topY + rowSpacingY * (particle.currentRow + 2);
  const offset = ((ROWS - (particle.currentRow + 1)) * colSpacingX) / 2;
  const centerX = board.leftX + offset + particle.positionIndex * colSpacingX;
  const wobble = (Math.random() - 0.5) * 10;

  particle.fromX = particle.x;
  particle.fromY = particle.y;
  particle.toX = centerX + wobble;
  particle.toY = nextY;
}

function drawBoard() {
  ctx.clearRect(0, 0, board.width, board.height);

  ctx.fillStyle = "rgba(0, 119, 182, 0.22)";
  ctx.fillRect(board.leftX - 30, bucketY + 6, board.rightX - board.leftX + 60, 120);

  ctx.strokeStyle = "#0077b6";
  ctx.lineWidth = 2;

  for (let i = 0; i <= BUCKETS; i += 1) {
    const x = board.leftX + i * colSpacingX - colSpacingX / 2;
    ctx.beginPath();
    ctx.moveTo(x, bucketY + 8);
    ctx.lineTo(x, board.height - 35);
    ctx.stroke();
  }

  for (const peg of pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#f4a261";
    ctx.fill();
    ctx.strokeStyle = "#99582a";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (const particle of particles) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 58, 99, 0.7)";
    ctx.stroke();
  }
}

function updateHistogram() {
  const maxCount = Math.max(...bucketCounts, 1);

  bars.forEach((bar, index) => {
    const value = bucketCounts[index];
    const heightPercent = (value / maxCount) * 100;
    const countLabel = bar.querySelector(".bucket-count");

    bar.style.height = `${Math.max(heightPercent, 2)}%`;
    bar.title = `Bucket ${index}: ${value}`;
    countLabel.textContent = `${value}`;
  });

  const collected = bucketCounts.reduce((sum, count) => sum + count, 0);
  let modeBucket = 0;
  let modeValue = bucketCounts[0];

  bucketCounts.forEach((value, index) => {
    if (value > modeValue) {
      modeBucket = index;
      modeValue = value;
    }
  });

  summaryText.textContent = `Dropped: ${totalDropped} • Collected: ${collected} • Mode Bucket: ${modeBucket}`;
}

function removeArrivedParticles() {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    if (particles[i].arrived) {
      particles.splice(i, 1);
    }
  }
}

function tick(now) {
  if (!lastDropTime || now - lastDropTime >= DROP_INTERVAL_MS) {
    spawnParticle(now);
    lastDropTime = now;
  }

  for (const particle of particles) {
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
  isRunning = !isRunning;
  toggleRunButton.textContent = isRunning ? "Pause" : "Resume";
  statusText.textContent = isRunning ? "Simulation running automatically." : "Simulation paused.";
});

resetButton.addEventListener("click", () => {
  particles.length = 0;
  bucketCounts.fill(0);
  totalDropped = 0;
  lastDropTime = 0;
  statusText.textContent = isRunning ? "Simulation restarted." : "Simulation paused.";
});

statusText.textContent = "Simulation running automatically.";
requestAnimationFrame(tick);
