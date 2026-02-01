// Mystery board: space types are hidden until landed on.
// Auto resolves 5 seconds after landing.

const boardEl = document.getElementById("board");
const statusLineEl = document.getElementById("statusLine");

const playerCountEl = document.getElementById("playerCount");
const nameFieldsEl = document.getElementById("nameFields");
const startBtn = document.getElementById("startBtn");

const turnNameEl = document.getElementById("turnName");
const lastRollEl = document.getElementById("lastRoll");
const roundNumEl = document.getElementById("roundNum");

const landedTextEl = document.getElementById("landedText");
const revealTextEl = document.getElementById("revealText");
const cardTextEl = document.getElementById("cardText");
const autoInEl = document.getElementById("autoIn");

const rollBtn = document.getElementById("rollBtn");
const endTurnBtn = document.getElementById("endTurnBtn");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const restartBtn = document.getElementById("restartBtn");

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const randi = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const TOKEN_COLORS = ["#7b61ff", "#23f5a3", "#ffd24a", "#46d2ff"];

// Types exist internally, but are hidden on the board UI
const SPACE_TYPES = {
  START: "start",
  DELAY: "delay",
  SUPPORT: "support",
  CHECKPOINT: "checkpoint",
  END: "end"
};

// 32 spaces, displayed snake-style on an 8x4 grid
const SPACES = [
  { type: SPACE_TYPES.START, label: "Diagnosis: You need treatment" },
  { type: SPACE_TYPES.DELAY, label: "Insurance review" },
  { type: SPACE_TYPES.CHECKPOINT, label: "Primary care referral" },
  { type: SPACE_TYPES.DELAY, label: "Paperwork missing" },
  { type: SPACE_TYPES.SUPPORT, label: "Patient navigator offered" },
  { type: SPACE_TYPES.DELAY, label: "Scan rescheduled" },
  { type: SPACE_TYPES.DELAY, label: "Transportation delay" },
  { type: SPACE_TYPES.CHECKPOINT, label: "Imaging completed" },

  { type: SPACE_TYPES.DELAY, label: "Prior authorization" },
  { type: SPACE_TYPES.SUPPORT, label: "Reliable ride available" },
  { type: SPACE_TYPES.DELAY, label: "Pharmacy out of stock" },
  { type: SPACE_TYPES.DELAY, label: "Work schedule conflict" },
  { type: SPACE_TYPES.CHECKPOINT, label: "Lab work done" },
  { type: SPACE_TYPES.DELAY, label: "Insurance call-back" },
  { type: SPACE_TYPES.DELAY, label: "Childcare issue" },
  { type: SPACE_TYPES.CHECKPOINT, label: "Treatment plan finalized" },

  { type: SPACE_TYPES.DELAY, label: "Specialist visit delayed" },
  { type: SPACE_TYPES.SUPPORT, label: "Paid sick leave" },
  { type: SPACE_TYPES.DELAY, label: "Copay surprise" },
  { type: SPACE_TYPES.DELAY, label: "Clinic understaffed" },
  { type: SPACE_TYPES.CHECKPOINT, label: "Port placement scheduled" },
  { type: SPACE_TYPES.DELAY, label: "Paperwork error again" },
  { type: SPACE_TYPES.SUPPORT, label: "Community support fund" },
  { type: SPACE_TYPES.DELAY, label: "Ride canceled last minute" },

  { type: SPACE_TYPES.DELAY, label: "Appointment moved earlier" },
  { type: SPACE_TYPES.CHECKPOINT, label: "Pre-chemo checklist" },
  { type: SPACE_TYPES.DELAY, label: "Insurance denial (appeal)" },
  { type: SPACE_TYPES.SUPPORT, label: "Navigator escalates case" },
  { type: SPACE_TYPES.DELAY, label: "Long hold time" },
  { type: SPACE_TYPES.CHECKPOINT, label: "Clearance received" },
  { type: SPACE_TYPES.DELAY, label: "Traffic" },
  { type: SPACE_TYPES.END, label: "Treatment: You made it" }
];

const delayCards = [
  { text: "Insurance needs more documentation. Move back 3 spaces.", effect: (g, p) => movePlayer(p, -3) },
  { text: "Scan rescheduled. Skip your next turn.", effect: (g, p) => (p.skipTurns += 1) },
  { text: "Transportation canceled. Move back 2 spaces.", effect: (g, p) => movePlayer(p, -2) },
  { text: "Pharmacy delay. Move back 1 space.", effect: (g, p) => movePlayer(p, -1) },
  { text: "Work schedule conflict. Lose 1 turn.", effect: (g, p) => (p.skipTurns += 1) },
  { text: "Paperwork error. Return to the last checkpoint.", effect: (g, p) => moveToLastCheckpoint(p) },
  { text: "Clinic understaffed. Everyone skips a turn.", effect: (g, p) => g.players.forEach(x => x.skipTurns += 1) }
];

const supportCards = [
  { text: "Patient Navigator: Block the next delay card that hits you.", effect: (g, p) => (p.blockDelay += 1) },
  { text: "Reliable Transportation: Move forward 2 spaces.", effect: (g, p) => movePlayer(p, +2) },
  { text: "Paid Sick Leave: Take one extra roll right now.", effect: (g, p) => (g.extraRoll = true) },
  { text: "Community Support: Remove one skip-turn penalty.", effect: (g, p) => (p.skipTurns = Math.max(0, p.skipTurns - 1)) }
];

let game = null;

// Auto resolve timer state
let pending = {
  active: false,
  secondsLeft: 0,
  intervalId: null,
  resolveFn: null
};

function clearPending() {
  pending.active = false;
  pending.secondsLeft = 0;
  pending.resolveFn = null;
  autoInEl.textContent = "-";
  if (pending.intervalId) {
    clearInterval(pending.intervalId);
    pending.intervalId = null;
  }
}

function startAutoResolve(seconds, resolveFn) {
  clearPending();
  pending.active = true;
  pending.secondsLeft = seconds;
  pending.resolveFn = resolveFn;
  autoInEl.textContent = String(pending.secondsLeft);

  pending.intervalId = setInterval(() => {
    pending.secondsLeft -= 1;
    autoInEl.textContent = String(Math.max(0, pending.secondsLeft));

    if (pending.secondsLeft <= 0) {
      clearPending();
      if (typeof resolveFn === "function") resolveFn();
    }
  }, 1000);
}

function makeNameInputs(count) {
  nameFieldsEl.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.placeholder = `Player ${i + 1} name`;
    input.value = `Player ${i + 1}`;
    nameFieldsEl.appendChild(input);
  }
}

playerCountEl.addEventListener("change", () => makeNameInputs(Number(playerCountEl.value)));
makeNameInputs(Number(playerCountEl.value));

function newGame(names) {
  return {
    round: 1,
    turnIndex: 0,
    lastRoll: null,
    extraRoll: false,
    revealed: new Set(), // positions that have been revealed
    players: names.map((name, i) => ({
      name,
      color: TOKEN_COLORS[i],
      pos: 0,
      skipTurns: 0,
      blockDelay: 0
    }))
  };
}

function currentPlayer(g) {
  return g.players[g.turnIndex];
}

function movePlayer(p, delta) {
  p.pos = clamp(p.pos + delta, 0, SPACES.length - 1);
}

function moveToLastCheckpoint(p) {
  let last = 0;
  for (let i = 0; i <= p.pos; i++) {
    const t = SPACES[i].type;
    if (t === SPACE_TYPES.CHECKPOINT || t === SPACE_TYPES.START) last = i;
  }
  p.pos = last;
}

function snakeIndexToGrid(i) {
  // 8 columns, 4 rows
  const cols = 8;
  const row = Math.floor(i / cols);
  const colInRow = i % cols;
  const col = (row % 2 === 0) ? colInRow : (cols - 1 - colInRow);
  return { row, col };
}

function renderBoard(g) {
  boardEl.innerHTML = "";

  const cols = 8;
  const total = SPACES.length;

  // Create empty grid first
  const grid = Array.from({ length: total }, () => null);

  for (let i = 0; i < total; i++) {
    const { row, col } = snakeIndexToGrid(i);
    const gridPos = row * cols + col;

    const cell = document.createElement("div");
    cell.className = "space";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = `#${i}`;
    cell.appendChild(num);

    const mystery = document.createElement("div");
    mystery.className = "mystery";

    // Hidden until revealed or until game not started
    const isRevealed = g ? g.revealed.has(i) : false;
    mystery.textContent = isRevealed ? SPACES[i].label : "???";
    cell.appendChild(mystery);

    const tokens = document.createElement("div");
    tokens.className = "tokens";

    if (g) {
      g.players.forEach((p) => {
        if (p.pos === i) {
          const t = document.createElement("div");
          t.className = "token";
          t.style.background = p.color;
          t.title = p.name;
          tokens.appendChild(t);
        }
      });
    }

    cell.appendChild(tokens);
    grid[gridPos] = cell;
  }

  grid.forEach((cell) => boardEl.appendChild(cell));

  if (g) {
    const p = currentPlayer(g);
    highlightActiveSpace(g, p.pos);
  }
}

function highlightActiveSpace(g, pos) {
  // Find the DOM element that corresponds to the snake-mapped position
  const cols = 8;
  const { row, col } = snakeIndexToGrid(pos);
  const gridIndex = row * cols + col;

  [...boardEl.children].forEach((c, idx) => {
    if (idx === gridIndex) c.classList.add("active");
    else c.classList.remove("active");
  });
}

function renderPlayers(g) {
  const playersListEl = document.getElementById("playersList");
  playersListEl.innerHTML = "";

  g.players.forEach((p) => {
    const row = document.createElement("div");
    row.className = "playerRow";

    const left = document.createElement("div");
    left.innerHTML =
      `<div><b style="color:${p.color}">●</b> <b>${p.name}</b></div>` +
      `<div style="opacity:.85;font-size:12px">Position: #${p.pos}</div>`;

    const right = document.createElement("div");
    right.className = "badgesSmall";

    const s1 = document.createElement("span");
    s1.className = "small";
    s1.textContent = `Skip: ${p.skipTurns}`;

    const s2 = document.createElement("span");
    s2.className = "small good";
    s2.textContent = `Block: ${p.blockDelay}`;

    right.appendChild(s1);
    right.appendChild(s2);

    row.appendChild(left);
    row.appendChild(right);
    playersListEl.appendChild(row);
  });
}

function setTurnUI(g) {
  const p = currentPlayer(g);
  turnNameEl.textContent = p.name;
  roundNumEl.textContent = String(g.round);
  lastRollEl.textContent = g.lastRoll === null ? "-" : String(g.lastRoll);

  landedTextEl.textContent = `Position #${p.pos}`;
  revealTextEl.textContent = "-";
  cardTextEl.textContent = "Roll the die.";

  rollBtn.disabled = false;
  endTurnBtn.disabled = true;

  statusLineEl.textContent = `${p.name}'s turn. Roll the die.`;
  highlightActiveSpace(g, p.pos);

  clearPending();
}

function drawDelay() {
  return delayCards[randi(0, delayCards.length - 1)];
}
function drawSupport() {
  return supportCards[randi(0, supportCards.length - 1)];
}

function revealSpace(g, pos) {
  g.revealed.add(pos);
}

function applyLandingWithAuto(g, p) {
  const space = SPACES[p.pos];

  // Reveal this space now
  revealSpace(g, p.pos);
  renderBoard(g);

  // Show reveal details on the right panel
  landedTextEl.textContent = `Position #${p.pos}`;
  revealTextEl.textContent = space.label;

  // End tile is instant win
  if (space.type === SPACE_TYPES.END) {
    winGame(p);
    return;
  }

  rollBtn.disabled = true;
  endTurnBtn.disabled = true;

  // Figure out what happens, then auto-apply after 5 seconds
  let resolveFn = () => {
    // No-op safety
  };

  if (space.type === SPACE_TYPES.START || space.type === SPACE_TYPES.CHECKPOINT) {
    cardTextEl.textContent =
      "Checkpoint.\nNo card drawn.\nThis is a rare moment with fewer delays.";
    resolveFn = () => {
      endTurnBtn.disabled = false;
      statusLineEl.textContent = "Resolved. End your turn.";
    };
  }

  if (space.type === SPACE_TYPES.SUPPORT) {
    const card = drawSupport();
    cardTextEl.textContent = `SUPPORT FOUND\n\n${card.text}`;
    resolveFn = () => {
      card.effect(g, p);
      renderPlayers(g);
      renderBoard(g);
      endTurnBtn.disabled = false;
      statusLineEl.textContent = "Support applied. End your turn.";
    };
  }

  if (space.type === SPACE_TYPES.DELAY) {
    if (p.blockDelay > 0) {
      cardTextEl.textContent =
        "DELAY HIT\n\nYour support blocked the delay.\n(Block Delay used)";
      resolveFn = () => {
        p.blockDelay -= 1;
        renderPlayers(g);
        endTurnBtn.disabled = false;
        statusLineEl.textContent = "Delay blocked. End your turn.";
      };
    } else {
      const card = drawDelay();
      cardTextEl.textContent = `DELAY HIT\n\n${card.text}`;
      resolveFn = () => {
        card.effect(g, p);

        // Reveal the new position too, since the player got moved by the system
        revealSpace(g, p.pos);

        renderPlayers(g);
        renderBoard(g);

        // If a delay pushed them into Treatment
        if (SPACES[p.pos].type === SPACE_TYPES.END) {
          winGame(p);
          return;
        }

        endTurnBtn.disabled = false;
        statusLineEl.textContent = "Delay applied. End your turn.";
      };
    }
  }

  statusLineEl.textContent = "Revealed. Auto resolving...";
  startAutoResolve(5, resolveFn);
}

function nextTurn(g) {
  g.extraRoll = false;
  g.lastRoll = null;

  // Advance
  g.turnIndex = (g.turnIndex + 1) % g.players.length;
  if (g.turnIndex === 0) g.round += 1;

  // Auto-skip players who have skipTurns
  let guard = 0;
  while (guard < 12) {
    const p = currentPlayer(g);
    if (p.skipTurns > 0) {
      p.skipTurns -= 1;
      statusLineEl.textContent = `${p.name} loses a turn due to a delay.`;
      renderPlayers(g);

      g.turnIndex = (g.turnIndex + 1) % g.players.length;
      if (g.turnIndex === 0) g.round += 1;
      guard += 1;
      continue;
    }
    break;
  }

  setTurnUI(g);
  renderBoard(g);
  renderPlayers(g);
}

function rollDie() {
  if (!game) return;
  if (pending.active) return; // prevent rolling during auto-resolve

  const p = currentPlayer(game);

  const roll = randi(1, 6);
  game.lastRoll = roll;
  lastRollEl.textContent = String(roll);

  // Move
  movePlayer(p, roll);

  statusLineEl.textContent = `${p.name} rolled a ${roll}. Space revealed in 5 seconds.`;
  applyLandingWithAuto(game, p);

  renderPlayers(game);
  renderBoard(game);
}

function winGame(player) {
  clearPending();

  modalTitle.textContent = `${player.name} reached Treatment`;
  modalBody.textContent =
`You made it to treatment.

Notice what decided the outcome:
- delays were frequent and random
- supports were rare but powerful

Takeaway:
Reaching cancer treatment should not depend on luck.`;

  modal.classList.remove("hidden");
  rollBtn.disabled = true;
  endTurnBtn.disabled = true;
}

function hardResetUI() {
  modal.classList.add("hidden");
  statusLineEl.textContent = "Press Start to begin.";
  turnNameEl.textContent = "-";
  lastRollEl.textContent = "-";
  roundNumEl.textContent = "-";
  landedTextEl.textContent = "-";
  revealTextEl.textContent = "-";
  cardTextEl.textContent = "Set players, then press Start.";
  rollBtn.disabled = true;
  endTurnBtn.disabled = true;
  autoInEl.textContent = "-";
  clearPending();
}

// Events
startBtn.addEventListener("click", () => {
  const count = Number(playerCountEl.value);
  const inputs = [...nameFieldsEl.querySelectorAll("input")].slice(0, count);
  const names = inputs.map((inp, i) => (inp.value || `Player ${i + 1}`).trim());

  game = newGame(names);

  // Reveal only the start tile at the beginning
  game.revealed.add(0);

  renderBoard(game);
  renderPlayers(game);
  setTurnUI(game);

  rollBtn.disabled = false;
  statusLineEl.textContent = "Game started. Roll the die.";
});

rollBtn.addEventListener("click", rollDie);

endTurnBtn.addEventListener("click", () => {
  if (!game) return;
  if (pending.active) return;
  nextTurn(game);
});

restartBtn.addEventListener("click", () => {
  game = null;
  hardResetUI();
  renderBoard(null);
  makeNameInputs(Number(playerCountEl.value));
});

// Initial render
hardResetUI();
renderBoard(null);
makeNameInputs(Number(playerCountEl.value));
