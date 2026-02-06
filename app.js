/* Two Patients, One Diagnosis: max-feature demo
   Controls:
   N = Next Step
   R = Reset
   1 = Intervene A
   2 = Intervene B
*/

const $ = (id) => document.getElementById(id);

const ui = {
  nextBtn: $("nextBtn"),
  pauseBtn: $("pauseBtn"),
  tutorialBtn: $("tutorialBtn"),
  resetBtn: $("resetBtn"),

  autoToggle: $("autoToggle"),
  reduceMotion: $("reduceMotion"),
  soundToggle: $("soundToggle"),

  seedText: $("seedText"),
  autoText: $("autoText"),
  countdownText: $("countdownText"),
  gapText: $("gapText"),

  daysA: $("daysA"), stressA: $("stressA"), stepA: $("stepA"), fillA: $("fillA"), logA: $("logA"), invA: $("invA"),
  daysB: $("daysB"), stressB: $("stressB"), stepB: $("stepB"), fillB: $("fillB"), logB: $("logB"), invB: $("invB"),

  navA: $("navA"), rideA: $("rideA"), leaveA: $("leaveA"),
  navB: $("navB"), rideB: $("rideB"), leaveB: $("leaveB"),

  currentStep: $("currentStep"),
  eventLine: $("eventLine"),
  eventMeta: $("eventMeta"),
  interveneA: $("interveneA"),
  interveneB: $("interveneB"),

  polNavigator: $("polNavigator"),
  polTransit: $("polTransit"),
  polAdmin: $("polAdmin"),
  polLeave: $("polLeave"),
  polCapacity: $("polCapacity"),

  chart: $("chart"),
  notice: $("notice"),

  saveBtn: $("saveBtn"),
  loadBtn: $("loadBtn"),
  shareBtn: $("shareBtn"),
  exportBtn: $("exportBtn"),
  clearBtn: $("clearBtn"),

  modal: $("modal"),
  modalTitle: $("modalTitle"),
  modalBody: $("modalBody"),
  closeModal: $("closeModal"),
  playAgain: $("playAgain"),
};

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// Deterministic PRNG (so share links replay)
function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr){ return arr[Math.floor(rng() * arr.length)]; }

const STORAGE_KEY = "twoPatientsSimV2";

let state = null;
let timer = null;
let paused = false;

function defaultSeed(){
  const url = new URL(location.href);
  const s = url.searchParams.get("seed");
  if (s && /^\d+$/.test(s)) return Number(s);
  return Math.floor(Math.random() * 1_000_000_000);
}

function newState(seed){
  const rng = mulberry32(seed);

  return {
    seed,
    rng,
    stepIndex: -1,
    done: false,

    // last revealed event per patient, can be canceled via intervene
    pending: { A: null, B: null, stepName: null },

    A: makePatient("A"),
    B: makePatient("B"),
  };
}

function makePatient(label){
  return {
    label,
    days: 0,
    stress: 0,
    step: 0,
    stickers: ["NAV"], // starter sticker
    breakdown: { INS:0, ADM:0, TRN:0, WRK:0, CHD:0, CLN:0 },
    log: []
  };
}

function supportsFor(patientLabel){
  // personal supports toggles
  const nav = patientLabel === "A" ? ui.navA.checked : ui.navB.checked;
  const ride = patientLabel === "A" ? ui.rideA.checked : ui.rideB.checked;
  const leave = patientLabel === "A" ? ui.leaveA.checked : ui.leaveB.checked;
  return { nav, ride, leave };
}

function policies(){
  return {
    nav: ui.polNavigator.checked,
    trn: ui.polTransit.checked,
    adm: ui.polAdmin.checked,
    leave: ui.polLeave.checked,
    cap: ui.polCapacity.checked,
  };
}

// Delay reduction logic
function applyModifiers(patientLabel, event){
  const s = supportsFor(patientLabel);
  const p = policies();

  let days = event.baseDays;
  let stress = event.stress;

  // Personal supports
  if (event.cat === "ADM" && s.nav) days -= 2;
  if (event.cat === "INS" && s.nav) days -= 2;
  if (event.cat === "TRN" && s.ride) days -= 2;
  if (event.cat === "WRK" && s.leave) days -= 2;

  // Policy levers
  if ((event.cat === "ADM" || event.cat === "INS") && p.adm) days -= 2;
  if (event.cat === "TRN" && p.trn) days -= 2;
  if (event.cat === "WRK" && p.leave) days -= 2;
  if (event.cat === "CLN" && p.cap) days -= 2;
  if ((event.cat === "ADM" || event.cat === "INS") && p.nav) days -= 1;

  // Stress also reacts
  if (s.nav || p.nav) stress -= 1;
  if (days > 8) stress += 1;

  return { days: clamp(days, 0, 30), stress: clamp(stress, 0, 10) };
}

// Earn stickers occasionally at checkpoints
function maybeAwardSticker(patient, rng){
  const roll = rng();
  if (roll < 0.22){
    const s = pick(rng, window.STICKERS);
    patient.stickers.push(s.key);
    patient.log.unshift({
      kind:"support",
      title:`Sticker gained: ${s.name} ${s.ico}`,
      detail:"Supports reduce delays. Not everyone gets them."
    });
  }
}

function logEvent(patient, kind, title, detail){
  patient.log.unshift({ kind, title, detail });
  patient.log = patient.log.slice(0, 10);
}

function computeGap(){
  return Math.abs(state.A.days - state.B.days);
}

function render(){
  ui.seedText.textContent = String(state.seed);
  ui.autoText.textContent = ui.autoToggle.checked ? "ON" : "OFF";
  ui.gapText.textContent = String(computeGap());

  renderPatient(state.A, ui.daysA, ui.stressA, ui.stepA, ui.fillA, ui.logA, ui.invA);
  renderPatient(state.B, ui.daysB, ui.stressB, ui.stepB, ui.fillB, ui.logB, ui.invB);

  renderPendingPanel();
  drawChart();
}

function renderPatient(p, daysEl, stressEl, stepEl, fillEl, logEl, invEl){
  daysEl.textContent = String(p.days);
  stressEl.textContent = String(p.stress);
  stepEl.textContent = window.STEPS[p.step] || "Diagnosis";

  const pct = Math.round((p.step / (window.STEPS.length - 1)) * 100);
  fillEl.style.width = `${pct}%`;

  // Inventory chips
  invEl.innerHTML = "";
  const counts = {};
  p.stickers.forEach(k => counts[k] = (counts[k]||0) + 1);
  Object.keys(counts).forEach(k => {
    const meta = window.STICKERS.find(x => x.key === k) || { name:k, ico:"✨" };
    const chip = document.createElement("div");
    chip.className = "chipCard";
    chip.innerHTML = `<span class="ico">${meta.ico}</span> ${meta.name} ×${counts[k]}`;
    invEl.appendChild(chip);
  });

  // Log
  logEl.innerHTML = "";
  p.log.forEach(item => {
    const div = document.createElement("div");
    div.className = "logItem";
    div.innerHTML = `<b>${item.title}</b><div class="mini">${item.detail}</div>`;
    logEl.appendChild(div);
  });
}

function renderPendingPanel(){
  const stepName = state.pending.stepName;
  ui.currentStep.textContent = stepName ? stepName : "Press Next Step";

  const a = state.pending.A;
  const b = state.pending.B;

  // If both pending are null, show nothing
  if (!a && !b){
    ui.eventLine.textContent = "No event yet.";
    ui.eventMeta.textContent = "";
    ui.interveneA.disabled = true;
    ui.interveneB.disabled = true;
    return;
  }

  // Show the “most severe” event line as the headline
  const head = pickHeadEvent(a, b);
  ui.eventLine.textContent = `${window.CAT[head.cat].ico} ${window.CAT[head.cat].name}: ${head.title}`;
  ui.eventMeta.textContent =
    `A: ${a ? formatEffect(a) : "No event"} | B: ${b ? formatEffect(b) : "No event"}\n` +
    `Why it matters: ${head.why}`;

  ui.interveneA.disabled = !(a && canIntervene(state.A));
  ui.interveneB.disabled = !(b && canIntervene(state.B));
}

function pickHeadEvent(a, b){
  if (a && b) return (a.days >= b.days) ? a : b;
  return a || b;
}
function formatEffect(e){
  return `${e.days} days, +${e.stress} stress`;
}

function canIntervene(patient){
  return patient.stickers.length > 0;
}

function spendSticker(patient){
  patient.stickers.pop();
}

function stepForward(){
  if (!state || state.done || paused) return;

  state.stepIndex += 1;
  const idx = state.stepIndex;

  // Finish condition
  if (idx >= window.STEPS.length){
    state.done = true;
    endRun();
    return;
  }

  // Advance both patients to this step index (but days differ)
  const stepName = window.STEPS[idx];
  state.pending.stepName = stepName;

  state.A.step = clamp(idx, 0, window.STEPS.length - 1);
  state.B.step = clamp(idx, 0, window.STEPS.length - 1);

  // Reveal events with probability that increases over time
  const baseChance = 0.55 + (idx * 0.03);
  state.pending.A = rollEvent("A", baseChance);
  state.pending.B = rollEvent("B", baseChance);

  // Auto resolve or wait for manual actions
  if (ui.autoToggle.checked){
    startCountdown(5, resolvePending);
  } else {
    ui.countdownText.textContent = "-";
  }

  // Award sticker sometimes (fun reward)
  maybeAwardSticker(state.A, state.rng);
  maybeAwardSticker(state.B, state.rng);

  render();
}

function rollEvent(label, chance){
  const r = state.rng();
  if (r > chance) return null;

  const base = pick(state.rng, window.EVENT_DECK);
  const mod = applyModifiers(label, base);

  return {
    ...base,
    days: mod.days,
    stress: mod.stress
  };
}

function resolvePending(){
  if (!state || state.done) return;

  applyOne("A", state.pending.A);
  applyOne("B", state.pending.B);

  state.pending.A = null;
  state.pending.B = null;
  state.pending.stepName = null;

  ui.countdownText.textContent = "-";

  render();
  checkFinished();
}

function applyOne(label, event){
  const patient = label === "A" ? state.A : state.B;
  if (!event){
    logEvent(patient, "ok", `✅ ${window.STEPS[patient.step]}`, "No extra delay on this step.");
    return;
  }

  patient.days += event.days;
  patient.stress += event.stress;
  patient.breakdown[event.cat] += event.days;

  const cat = window.CAT[event.cat];
  logEvent(
    patient,
    "delay",
    `${cat.ico} ${event.title} (+${event.days} days)`,
    event.why
  );
}

function checkFinished(){
  if (state.A.step >= window.STEPS.length - 1 && state.B.step >= window.STEPS.length - 1){
    state.done = true;
    endRun();
  }
}

function endRun(){
  stopCountdown();

  const gap = computeGap();
  ui.modalTitle.textContent = "Treatment Started";
  ui.modalBody.textContent =
    `Patient A waited ${state.A.days} days.\n` +
    `Patient B waited ${state.B.days} days.\n\n` +
    `Equity Gap: ${gap} days.\n\n` +
    `Takeaway: delays are often non-medical. Support and policy reduce harm, but access is uneven.`;

  ui.modal.classList.remove("hidden");
}

function startCountdown(seconds, onDone){
  stopCountdown();
  let left = seconds;
  ui.countdownText.textContent = String(left);

  timer = setInterval(() => {
    if (paused) return;
    left -= 1;
    ui.countdownText.textContent = String(Math.max(0, left));
    if (left <= 0){
      stopCountdown();
      onDone();
    }
  }, 1000);
}

function stopCountdown(){
  if (timer){
    clearInterval(timer);
    timer = null;
  }
  ui.countdownText.textContent = "-";
}

function intervene(label){
  if (!state || state.done) return;
  const patient = label === "A" ? state.A : state.B;
  const ev = label === "A" ? state.pending.A : state.pending.B;

  if (!ev) return;
  if (!canIntervene(patient)) return;

  spendSticker(patient);

  const cat = window.CAT[ev.cat];
  logEvent(patient, "support", `🛡️ Canceled: ${cat.name} delay`, "A support resource prevented this delay.");
  if (label === "A") state.pending.A = null;
  else state.pending.B = null;

  render();
}

function drawChart(){
  const c = ui.chart;
  const ctx = c.getContext("2d");

  const cats = ["INS","ADM","TRN","WRK","CHD","CLN"];
  const labels = cats.map(k => window.CAT[k].ico);
  const aVals = cats.map(k => state.A.breakdown[k]);
  const bVals = cats.map(k => state.B.breakdown[k]);

  ctx.clearRect(0,0,c.width,c.height);

  // background
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0,0,c.width,c.height);

  const pad = 22;
  const w = c.width - pad*2;
  const h = c.height - pad*2;

  const maxVal = Math.max(10, ...aVals, ...bVals);
  const colW = w / cats.length;

  // axis labels
  ctx.fillStyle = "rgba(238,242,255,0.75)";
  ctx.font = "12px system-ui";
  labels.forEach((lab, i) => {
    const x = pad + i*colW + colW*0.35;
    ctx.fillText(lab, x, c.height - 8);
  });

  // bars
  cats.forEach((k, i) => {
    const x0 = pad + i*colW;
    const aH = (aVals[i] / maxVal) * (h - 20);
    const bH = (bVals[i] / maxVal) * (h - 20);

    // A bar
    ctx.fillStyle = "rgba(96,165,250,0.85)";
    ctx.fillRect(x0 + colW*0.18, pad + (h - aH), colW*0.25, aH);

    // B bar
    ctx.fillStyle = "rgba(167,139,250,0.85)";
    ctx.fillRect(x0 + colW*0.52, pad + (h - bH), colW*0.25, bH);
  });
}

function notice(msg){
  ui.notice.textContent = msg;
  setTimeout(() => {
    if (ui.notice.textContent === msg){
      ui.notice.textContent = "Tip: Press N to advance, 1/2 to intervene.";
    }
  }, 2500);
}

function save(){
  if (!state) return;
  const payload = {
    seed: state.seed,
    stepIndex: state.stepIndex,
    done: state.done,
    A: state.A,
    B: state.B,
    pending: state.pending,
    ui: {
      navA: ui.navA.checked, rideA: ui.rideA.checked, leaveA: ui.leaveA.checked,
      navB: ui.navB.checked, rideB: ui.rideB.checked, leaveB: ui.leaveB.checked,
      polNavigator: ui.polNavigator.checked,
      polTransit: ui.polTransit.checked,
      polAdmin: ui.polAdmin.checked,
      polLeave: ui.polLeave.checked,
      polCapacity: ui.polCapacity.checked,
      autoToggle: ui.autoToggle.checked,
      reduceMotion: ui.reduceMotion.checked,
      soundToggle: ui.soundToggle.checked
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  notice("Saved.");
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw){ notice("No save found."); return; }
  const p = JSON.parse(raw);

  state = newState(p.seed);
  state.stepIndex = p.stepIndex;
  state.done = p.done;
  state.A = p.A;
  state.B = p.B;
  state.pending = p.pending;

  // restore UI toggles
  ui.navA.checked = p.ui.navA; ui.rideA.checked = p.ui.rideA; ui.leaveA.checked = p.ui.leaveA;
  ui.navB.checked = p.ui.navB; ui.rideB.checked = p.ui.rideB; ui.leaveB.checked = p.ui.leaveB;
  ui.polNavigator.checked = p.ui.polNavigator;
  ui.polTransit.checked = p.ui.polTransit;
  ui.polAdmin.checked = p.ui.polAdmin;
  ui.polLeave.checked = p.ui.polLeave;
  ui.polCapacity.checked = p.ui.polCapacity;
  ui.autoToggle.checked = p.ui.autoToggle;
  ui.reduceMotion.checked = p.ui.reduceMotion;
  ui.soundToggle.checked = p.ui.soundToggle;

  render();
  notice("Loaded.");
}

function clearSave(){
  localStorage.removeItem(STORAGE_KEY);
  notice("Save cleared.");
}

function copyShareLink(){
  if (!state) return;
  const url = new URL(location.href);
  url.searchParams.set("seed", String(state.seed));
  navigator.clipboard.writeText(url.toString()).then(() => notice("Share link copied."));
}

function exportSummary(){
  if (!state) return;

  const lines = [];
  lines.push("Two Patients, One Diagnosis");
  lines.push(`Seed: ${state.seed}`);
  lines.push(`Patient A days: ${state.A.days}, stress: ${state.A.stress}`);
  lines.push(`Patient B days: ${state.B.days}, stress: ${state.B.stress}`);
  lines.push(`Equity Gap: ${computeGap()} days`);
  lines.push("");
  lines.push("Category days (A vs B):");
  ["INS","ADM","TRN","WRK","CHD","CLN"].forEach(k => {
    lines.push(`${window.CAT[k].name}: ${state.A.breakdown[k]} vs ${state.B.breakdown[k]}`);
  });
  lines.push("");
  lines.push("Takeaway: delays are often non-medical. Support and policy reduce harm, but access is uneven.");

  const text = lines.join("\n");
  navigator.clipboard.writeText(text).then(() => notice("Summary copied to clipboard."));
}

function tutorial(){
  ui.modalTitle.textContent = "How to Demo (30 seconds)";
  ui.modalBody.textContent =
    "1) Click Next Step 3 to 6 times.\n" +
    "2) Point out how B falls behind while A stays closer.\n" +
    "3) Toggle a policy lever and show the gap shrink.\n" +
    "4) Use Intervene once to show support is powerful but limited.\n\n" +
    "Keyboard: N next, 1 intervene A, 2 intervene B, R reset.";
  ui.modal.classList.remove("hidden");
}

// Basic “sound” using WebAudio (no files)
let audioCtx = null;
function beep(freq, ms){
  if (!ui.soundToggle.checked) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    g.gain.value = 0.03;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    setTimeout(() => { o.stop(); }, ms);
  } catch {}
}

function reset(){
  stopCountdown();
  paused = false;
  ui.pauseBtn.textContent = "Pause";

  const seed = defaultSeed();
  state = newState(seed);
  render();
  notice("Ready. Press Next Step (N).");
  beep(660, 80);
}

function wire(){
  ui.nextBtn.addEventListener("click", () => { stepForward(); beep(520, 60); });
  ui.resetBtn.addEventListener("click", () => reset());

  ui.pauseBtn.addEventListener("click", () => {
    paused = !paused;
    ui.pauseBtn.textContent = paused ? "Resume" : "Pause";
    notice(paused ? "Paused." : "Resumed.");
  });

  ui.tutorialBtn.addEventListener("click", () => tutorial());

  ui.interveneA.addEventListener("click", () => { intervene("A"); beep(880, 70); });
  ui.interveneB.addEventListener("click", () => { intervene("B"); beep(880, 70); });

  ui.autoToggle.addEventListener("change", () => render());
  ui.polNavigator.addEventListener("change", () => render());
  ui.polTransit.addEventListener("change", () => render());
  ui.polAdmin.addEventListener("change", () => render());
  ui.polLeave.addEventListener("change", () => render());
  ui.polCapacity.addEventListener("change", () => render());

  ui.saveBtn.addEventListener("click", () => save());
  ui.loadBtn.addEventListener("click", () => load());
  ui.clearBtn.addEventListener("click", () => clearSave());
  ui.shareBtn.addEventListener("click", () => copyShareLink());
  ui.exportBtn.addEventListener("click", () => exportSummary());

  ui.closeModal.addEventListener("click", () => ui.modal.classList.add("hidden"));
  ui.playAgain.addEventListener("click", () => { ui.modal.classList.add("hidden"); reset(); });

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "n") stepForward();
    if (e.key.toLowerCase() === "r") reset();
    if (e.key === "1") intervene("A");
    if (e.key === "2") intervene("B");
  });
}

// Start
ui.modal.classList.add("hidden");
wire();
reset();
