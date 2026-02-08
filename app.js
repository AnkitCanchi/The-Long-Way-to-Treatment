/* Two Patients, One Diagnosis – Instant Resolve Version
   Controls:
   N = Next Step
   R = Reset
*/

const $ = (id) => document.getElementById(id);

const ui = {
  nextBtn: $("nextBtn"),
  resetBtn: $("resetBtn"),
  tutorialBtn: $("tutorialBtn"),

  seedText: $("seedText"),
  gapText: $("gapText"),

  daysA: $("daysA"), stressA: $("stressA"), stepA: $("stepA"), fillA: $("fillA"), logA: $("logA"), invA: $("invA"),
  daysB: $("daysB"), stressB: $("stressB"), stepB: $("stepB"), fillB: $("fillB"), logB: $("logB"), invB: $("invB"),

  navA: $("navA"), rideA: $("rideA"), leaveA: $("leaveA"),
  navB: $("navB"), rideB: $("rideB"), leaveB: $("leaveB"),

  currentStep: $("currentStep"),
  eventLine: $("eventLine"),
  eventMeta: $("eventMeta"),

  polNavigator: $("polNavigator"),
  polTransit: $("polTransit"),
  polAdmin: $("polAdmin"),
  polLeave: $("polLeave"),
  polCapacity: $("polCapacity"),

  chart: $("chart"),
  notice: $("notice"),

  modal: $("modal"),
  modalTitle: $("modalTitle"),
  modalBody: $("modalBody"),
  closeModal: $("closeModal"),
  playAgain: $("playAgain"),

  // ADDED buttons (they exist in your HTML now)
  interveneA: $("interveneA"),
  interveneB: $("interveneB"),

  saveBtn: $("saveBtn"),
  loadBtn: $("loadBtn"),
  exportBtn: $("exportBtn"),
  shareBtn: $("shareBtn"),
};

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr){ return arr[Math.floor(rng() * arr.length)]; }

let state = null;

function defaultSeed(){
  return Math.floor(Math.random() * 1_000_000_000);
}

function makePatient(){
  return {
    days: 0,
    stress: 0,
    step: 0,
    stickers: ["NAV"],
    breakdown: { INS:0, ADM:0, TRN:0, WRK:0, CHD:0, CLN:0 },
    log: []
  };
}

function newState(seed){
  return {
    seed,
    rng: mulberry32(seed),
    stepIndex: -1,
    done: false,
    pending: { A: null, B: null, stepName: null },
    A: makePatient(),
    B: makePatient()
  };
}

function supports(label){
  return label === "A"
    ? { nav: ui.navA.checked, ride: ui.rideA.checked, leave: ui.leaveA.checked }
    : { nav: ui.navB.checked, ride: ui.rideB.checked, leave: ui.leaveB.checked };
}

function policies(){
  return {
    nav: ui.polNavigator.checked,
    trn: ui.polTransit.checked,
    adm: ui.polAdmin.checked,
    leave: ui.polLeave.checked,
    cap: ui.polCapacity.checked
  };
}

function applyModifiers(label, event){
  const s = supports(label);
  const p = policies();

  let days = event.baseDays;
  let stress = event.stress;

  // Personal supports
  if ((event.cat === "ADM" || event.cat === "INS") && s.nav) days -= 2;
  if (event.cat === "TRN" && s.ride) days -= 2;
  if (event.cat === "WRK" && s.leave) days -= 2;

  // Policy levers
  if ((event.cat === "ADM" || event.cat === "INS") && p.adm) days -= 2;
  if (event.cat === "TRN" && p.trn) days -= 2;
  if (event.cat === "WRK" && p.leave) days -= 2;
  if (event.cat === "CLN" && p.cap) days -= 2;
  if ((event.cat === "ADM" || event.cat === "INS") && p.nav) days -= 1;

  // Clamp
  days = clamp(days, 0, 30);
  stress = clamp(stress, 0, 10);

  return { days, stress };
}

function logEvent(patient, title, detail){
  patient.log.unshift({ title, detail });
  if (patient.log.length > 12) patient.log.pop();
}

function maybeAwardSticker(patient){
  if (state.rng() < 0.22){
    const s = pick(state.rng, window.STICKERS);
    patient.stickers.push(s.key);
    logEvent(patient, `✨ Support gained: ${s.name} ${s.ico}`, "Support reduces delays, but access is unequal.");
  }
}

function rollEvent(label, chance){
  if (state.rng() > chance) return null;
  const base = pick(state.rng, window.EVENT_DECK);
  const mod = applyModifiers(label, base);
  return { ...base, days: mod.days, stress: mod.stress };
}

/* ---------------- INSTANT NEXT STEP ---------------- */
function stepForward(){
  if (!state || state.done) return;

  state.stepIndex += 1;
  const idx = state.stepIndex;

  if (idx >= window.STEPS.length){
    state.done = true;
    endRun();
    return;
  }

  const stepName = window.STEPS[idx];
  state.pending.stepName = stepName;

  state.A.step = idx;
  state.B.step = idx;

  const chance = 0.55 + idx * 0.03;
  state.pending.A = rollEvent("A", chance);
  state.pending.B = rollEvent("B", chance);

  maybeAwardSticker(state.A);
  maybeAwardSticker(state.B);

  render();
  resolvePending(); // immediate, no waiting
}

function resolvePending(){
  applyOne("A", state.pending.A);
  applyOne("B", state.pending.B);

  // Update “latest events” panel text using what just happened
  const a = state.pending.A;
  const b = state.pending.B;

  if (!a && !b){
    ui.eventLine.textContent = "No delays this step.";
    ui.eventMeta.textContent = "";
  } else {
    const head = (a && b) ? (a.days >= b.days ? a : b) : (a || b);
    ui.eventLine.textContent = `${window.CAT[head.cat].ico} ${window.CAT[head.cat].name}: ${head.title}`;
    ui.eventMeta.textContent =
      `A: ${a ? `${a.days} days, +${a.stress} stress` : "No event"}\n` +
      `B: ${b ? `${b.days} days, +${b.stress} stress` : "No event"}\n\n` +
      `Why it matters: ${head.why}`;
  }

  state.pending.A = null;
  state.pending.B = null;
  state.pending.stepName = null;

  render();

  if (state.A.step >= window.STEPS.length - 1 && state.B.step >= window.STEPS.length - 1){
    state.done = true;
    endRun();
  }
}

function applyOne(label, ev){
  const p = label === "A" ? state.A : state.B;

  if (!ev){
    logEvent(p, `✅ ${window.STEPS[p.step]}`, "No extra delay on this step.");
    return;
  }

  p.days += ev.days;
  p.stress += ev.stress;
  p.breakdown[ev.cat] += ev.days;

  const cat = window.CAT[ev.cat];
  logEvent(p, `${cat.ico} ${ev.title} (+${ev.days} days)`, ev.why);
}

function renderPatient(p, daysEl, stressEl, stepEl, fillEl, logEl, invEl){
  daysEl.textContent = String(p.days);
  stressEl.textContent = String(p.stress);
  stepEl.textContent = window.STEPS[p.step] || "Diagnosis";

  const pct = Math.round((p.step / (window.STEPS.length - 1)) * 100);
  fillEl.style.width = `${pct}%`;

  // Inventory chips (counts)
  invEl.innerHTML = "";
  const counts = {};
  p.stickers.forEach(k => counts[k] = (counts[k] || 0) + 1);

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

function computeGap(){
  return Math.abs(state.A.days - state.B.days);
}

function render(){
  ui.seedText.textContent = String(state.seed);
  ui.gapText.textContent = String(computeGap());

  ui.currentStep.textContent = state.pending.stepName ? state.pending.stepName : "Press Next Step";

  renderPatient(state.A, ui.daysA, ui.stressA, ui.stepA, ui.fillA, ui.logA, ui.invA);
  renderPatient(state.B, ui.daysB, ui.stressB, ui.stepB, ui.fillB, ui.logB, ui.invB);

  drawChart();
}

function drawChart(){
  const c = ui.chart;
  const ctx = c.getContext("2d");

  const cats = ["INS","ADM","TRN","WRK","CHD","CLN"];
  const aVals = cats.map(k => state.A.breakdown[k]);
  const bVals = cats.map(k => state.B.breakdown[k]);

  ctx.clearRect(0,0,c.width,c.height);

  // background
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0,0,c.width,c.height);

  const pad = 22;
  const w = c.width - pad*2;
  const h = c.height - pad*2;

  const maxVal = Math.max(10, ...aVals, ...bVals);
  const colW = w / cats.length;

  // icons along bottom
  ctx.fillStyle = "rgba(238,242,255,0.75)";
  ctx.font = "12px system-ui";
  cats.forEach((k, i) => {
    const x = pad + i*colW + colW*0.38;
    ctx.fillText(window.CAT[k].ico, x, c.height - 8);
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

function endRun(){
  const gap = computeGap();
  ui.modalTitle.textContent = "Simulation Summary";

  ui.modalBody.textContent =
    `Patient A waited ${state.A.days} days.\n` +
    `Patient B waited ${state.B.days} days.\n\n` +
    `Equity Gap: ${gap} days.\n\n` +
    `Takeaway: many delays are not medical. Support and policy reduce harm, but access is uneven.`;

  ui.modal.classList.remove("hidden");
}

function tutorial(){
  ui.modalTitle.textContent = "How to Demo (20 seconds)";
  ui.modalBody.textContent =
    "1) Click Next Step 5 times.\n" +
    "2) Point out the gap growing between A and B.\n" +
    "3) Toggle a policy lever and keep clicking.\n" +
    "4) Show how support changes outcomes.\n\n" +
    "Keyboard: N next, R reset.";
  ui.modal.classList.remove("hidden");
}

function reset(){
  state = newState(defaultSeed());

  // Default: A has supports, B not
  ui.navA.checked = true;  ui.rideA.checked = true;  ui.leaveA.checked = true;
  ui.navB.checked = false; ui.rideB.checked = false; ui.leaveB.checked = false;

  // Default policies off
  ui.polNavigator.checked = false;
  ui.polTransit.checked = false;
  ui.polAdmin.checked = false;
  ui.polLeave.checked = false;
  ui.polCapacity.checked = false;

  ui.eventLine.textContent = "No event yet.";
  ui.eventMeta.textContent = "";
   
  if (ui.interveneB) ui.interveneB.disabled = true;
  if (ui.interveneB) ui.interveneB.title = "Locked for Patient B in this simulation";

  render();
  ui.notice.textContent = "Tip: Press N to advance, R to reset.";
}

/* ---------------- ADDED: Interventions + Save/Export ---------------- */

function downloadText(filename, text){
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeCloneState(){
  // strip rng function by saving only seed and core values
  return {
    seed: state.seed,
    stepIndex: state.stepIndex,
    done: state.done,
    pending: { A: null, B: null, stepName: null }, // never reload mid-pending
    A: state.A,
    B: state.B,

    uiSupports: {
      navA: ui.navA.checked, rideA: ui.rideA.checked, leaveA: ui.leaveA.checked,
      navB: ui.navB.checked, rideB: ui.rideB.checked, leaveB: ui.leaveB.checked,
    },
    uiPolicies: {
      polNavigator: ui.polNavigator.checked,
      polTransit: ui.polTransit.checked,
      polAdmin: ui.polAdmin.checked,
      polLeave: ui.polLeave.checked,
      polCapacity: ui.polCapacity.checked,
    }
  };
}

function applyLoadedState(loaded){
  if (!loaded || !loaded.A || !loaded.B) return false;

  state = newState(Number(loaded.seed ?? defaultSeed()));
  state.stepIndex = Number(loaded.stepIndex ?? -1);
  state.done = !!loaded.done;

  state.A = loaded.A;
  state.B = loaded.B;

  // restore toggles if present
  if (loaded.uiSupports){
    ui.navA.checked = !!loaded.uiSupports.navA;
    ui.rideA.checked = !!loaded.uiSupports.rideA;
    ui.leaveA.checked = !!loaded.uiSupports.leaveA;

    ui.navB.checked = !!loaded.uiSupports.navB;
    ui.rideB.checked = !!loaded.uiSupports.rideB;
    ui.leaveB.checked = !!loaded.uiSupports.leaveB;
  }

  if (loaded.uiPolicies){
    ui.polNavigator.checked = !!loaded.uiPolicies.polNavigator;
    ui.polTransit.checked = !!loaded.uiPolicies.polTransit;
    ui.polAdmin.checked = !!loaded.uiPolicies.polAdmin;
    ui.polLeave.checked = !!loaded.uiPolicies.polLeave;
    ui.polCapacity.checked = !!loaded.uiPolicies.polCapacity;
  }

  // refresh headline text
  ui.eventLine.textContent = "Loaded run.";
  ui.eventMeta.textContent = "";

  render();

  if (state.done){
    endRun();
  }

  return true;
}

function makeShareLink(){
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(safeCloneState()))));
  const url = new URL(window.location.href);
  url.searchParams.set("run", payload);
  return url.toString();
}

function tryLoadFromUrl(){
  const url = new URL(window.location.href);
  const run = url.searchParams.get("run");
  if (!run) return;

  try{
    const json = decodeURIComponent(escape(atob(run)));
    const loaded = JSON.parse(json);
    const ok = applyLoadedState(loaded);
    if (ok){
      ui.notice.textContent = "Loaded from share link.";
    }
  }catch(e){
    // ignore invalid share link
  }
}

function intervene(label){
  if (!state || state.done) return;

  // B can never intervene (keep button visible but locked)
  if (label === "B"){
    ui.notice.textContent = "Patient B cannot use interventions in this simulation.";
    return;
  }

  const p = state.A; // label must be A here

  const beforeDays = p.days;
  const beforeStress = p.stress;

  const removeDays = 3;
  const removeStress = 1;

  p.days = Math.max(0, p.days - removeDays);
  p.stress = Math.max(0, p.stress - removeStress);

  logEvent(
    p,
    `🩺 Intervention applied (−${beforeDays - p.days} days)`,
    "Real-world supports can reduce delays right away (navigation, transport, approvals)."
  );

  ui.notice.textContent = "Intervention used for Patient A.";
  render();
}

function wire(){
  ui.nextBtn.addEventListener("click", stepForward);
  ui.resetBtn.addEventListener("click", reset);
  ui.tutorialBtn.addEventListener("click", tutorial);

  ui.polNavigator.addEventListener("change", render);
  ui.polTransit.addEventListener("change", render);
  ui.polAdmin.addEventListener("change", render);
  ui.polLeave.addEventListener("change", render);
  ui.polCapacity.addEventListener("change", render);

  ui.navA.addEventListener("change", render);
  ui.rideA.addEventListener("change", render);
  ui.leaveA.addEventListener("change", render);
  ui.navB.addEventListener("change", render);
  ui.rideB.addEventListener("change", render);
  ui.leaveB.addEventListener("change", render);

  ui.closeModal.addEventListener("click", () => ui.modal.classList.add("hidden"));
  ui.playAgain.addEventListener("click", () => { ui.modal.classList.add("hidden"); reset(); });

  // ADDED: Intervene buttons
  if (ui.interveneA) ui.interveneA.addEventListener("click", () => intervene("A"));
  if (ui.interveneB) ui.interveneB.addEventListener("click", () => intervene("B"));
  if (ui.interveneB) ui.interveneB.disabled = true;

  // ADDED: Save/Load/Export/Share
  if (ui.saveBtn) ui.saveBtn.addEventListener("click", () => {
    try{
      localStorage.setItem("tpod_run", JSON.stringify(safeCloneState()));
      ui.notice.textContent = "Saved.";
    }catch(e){
      ui.notice.textContent = "Save failed (storage blocked).";
    }
  });

  if (ui.loadBtn) ui.loadBtn.addEventListener("click", () => {
    const raw = localStorage.getItem("tpod_run");
    if (!raw){
      ui.notice.textContent = "No saved run found.";
      return;
    }
    try{
      const loaded = JSON.parse(raw);
      const ok = applyLoadedState(loaded);
      ui.notice.textContent = ok ? "Loaded." : "Saved run invalid.";
    }catch(e){
      ui.notice.textContent = "Could not load saved run.";
    }
  });

  if (ui.exportBtn) ui.exportBtn.addEventListener("click", () => {
    const out = JSON.stringify(safeCloneState(), null, 2);
    downloadText("two-patients-run.json", out);
    ui.notice.textContent = "Exported JSON.";
  });

  if (ui.shareBtn) ui.shareBtn.addEventListener("click", async () => {
    const link = makeShareLink();
    try{
      await navigator.clipboard.writeText(link);
      ui.notice.textContent = "Share link copied.";
    }catch(e){
      prompt("Copy this link:", link);
    }
  });

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "n") stepForward();
    if (k === "r") reset();
  });
}

ui.modal.classList.add("hidden");
wire();
reset();
tryLoadFromUrl();
