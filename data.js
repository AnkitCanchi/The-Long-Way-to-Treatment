// Steps in the cancer care journey
window.STEPS = [
  "Diagnosis",
  "Primary Care Referral",
  "Specialist Consultation",
  "Imaging / Scans",
  "Biopsy / Lab Work",
  "Treatment Plan",
  "Prior Authorization",
  "Schedule Treatment",
  "Start Treatment"
];

// Category icons (kid friendly), adult meaning is in text
window.CAT = {
  INS: { name: "Insurance", ico: "🧾" },
  ADM: { name: "Paperwork", ico: "📄" },
  TRN: { name: "Transport", ico: "🚌" },
  WRK: { name: "Work", ico: "🕒" },
  CHD: { name: "Childcare", ico: "🧸" },
  CLN: { name: "Clinic", ico: "🏥" }
};

// Event deck: baseDays and stress, plus a short adult explanation
window.EVENT_DECK = [
  { cat:"INS", title:"Prior auth requested", baseDays: 7, stress: 3, why:"Authorization delays can happen even when care is medically urgent." },
  { cat:"INS", title:"Claim needs review", baseDays: 5, stress: 2, why:"Administrative review can slow scheduling and approvals." },
  { cat:"INS", title:"Denied, must appeal", baseDays: 12, stress: 4, why:"Appeals add extra steps and time before treatment can start." },

  { cat:"ADM", title:"Paperwork missing", baseDays: 4, stress: 2, why:"One missing form can reset the process." },
  { cat:"ADM", title:"Referral fax not received", baseDays: 6, stress: 3, why:"Outdated systems create repeat work and lost time." },
  { cat:"ADM", title:"Wrong code on form", baseDays: 5, stress: 2, why:"Small errors can cause rework and resubmission." },

  { cat:"TRN", title:"Ride canceled last minute", baseDays: 3, stress: 3, why:"Transportation breakdowns cause missed appointments." },
  { cat:"TRN", title:"Long commute + traffic", baseDays: 2, stress: 2, why:"Distance and transit reliability affect access." },

  { cat:"WRK", title:"Shift conflict", baseDays: 3, stress: 3, why:"Work schedules can block appointment availability." },
  { cat:"WRK", title:"Lost wages risk", baseDays: 2, stress: 3, why:"Financial pressure can force delay or cancellation." },

  { cat:"CHD", title:"Childcare fell through", baseDays: 3, stress: 3, why:"Care responsibilities can make appointments impossible." },

  { cat:"CLN", title:"Clinic understaffed", baseDays: 5, stress: 2, why:"Capacity constraints push appointments further out." },
  { cat:"CLN", title:"Scan rescheduled", baseDays: 6, stress: 2, why:"One reschedule can cascade into more delays." }
];

// Sticker supports (inventory items) earned at some steps
window.STICKERS = [
  { key:"NAV", name:"Navigator", ico:"🧭" },
  { key:"RIDE", name:"Ride Voucher", ico:"🚗" },
  { key:"LEAVE", name:"Paid Leave", ico:"🪪" },
  { key:"FUND", name:"Support Fund", ico:"💛" }
];
