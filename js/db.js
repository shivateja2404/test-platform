/* ── DB.js: localStorage-based persistence ──
   Tests and results are stored in localStorage.
   Use exportTest() to download as JSON (save to db/ folder manually).
   Use importJSON() to load a JSON file from disk.
*/
const DB = (() => {
  const K = { TESTS: 'tspsc_tests', RESULTS: 'tspsc_results' };

  /* ── Tests ── */
  function getTests() {
    try { return JSON.parse(localStorage.getItem(K.TESTS) || '[]'); }
    catch { return []; }
  }

  function saveTest(test) {
    const list = getTests();
    const i = list.findIndex(t => t.id === test.id);
    if (i >= 0) list[i] = test; else list.push(test);
    localStorage.setItem(K.TESTS, JSON.stringify(list));
    return test;
  }

  function getTest(id) { return getTests().find(t => t.id === id) || null; }

  function deleteTest(id) {
    localStorage.setItem(K.TESTS, JSON.stringify(getTests().filter(t => t.id !== id)));
    localStorage.setItem(K.RESULTS, JSON.stringify(getResults().filter(r => r.testId !== id)));
  }

  /* ── Results ── */
  function getResults() {
    try { return JSON.parse(localStorage.getItem(K.RESULTS) || '[]'); }
    catch { return []; }
  }

  function saveResult(result) {
    const list = getResults();
    list.push(result);
    localStorage.setItem(K.RESULTS, JSON.stringify(list));
    return result;
  }

  function getResultsByTest(testId) { return getResults().filter(r => r.testId === testId); }

  /* ── Aggregate Analytics ── */
  function getTotalStats() {
    const results = getResults();
    if (!results.length) return null;
    const totalPoints    = results.reduce((s,r) => s + (r.points  || 0), 0);
    const totalCorrect   = results.reduce((s,r) => s + (r.correct || 0), 0);
    const totalWrong     = results.reduce((s,r) => s + (r.wrong   || 0), 0);
    const totalQuestions = results.reduce((s,r) => s + (r.total   || 0), 0);
    const topicStats = {};
    results.forEach(r => {
      Object.entries(r.topicStats || {}).forEach(([topic, d]) => {
        if (!topicStats[topic]) topicStats[topic] = { correct:0, wrong:0, total:0 };
        topicStats[topic].correct += d.correct || 0;
        topicStats[topic].wrong   += d.wrong   || 0;
        topicStats[topic].total   += d.total   || 0;
      });
    });
    return { totalPoints, totalCorrect, totalWrong, totalQuestions, totalTests: results.length, topicStats };
  }

  /* ── Export / Import ── */
  function exportTest(id) {
    const t = getTest(id);
    if (!t) return;
    const blob = new Blob([JSON.stringify(t.questions, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = (t.name || 'test').replace(/\s+/g,'_') + '.json';
    a.click(); URL.revokeObjectURL(url);
  }

  function importFromFile(callback) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const q = JSON.parse(ev.target.result);
          if (!Array.isArray(q)) throw new Error('Must be an array');
          callback(q, file.name.replace('.json',''));
        } catch(err) { alert('Import failed: ' + err.message); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return { getTests, saveTest, getTest, deleteTest, getResults, saveResult,
           getResultsByTest, getTotalStats, exportTest, importFromFile };
})();
