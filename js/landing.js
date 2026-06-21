/* ── landing.js ── */
const Landing = (() => {

  function render() {
    const tests = DB.getTests();
    const stats = DB.getTotalStats();

    document.getElementById('app').innerHTML = `

    <!-- Nav -->
    <nav class="top-nav">
      <div class="nav-logo">TSPSC <span>Prep</span></div>
      <div style="display:flex;align-items:center;gap:0.625rem;">
        ${stats ? `
          <div class="stat-pill">
            <span class="stat-pill-val text-amber">${stats.totalPoints.toFixed(0)}</span>
            <span class="stat-pill-lbl">Points</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-val text-blue">${stats.totalTests}</span>
            <span class="stat-pill-lbl">Tests</span>
          </div>
        ` : ''}
        <button onclick="Analytics.renderAll()" class="btn btn-ghost btn-sm">Analytics</button>
      </div>
    </nav>

    <!-- Page -->
    <div class="page" style="padding-top:2rem;">

      <!-- Create panel -->
      <div class="card" style="margin-bottom:1.75rem;">
        <p class="section-title" style="margin-bottom:0.5rem;">New Test</p>
        <h2 class="card-title" style="margin-bottom:1.25rem;">Paste or import question JSON</h2>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem;margin-bottom:0.875rem;">
          <div style="grid-column:1/2">
            <label class="field-label">Test name</label>
            <input id="testName" class="input" type="text" placeholder="e.g. TSPSC 2023 Paper 1">
          </div>
          <div>
            <label class="field-label">Minutes per question</label>
            <input id="mpq" class="input" type="number" value="1" min="0.5" step="0.5">
          </div>
        </div>

        <div style="margin-bottom:0.875rem;">
          <label class="field-label">Question JSON</label>
          <textarea id="jsonInput" class="textarea" rows="7"
            placeholder='[{"id":"q1","topic":"History","question":"Which year?\\n1. 2013\\n2. 2014","options":[{"key":"A","text":"2013"},{"key":"B","text":"2014"}],"correctAnswer":"B","explanation":"..."}]'></textarea>
        </div>

        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button onclick="Landing.startDirect()" class="btn btn-primary btn-md">Start Test</button>
          <button onclick="Landing.importFile()" class="btn btn-ghost btn-md">Load from File</button>
        </div>
      </div>

      <!-- Library -->
      <div style="margin-bottom:1.25rem;display:flex;align-items:center;justify-content:space-between;">
        <p class="section-title">Library &nbsp;<span style="color:var(--t3);font-weight:400;text-transform:none;letter-spacing:0;">${tests.length} test${tests.length !== 1 ? 's' : ''}</span></p>
      </div>

      ${tests.length === 0 ? `
        <div class="card" style="text-align:center;padding:3rem 1.5rem;color:var(--t3);">
          <div style="font-size:2rem;margin-bottom:0.75rem;opacity:0.4;">☐</div>
          <p style="font-size:0.875rem;">No saved tests yet.</p>
          <p style="font-size:0.8125rem;margin-top:0.25rem;">Paste a JSON array above and click <strong style="color:var(--t2);">Save to Library</strong>.</p>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${tests.map(t => testCard(t)).join('')}
        </div>
      `}

      <!-- Schema reference -->
      <details class="card" style="margin-top:1.75rem;">
        <summary style="display:flex;align-items:center;justify-content:space-between;">
          <span class="card-title">JSON Schema Reference</span>
          <span class="chevron text-muted" style="font-size:0.75rem;"></span>
        </summary>
        <hr class="divider" style="margin:1rem 0;">
        <p class="caption" style="margin-bottom:0.625rem;">Each question object must match this structure. Use <code style="font-family:monospace;color:#6ee7b7;">\\n</code> inside strings for line breaks in numbered lists.</p>
        <pre style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#6ee7b7;overflow:auto;line-height:1.7;background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:1rem;">[
  {
    "id": "q1",
    "topic": "Telangana History",
    "question": "Which are correct?\\n1. Formed in 2014\\n2. Capital is Hyderabad",
    "options": [
      { "key": "A", "text": "1 only" },
      { "key": "B", "text": "2 only" },
      { "key": "C", "text": "Both" },
      { "key": "D", "text": "Neither" }
    ],
    "correctAnswer": "C",
    "explanation": "Both statements are correct."
  }
]</pre>
      </details>

    </div>`;
  }

  function testCard(t) {
    const results = DB.getResultsByTest(t.id);
    const last    = results[results.length - 1];
    const best    = results.reduce((b, r) => (!b || r.accuracy > b.accuracy) ? r : b, null);
    const topics  = (t.topics || []).slice(0, 5).map(tp =>
      `<span class="tag">${escHtml(tp)}</span>`
    ).join('');

    return `
    <div class="card" style="padding:1.125rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
        <div style="flex:1;min-width:0;">
          <div class="card-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(t.name)}</div>
          <div class="caption" style="margin-top:0.25rem;">${t.questions.length} questions &nbsp;·&nbsp; Added ${formatDate(t.createdAt)}</div>
          ${topics ? `<div style="display:flex;flex-wrap:wrap;gap:0.375rem;margin-top:0.625rem;">${topics}</div>` : ''}
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;flex-shrink:0;">
          ${last  ? `<span style="font-size:0.75rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:0.2rem 0.6rem;">Last: <span class="${pctColor(last.accuracy)}">${last.accuracy.toFixed(1)}%</span></span>` : ''}
          ${best && results.length > 1 ? `<span style="font-size:0.75rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:0.2rem 0.6rem;">Best: <span class="text-amber">${best.accuracy.toFixed(1)}%</span></span>` : ''}
          ${results.length > 0 ? `<span style="font-size:0.75rem;color:var(--t3);">${results.length} attempt${results.length !== 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:1rem;">
        <button onclick="Landing.loadAndStart('${t.id}')" class="btn btn-primary btn-sm">Start</button>
        ${results.length > 0 ? `<button onclick="Analytics.renderResults(null,'${t.id}')" class="btn btn-ghost btn-sm">Results</button>` : ''}
        <button onclick="DB.exportTest('${t.id}')" class="btn btn-ghost btn-sm">Export</button>
        <button onclick="Landing.del('${t.id}')" class="btn btn-danger btn-sm" style="margin-left:auto;">Delete</button>
      </div>
    </div>`;
  }

  function parseJSON() {
    const raw = (document.getElementById('jsonInput').value || '').trim();
    if (!raw) { alert('Please paste a JSON array first.'); return null; }
    try {
      const q = JSON.parse(raw);
      if (!Array.isArray(q) || !q.length) { alert('JSON must be a non-empty array.'); return null; }
      return q;
    } catch (e) { alert('JSON parse error: ' + e.message); return null; }
  }

  function getMpq() {
    return Math.max(0.5, parseFloat(document.getElementById('mpq').value) || 1);
  }

  function startDirect() {
    const q = parseJSON();
    if (!q) return;
    const name   = document.getElementById('testName').value.trim() || ('Test — ' + new Date().toLocaleDateString('en-IN'));
    const topics = [...new Set(q.map(x => x.topic).filter(Boolean))];
    const test   = { id: genId(), name, questions: q, topics, createdAt: Date.now() };
    DB.saveTest(test);
    TestUI.begin(q, getMpq(), test.id);
  }

  function importFile() {
    DB.importFromFile((q, filename) => {
      const name   = filename || 'Imported Test';
      const topics = [...new Set(q.map(x => x.topic).filter(Boolean))];
      const test   = { id: genId(), name, questions: q, topics, createdAt: Date.now() };
      DB.saveTest(test);
      TestUI.begin(q, 1, test.id);
    });
  }

  function loadAndStart(id) {
    const test = DB.getTest(id);
    if (test) TestUI.begin(test.questions, 1, id);
  }

  function del(id) {
    if (!confirm('Delete this test and all its results?')) return;
    DB.deleteTest(id);
    render();
  }

  return { render, startDirect, saveToLibrary, importFile, loadAndStart, del };
})();
