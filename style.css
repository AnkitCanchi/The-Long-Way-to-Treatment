*{ box-sizing:border-box; }
:root{
  --bg1:#070914;
  --bg2:#0b1224;
  --panel: rgba(255,255,255,0.08);
  --border: rgba(255,255,255,0.14);
  --text:#eef2ff;

  --a:#60a5fa;
  --b:#a78bfa;
  --good:#34d399;
  --warn:#fb7185;

  --shadow: 0 26px 90px rgba(0,0,0,0.55);
  --shadow2: 0 14px 30px rgba(0,0,0,0.35);
}

html,body{ height:100%; }
body{
  margin:0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  color: var(--text);
  background:
    radial-gradient(900px 650px at 15% 0%, rgba(96,165,250,0.30), transparent 60%),
    radial-gradient(900px 650px at 90% 0%, rgba(167,139,250,0.28), transparent 60%),
    radial-gradient(900px 700px at 55% 100%, rgba(52,211,153,0.16), transparent 60%),
    linear-gradient(180deg, var(--bg2), var(--bg1));
}

.topbar{
  display:flex;
  justify-content:space-between;
  gap:14px;
  padding:14px 16px;
  background: rgba(7,9,20,0.62);
  border-bottom:1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(10px);
}
.brand h1{ margin:0; font-size:22px; font-weight:1000; }
.brand p{ margin:6px 0 0; opacity:0.9; max-width:820px; font-size:13px; line-height:1.35; }

.topActions{ display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; align-items:flex-start; }

.primary{
  border:0;
  padding:10px 12px;
  border-radius:14px;
  font-weight:1000;
  cursor:pointer;
  background:#eef2ff;
  color:#0b0f1a;
}
.ghost{
  border:1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: var(--text);
  padding:10px 12px;
  border-radius:14px;
  font-weight:1000;
  cursor:pointer;
}
button:disabled{ opacity:0.45; cursor:not-allowed; }

.layout{
  height: calc(100vh - 72px);
  display:grid;
  grid-template-columns: 1fr 420px;
  gap:14px;
  padding:14px;
}
@media (max-width: 1100px){
  .layout{ height:auto; grid-template-columns:1fr; }
}

.sim{
  background: var(--panel);
  border:1px solid var(--border);
  border-radius:22px;
  box-shadow: var(--shadow);
  padding:14px;
  min-height:0;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.simTop{ display:flex; flex-direction:column; gap:10px; }
.pillRow{ display:flex; gap:8px; flex-wrap:wrap; }
.pill{
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.20);
  font-size:12px;
  font-weight:900;
  opacity:0.95;
}
.toggleRow{ display:flex; gap:14px; flex-wrap:wrap; }
.switch{ display:flex; gap:8px; align-items:center; font-size:13px; opacity:0.92; }
.switch input{ transform: translateY(1px); }

.twoCol{
  flex:1;
  min-height:0;
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:12px;
}
@media (max-width: 980px){
  .twoCol{ grid-template-columns:1fr; }
}

.patientCard{
  background: rgba(0,0,0,0.22);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:22px;
  box-shadow: var(--shadow2);
  padding:12px;
  min-height:0;
  display:flex;
  flex-direction:column;
  gap:10px;
  position:relative;
  overflow:hidden;
}
.patientCard::before{
  content:"";
  position:absolute;
  inset:-60px;
  background: radial-gradient(260px 160px at 25% 15%, rgba(255,255,255,0.10), transparent 60%);
  transform: rotate(12deg);
  pointer-events:none;
}

.cardHeader{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; z-index:1; }
.who{ display:flex; gap:10px; align-items:center; }
.avatar{
  width:42px; height:42px;
  border-radius:16px;
  display:grid; place-items:center;
  font-weight:1000;
  border:2px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
}
.avatar.a{ box-shadow: 0 0 0 4px rgba(96,165,250,0.18) inset; }
.avatar.b{ box-shadow: 0 0 0 4px rgba(167,139,250,0.18) inset; }

.name{ font-weight:1000; }
.tag{
  display:inline-block;
  margin-top:4px;
  padding:5px 9px;
  border-radius:999px;
  font-size:12px;
  font-weight:900;
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
}
.tag.good{ border-color: rgba(52,211,153,0.30); background: rgba(52,211,153,0.12); }
.tag.warn{ border-color: rgba(251,113,133,0.30); background: rgba(251,113,133,0.12); }

.kpis{ display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; z-index:1; }
.kpi{
  padding:8px 10px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  min-width: 78px;
}
.kpi .k{ font-size:12px; opacity:0.75; font-weight:900; }
.kpi .v{ font-weight:1000; font-size:16px; margin-top:2px; }

.progressBox{ z-index:1; }
.track{
  height:14px;
  border-radius:999px;
  background: rgba(255,255,255,0.10);
  border:1px solid rgba(255,255,255,0.12);
  overflow:hidden;
}
.fill{
  height:100%;
  width:0%;
  border-radius:999px;
  background: rgba(255,255,255,0.80);
}
#cardA .fill{ background: rgba(96,165,250,0.85); }
#cardB .fill{ background: rgba(167,139,250,0.85); }
.hint{ margin-top:6px; font-size:12px; opacity:0.82; }

.sectionTitle{ font-weight:1000; font-size:13px; opacity:0.92; z-index:1; }
.smallHint{ font-size:12px; opacity:0.75; z-index:1; margin-top:6px; }

.inventory, .supports, .log{ z-index:1; }
.chips{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
.chipCard{
  display:flex; align-items:center; gap:8px;
  padding:7px 10px;
  border-radius:999px;
  border:2px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.08);
  font-size:12px;
  font-weight:1000;
}
.chipCard .ico{
  width:22px; height:22px;
  border-radius:10px;
  display:grid; place-items:center;
  border:2px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.18);
}

.grid3{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-top:8px; }
@media (max-width: 980px){ .grid3{ grid-template-columns:1fr; } }
.check{ display:flex; gap:8px; align-items:center; font-size:13px; opacity:0.92; }
.check input{ transform: translateY(1px); }

.logBody{
  margin-top:8px;
  background: rgba(0,0,0,0.18);
  border:1px solid rgba(255,255,255,0.10);
  border-radius:18px;
  padding:10px;
  min-height: 120px;
  max-height: 220px;
  overflow:auto;
  font-size:13px;
  line-height:1.35;
}
.logItem{ padding:8px 10px; border-radius:14px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); margin-bottom:8px; }
.logItem:last-child{ margin-bottom:0; }
.logItem .mini{ opacity:0.78; font-size:12px; margin-top:4px; }

.right{
  min-height:0;
  display:flex;
}
.panel{
  width:100%;
  background: var(--panel);
  border:1px solid var(--border);
  border-radius:22px;
  box-shadow: var(--shadow);
  padding:14px;
  min-height:0;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.panelTitle{ font-weight:1000; font-size:14px; opacity:0.95; margin-top:6px; }
.bigStep{
  padding:12px;
  border-radius:18px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.18);
  font-weight:1000;
}

.eventBox{
  padding:12px;
  border-radius:18px;
  border:2px solid rgba(255,255,255,0.12);
  background:
    radial-gradient(220px 160px at 25% 15%, rgba(255,255,255,0.10), transparent 60%),
    rgba(0,0,0,0.18);
}
.eventTitle{ font-weight:1000; opacity:0.95; }
.eventLine{ margin-top:8px; font-weight:1000; }
.eventMeta{ margin-top:6px; opacity:0.82; font-size:12px; line-height:1.35; }

.btnRow{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px; }
.tiny{ margin-top:8px; opacity:0.75; font-size:12px; line-height:1.35; }

.policyGrid{ display:grid; gap:8px; margin-top:6px; }
.chartBox{
  margin-top:6px;
  padding:10px;
  border-radius:18px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.18);
}
.toolRow{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
.notice{
  margin-top:auto;
  padding:10px;
  border-radius:18px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.18);
  font-size:12px;
  opacity:0.86;
}

.modal{ position:fixed; inset:0; background: rgba(0,0,0,0.62); display:grid; place-items:center; padding:18px; z-index:50; }
.modal.hidden{ display:none !important; }
.modalCard{
  width: min(720px, 100%);
  background: rgba(255,255,255,0.10);
  border:1px solid rgba(255,255,255,0.18);
  border-radius:22px;
  padding:16px;
  box-shadow: 0 40px 140px rgba(0,0,0,0.75);
}
.modalBtns{ display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
