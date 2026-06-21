/* ── utils.js: shared helper functions ── */

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatTime(sec) {
  sec = Math.max(0, sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
}

/* Escape HTML special chars then convert \n to <br> for display */
function fmtText(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>');
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* TSPSC marking scheme: +2 correct, -0.66 wrong */
function calcPoints(correct, wrong) {
  return Math.max(0, correct * 2 - wrong * 0.66);
}

function pctColor(pct) {
  if (pct >= 70) return 'text-green-400';
  if (pct >= 45) return 'text-yellow-400';
  return 'text-red-400';
}

function barColor(pct) {
  if (pct >= 70) return 'bar-green';
  if (pct >= 45) return 'bar-yellow';
  return 'bar-red';
}
