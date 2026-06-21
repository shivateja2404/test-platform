/* ── landing.js: Home / Library page ── */
const Landing = (() => {

  function render() {
    const tests = DB.getTests();
    const stats = DB.getTotalStats();

    document.getElementById('app').innerHTML = `
    <div class="max-w-6xl mx-auto p-5">

      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center gap-4 mb-7">
        <div>
          <h1 class="text-3xl font-bold text-blue-400">TSPSC Group 1 Test Prep</h1>
          <p class="text-slate-400 text-sm mt-1">Practice tests · Analytics · Points tracking</p>
        </div>
        <div class="flex gap-3 items-center">
          ${stats ? `
            <div class="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center">
              <div class="text-yellow-400 font-bold text-xl">${stats.totalPoints.toFixed(1)}</div>
              <div class="text-slate-400 text-xs">Total Points</div>
            </div>
            <div class="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center">
              <div class="text-blue-400 font-bold text-xl">${stats.totalTests}</div>
              <div class="text-slate-400 text-xs">Tests Taken</div>
            </div>
          ` : ''}
          <button onclick="Analytics.renderAll()" class="btn btn-slate">
            📊 All Analytics
          </button>
        </div>
      </div>

      <!-- Create / Import -->
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-7">
        <h2 class="text-lg font-bold mb-4">➕ Create / Import Test</h2>
        <div class="grid md:grid-cols-3 gap-4 mb-4">
          <div class="md:col-span-2">
            <label class="text-slate-400 text-xs uppercase tracking-wider">Test Name</label>
            <input id="testName" type="text" placeholder="e.g. TSPSC 2023 Paper 1"
              class="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500">
          </div>
          <div>
            <label class="text-slate-400 text-xs uppercase tracking-wider">Minutes / Question</label>
            <input id="mpq" type="number" value="1" min="0.5" step="0.5"
              class="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500">
          </div>
        </div>
        <label class="text-slate-400 text-xs uppercase tracking-wider">Paste Question JSON</label>
        <textarea id="jsonInput" rows="6"
          class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-green-300 font-mono text-sm focus:outline-none focus:border-blue-500"
          placeholder='[{"id":"q1","topic":"History","question":"Which year...\\n1. 2013\\n2. 2014","options":[{"key":"A","text":"2013"},{"key":"B","text":"2014"}],"correctAnswer":"B","explanation":"..."}]'></textarea>
        <div class="flex flex-wrap gap-3 mt-4">
          <button onclick="Landing.startDirect()" class="btn btn-blue">▶ Start Test</button>
          <button onclick="Landing.saveToLibrary()" class="btn btn-green">💾 Save to Library</button>
          <button onclick="Landing.importFile()" class="btn btn-slate">📂 Import JSON File</button>
        </div>
      </div>

      <!-- Test Library -->
      <div>
        <h2 class="text-lg font-bold mb-4">📚 Test Library (${tests.length})</h2>
        ${tests.length === 0 ? `
          <div class="text-center py-12 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">
            <div class="text-4xl mb-3">📭</div>
            <p>No saved tests yet.</p>
            <p class="text-sm mt-1">Paste JSON above and click <span class="text-blue-400">Save to Library</span>.</p>
          </div>
        ` : `<div class="space-y-4">${tests.map(t => testCard(t)).join('')}</div>`}
      </div>

      <!-- Schema reference -->
      <details class="mt-7 bg-slate-800 border border-slate-700 rounded-xl p-5">
        <summary class="font-semibold text-slate-300 flex justify-between">
          📄 Expected JSON Schema <span class="arr text-slate-500 text-sm"></span>
        </summary>
        <pre class="mt-4 text-xs text-green-300 overflow-auto leading-relaxed">
[
  {
    "id": "q1",
    "topic": "Telangana History",
    "question": "Which of the following are correct?\\n1. Telangana formed in 2014\\n2. Capital is Hyderabad\\n3. It is the 30th state",
    "options": [
      {"key": "A", "text": "1 and 2 only"},
      {"key": "B", "text": "1 and 3 only"},
      {"key": "C", "text": "2 and 3 only"},
      {"key": "D", "text": "All of the above"}
    ],
    "correctAnswer": "A",
    "explanation": "Telangana (29th state) formed on 2 June 2014. Hyderabad is the capital. Statement 3 is wrong."
  }
]</pre>
      </details>

    </div>`;
  }

  function testCard(t) {
    const results = DB.getResultsByTest(t.id);
    const last    = results[results.length - 1];
    const best    = results.reduce((b,r) => (!b || r.accuracy > b.accuracy) ? r : b, null);
    const topics  = (t.topics || []).slice(0,4).map(tp => `<span class="topic-tag">${escHtml(tp)}</span>`).join(' ');

    return `
    <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div class="flex flex-wrap justify-between items-start gap-3">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-lg truncate">${escHtml(t.name)}</div>
          <div class="text-slate-400 text-sm mt-1">${t.questions.length} questions &nbsp;·&nbsp; ${formatDate(t.createdAt)}</div>
          <div class="flex flex-wrap gap-1.5 mt-2">${topics}</div>
        </div>
        <div class="flex gap-2 text-sm flex-shrink-0">
          ${last  ? `<div class="bg-slate-700 px-3 py-1 rounded-full">Last: <span class="${pctColor(last.accuracy)}">${last.accuracy.toFixed(1)}%</span></div>` : ''}
          ${best && results.length > 1 ? `<div class="bg-slate-700 px-3 py-1 rounded-full">Best: <span class="text-yellow-400">${best.accuracy.toFixed(1)}%</span></div>` : ''}
          ${results.length > 0 ? `<div class="bg-slate-700 px-3 py-1 rounded-full">Attempts: <span class="text-blue-400">${results.length}</span></div>` : ''}
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        <button onclick="Landing.loadAndStart('${t.id}')" class="btn btn-blue text-sm">▶ Start Test</button>
        ${results.length > 0 ? `
          <button onclick="Analytics.renderResults(null,'${t.id}')" class="btn btn-slate text-sm">📊 Analytics</button>
        ` : ''}
        <button onclick="DB.exportTest('${t.id}')" class="btn btn-slate text-sm">⬇ Export JSON</button>
        <button onclick="Landing.del('${t.id}')" class="btn btn-red text-sm">🗑 Delete</button>
      </div>
    </div>`;
  }

  function parseJSON() {
    const raw = (document.getElementById('jsonInput').value || '').trim();
    if (!raw) { alert('Please paste JSON first.'); return null; }
    try {
      const q = JSON.parse(raw);
      if (!Array.isArray(q) || q.length === 0) { alert('JSON must be a non-empty array.'); return null; }
      return q;
    } catch(e) { alert('JSON parse error:\n' + e.message); return null; }
  }

  function getMpq() {
    return Math.max(0.5, parseFloat(document.getElementById('mpq').value) || 1);
  }

  function startDirect() {
    const questions = parseJSON();
    if (!questions) return;
    TestUI.begin(questions, getMpq(), null);
  }

  function saveToLibrary() {
    const questions = parseJSON();
    if (!questions) return;
    const name   = (document.getElementById('testName').value.trim()) || ('Test – ' + new Date().toLocaleDateString('en-IN'));
    const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
    DB.saveTest({ id: genId(), name, questions, topics, createdAt: Date.now() });
    alert(`"${name}" saved to library!`);
    render();
  }

  function importFile() {
    DB.importFromFile((questions, filename) => {
      const name   = filename || 'Imported Test';
      const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
      DB.saveTest({ id: genId(), name, questions, topics, createdAt: Date.now() });
      alert(`"${name}" imported successfully!`);
      render();
    });
  }

  function loadAndStart(id) {
    const test = DB.getTest(id);
    if (!test) return;
    TestUI.begin(test.questions, 1, id);
  }

  function del(id) {
    if (!confirm('Delete this test and all its results?')) return;
    DB.deleteTest(id);
    render();
  }

  return { render, startDirect, saveToLibrary, importFile, loadAndStart, del };
})();
