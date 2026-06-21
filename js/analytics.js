/* ── analytics.js: Results & All-Tests Analytics ── */
const Analytics = (() => {

  /* Called right after a test, or from the library ("View Analytics") */
  function renderResults(result, testId, inlineQuestions) {
    /* Resolve result */
    if (!result && testId) {
      const list = DB.getResultsByTest(testId);
      if (!list.length) { App.navigate('landing'); return; }
      result = list[list.length - 1];
    }
    if (!result) { App.navigate('landing'); return; }

    /* Resolve questions */
    let questions = inlineQuestions || [];
    if (!questions.length && result.testId) {
      const t = DB.getTest(result.testId);
      if (t) questions = t.questions;
    }
    if (!questions.length) questions = App.getState().questions || [];

    const allResults = result.testId ? DB.getResultsByTest(result.testId) : [];
    App.setState({ page: 'results' });

    document.getElementById('app').innerHTML = `
    <div class="max-w-6xl mx-auto p-5 space-y-6">

      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center gap-3">
        <h1 class="text-2xl font-bold">📊 Test Results</h1>
        <div class="flex gap-2 flex-wrap">
          ${result.testId ? `<button onclick="Landing.loadAndStart('${result.testId}')" class="btn btn-blue">🔄 Retry Test</button>` : ''}
          <button onclick="Analytics.renderAll()" class="btn btn-slate">All Analytics</button>
          <button onclick="App.navigate('landing')" class="btn btn-slate">🏠 Home</button>
        </div>
      </div>

      <!-- Score Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="score-card">
          <div class="score-label">Score</div>
          <div class="score-value text-blue-400">${result.correct}/${result.total}</div>
        </div>
        <div class="score-card">
          <div class="score-label">Accuracy</div>
          <div class="score-value ${pctColor(result.accuracy)}">${result.accuracy.toFixed(1)}%</div>
        </div>
        <div class="score-card">
          <div class="score-label">Points (TSPSC)</div>
          <div class="score-value text-yellow-400">${result.points.toFixed(2)}</div>
        </div>
        <div class="score-card">
          <div class="score-label">Time Used</div>
          <div class="score-value text-slate-300 text-2xl">${formatTime(result.timeUsed)}</div>
        </div>
      </div>

      <!-- C/W/U boxes -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-xl p-4 text-center border border-green-700 bg-green-900/30">
          <div class="text-3xl font-bold text-green-400">${result.correct}</div>
          <div class="text-green-300 text-sm mt-1">✅ Correct (+${(result.correct*2).toFixed(0)} pts)</div>
        </div>
        <div class="rounded-xl p-4 text-center border border-red-700 bg-red-900/30">
          <div class="text-3xl font-bold text-red-400">${result.wrong}</div>
          <div class="text-red-300 text-sm mt-1">❌ Wrong (−${(result.wrong*0.66).toFixed(2)} pts)</div>
        </div>
        <div class="rounded-xl p-4 text-center border border-slate-600 bg-slate-700/30">
          <div class="text-3xl font-bold text-slate-300">${result.unattempted}</div>
          <div class="text-slate-400 text-sm mt-1">⬜ Unattempted</div>
        </div>
      </div>

      <!-- Subject Performance -->
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 class="text-lg font-bold mb-4">📚 Subject Performance</h2>
        <div class="space-y-3">
          ${Object.entries(result.topicStats)
            .sort((a,b) => (b[1].correct/b[1].total) - (a[1].correct/a[1].total))
            .map(([topic, d]) => {
              const pct = d.total > 0 ? (d.correct/d.total*100) : 0;
              return `
              <div>
                <div class="flex justify-between items-center mb-1 text-sm">
                  <span class="font-medium">${escHtml(topic)}</span>
                  <span class="text-slate-400">${d.correct}/${d.total} &nbsp; <span class="${pctColor(pct)}">${pct.toFixed(1)}%</span></span>
                </div>
                <div class="progress-track h-2.5">
                  <div class="progress-bar h-2.5 ${barColor(pct)}" style="width:${pct}%"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Wrong Questions -->
      ${result.wrongQs && result.wrongQs.length > 0 ? `
        <div class="bg-slate-800 border border-red-900 rounded-xl p-5">
          <details open>
            <summary class="flex justify-between items-center cursor-pointer">
              <h2 class="text-lg font-bold text-red-400">❌ Wrong Questions (${result.wrongQs.length})</h2>
              <span class="arr text-slate-400 text-sm pr-1"></span>
            </summary>
            <div class="mt-4 space-y-4">
              ${result.wrongQs.map(i => {
                const q = questions[i];
                if (!q) return '';
                const ua = result.answers[i];
                return `
                <div class="bg-slate-900 rounded-lg p-4">
                  <div class="text-xs text-slate-500 mb-2">Q${i+1} &nbsp;·&nbsp; <span class="topic-tag">${escHtml(q.topic||'')}</span></div>
                  <div class="question-text font-medium text-sm mb-3">${fmtText(q.question)}</div>
                  <div class="space-y-1.5">
                    ${q.options.map(opt => {
                      let cls = 'opt-neutral';
                      if (opt.key === q.correctAnswer) cls = 'opt-correct';
                      else if (opt.key === ua) cls = 'opt-wrong';
                      return `
                      <div class="${cls} rounded-lg p-2 flex gap-2 text-sm items-start">
                        <span class="font-bold min-w-[1.2rem]">${escHtml(opt.key)}.</span>
                        <span class="flex-1 question-text">${fmtText(opt.text)}</span>
                        ${opt.key === q.correctAnswer ? '<span class="text-green-400 flex-shrink-0">✓</span>' : ''}
                        ${opt.key === ua && ua !== q.correctAnswer ? '<span class="text-red-400 flex-shrink-0">✗</span>' : ''}
                      </div>`;
                    }).join('')}
                  </div>
                  <div class="mt-2 text-xs text-slate-500">
                    Your answer: <span class="text-red-400 font-bold">${escHtml(ua||'—')}</span>
                    &nbsp;·&nbsp; Correct: <span class="text-green-400 font-bold">${escHtml(q.correctAnswer)}</span>
                  </div>
                  ${q.explanation ? `
                    <details class="mt-3">
                      <summary class="text-blue-400 text-xs cursor-pointer">💡 Explanation <span class="arr"></span></summary>
                      <div class="mt-2 text-slate-300 text-xs bg-slate-800 p-3 rounded leading-relaxed">${fmtText(q.explanation)}</div>
                    </details>` : ''}
                </div>`;
              }).join('')}
            </div>
          </details>
        </div>
      ` : `<div class="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center text-green-300">🎉 No wrong answers! Perfect score on all attempted questions.</div>`}

      <!-- Attempt History -->
      ${allResults.length > 1 ? `
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 class="text-lg font-bold mb-4">🕒 Attempt History</h2>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead><tr>
                <th>#</th><th>Date</th><th>Score</th><th>Accuracy</th><th>Points</th><th>Time</th>
              </tr></thead>
              <tbody>
                ${allResults.map((r,idx) => `
                  <tr ${r.id === result.id ? 'style="background:#1e3a5f"' : ''}>
                    <td class="text-slate-500">${idx+1}${r.id === result.id ? ' <span class="text-blue-400 text-xs">← now</span>' : ''}</td>
                    <td>${formatDate(r.timestamp)}</td>
                    <td>${r.correct}/${r.total}</td>
                    <td class="${pctColor(r.accuracy)}">${r.accuracy.toFixed(1)}%</td>
                    <td class="text-yellow-400">${r.points.toFixed(2)}</td>
                    <td>${formatTime(r.timeUsed)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Full Question Review -->
      ${questions.length > 0 ? `
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <details>
            <summary class="flex justify-between items-center cursor-pointer">
              <h2 class="text-lg font-bold">🔍 Full Question Review</h2>
              <span class="arr text-slate-400 text-sm pr-1"></span>
            </summary>
            <div class="mt-4 space-y-5">
              ${questions.map((q,i) => {
                const ua = result.answers[i];
                const ok = ua === q.correctAnswer;
                const icon = !ua ? '⬜' : ok ? '✅' : '❌';
                return `
                <div class="bg-slate-900 rounded-lg p-5">
                  <div class="flex items-start gap-3 mb-3">
                    <span class="text-xl flex-shrink-0">${icon}</span>
                    <div>
                      <span class="topic-tag">${escHtml(q.topic||'General')}</span>
                      <span class="text-slate-500 text-xs ml-2">Q${i+1}</span>
                    </div>
                  </div>
                  <div class="question-text font-medium mb-4">${fmtText(q.question)}</div>
                  <div class="space-y-2">
                    ${q.options.map(opt => {
                      let cls = 'opt-neutral';
                      if (opt.key === q.correctAnswer) cls = 'opt-correct';
                      else if (opt.key === ua && !ok) cls = 'opt-wrong';
                      return `
                      <div class="${cls} rounded-lg p-3 flex gap-2 text-sm items-start">
                        <span class="font-bold min-w-[1.25rem]">${escHtml(opt.key)}.</span>
                        <span class="flex-1 question-text">${fmtText(opt.text)}</span>
                        ${opt.key === q.correctAnswer ? '<span class="text-green-400 text-xs flex-shrink-0">✓ Correct</span>' : ''}
                        ${opt.key === ua && !ok ? '<span class="text-red-400 text-xs flex-shrink-0">✗ Your Ans</span>' : ''}
                      </div>`;
                    }).join('')}
                  </div>
                  ${!ua ? '<div class="mt-2 text-slate-500 text-xs">Not attempted</div>' : ''}
                  ${q.explanation ? `
                    <details class="mt-3">
                      <summary class="text-blue-400 text-xs cursor-pointer">💡 Explanation <span class="arr"></span></summary>
                      <div class="mt-2 text-slate-300 text-xs bg-slate-800 p-3 rounded leading-relaxed">${fmtText(q.explanation)}</div>
                    </details>` : ''}
                </div>`;
              }).join('')}
            </div>
          </details>
        </div>
      ` : ''}

    </div>`;
  }

  /* All-tests aggregate analytics */
  function renderAll() {
    const stats   = DB.getTotalStats();
    const results = DB.getResults();
    const tests   = DB.getTests();
    App.setState({ page: 'all-analytics' });

    document.getElementById('app').innerHTML = `
    <div class="max-w-6xl mx-auto p-5 space-y-6">

      <div class="flex justify-between items-center flex-wrap gap-3">
        <h1 class="text-2xl font-bold">📊 All Tests Analytics</h1>
        <button onclick="App.navigate('landing')" class="btn btn-slate">🏠 Home</button>
      </div>

      ${!stats ? `
        <div class="text-center py-20 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">
          <div class="text-5xl mb-4">📭</div>
          <p class="text-lg">No results yet.</p>
          <p class="text-sm mt-1">Take a test first!</p>
        </div>
      ` : `
        <!-- Overall cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="score-card">
            <div class="score-label">Total Points</div>
            <div class="score-value text-yellow-400">${stats.totalPoints.toFixed(1)}</div>
          </div>
          <div class="score-card">
            <div class="score-label">Tests Taken</div>
            <div class="score-value text-blue-400">${stats.totalTests}</div>
          </div>
          <div class="score-card">
            <div class="score-label">Overall Accuracy</div>
            <div class="score-value ${pctColor(stats.totalCorrect/stats.totalQuestions*100)}">${(stats.totalCorrect/stats.totalQuestions*100).toFixed(1)}%</div>
          </div>
          <div class="score-card">
            <div class="score-label">Questions Done</div>
            <div class="score-value text-slate-300 text-2xl">${stats.totalQuestions}</div>
          </div>
        </div>

        <!-- C/W summary -->
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-xl p-4 text-center border border-green-700 bg-green-900/20">
            <div class="text-3xl font-bold text-green-400">${stats.totalCorrect}</div>
            <div class="text-green-300 text-sm mt-1">Total Correct</div>
          </div>
          <div class="rounded-xl p-4 text-center border border-red-700 bg-red-900/20">
            <div class="text-3xl font-bold text-red-400">${stats.totalWrong}</div>
            <div class="text-red-300 text-sm mt-1">Total Wrong</div>
          </div>
        </div>

        <!-- Subject breakdown -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 class="text-lg font-bold mb-4">📚 Subject Breakdown (Cumulative)</h2>
          <div class="space-y-3">
            ${Object.entries(stats.topicStats)
              .sort((a,b) => (b[1].correct/b[1].total) - (a[1].correct/a[1].total))
              .map(([topic, d]) => {
                const pct = d.total ? (d.correct/d.total*100) : 0;
                return `
                <div>
                  <div class="flex justify-between items-center mb-1 text-sm flex-wrap gap-1">
                    <span class="font-medium">${escHtml(topic)}</span>
                    <span class="text-slate-400">${d.correct}/${d.total} correct &nbsp; <span class="${pctColor(pct)} font-bold">${pct.toFixed(1)}%</span></span>
                  </div>
                  <div class="progress-track h-2.5">
                    <div class="progress-bar h-2.5 ${barColor(pct)}" style="width:${pct}%"></div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Per-test breakdown -->
        ${tests.length > 0 ? `
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 class="text-lg font-bold mb-4">🗂 Per-Test Summary</h2>
            <div class="space-y-3">
              ${tests.map(t => {
                const rs = DB.getResultsByTest(t.id);
                if (!rs.length) return '';
                const best = rs.reduce((b,r) => (!b || r.accuracy > b.accuracy) ? r : b, null);
                const last = rs[rs.length-1];
                const totalPts = rs.reduce((s,r) => s + r.points, 0);
                return `
                <div class="bg-slate-900 rounded-lg p-4">
                  <div class="flex flex-wrap justify-between gap-2 items-start">
                    <div>
                      <div class="font-semibold">${escHtml(t.name)}</div>
                      <div class="text-slate-400 text-xs mt-1">${t.questions.length} questions · ${rs.length} attempt${rs.length>1?'s':''}</div>
                    </div>
                    <div class="flex gap-2 text-xs flex-wrap">
                      <span class="bg-slate-700 px-2 py-0.5 rounded">Best: <span class="${pctColor(best.accuracy)}">${best.accuracy.toFixed(1)}%</span></span>
                      <span class="bg-slate-700 px-2 py-0.5 rounded">Last: <span class="${pctColor(last.accuracy)}">${last.accuracy.toFixed(1)}%</span></span>
                      <span class="bg-slate-700 px-2 py-0.5 rounded">Points: <span class="text-yellow-400">${totalPts.toFixed(1)}</span></span>
                    </div>
                  </div>
                  <div class="mt-3 flex gap-2">
                    <button onclick="Landing.loadAndStart('${t.id}')" class="btn btn-blue text-xs">🔄 Retry</button>
                    <button onclick="Analytics.renderResults(null,'${t.id}')" class="btn btn-slate text-xs">📊 View Results</button>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Recent history (all tests) -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 class="text-lg font-bold mb-4">🕒 Recent Activity</h2>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead><tr>
                <th>Test</th><th>Date</th><th>Score</th><th>Accuracy</th><th>Points</th><th>Time</th>
              </tr></thead>
              <tbody>
                ${results.slice().reverse().slice(0, 30).map(r => {
                  const t = tests.find(x => x.id === r.testId);
                  return `<tr>
                    <td class="font-medium">${t ? escHtml(t.name) : '<span class="text-slate-500">Custom</span>'}</td>
                    <td class="text-slate-400 text-xs">${formatDate(r.timestamp)}</td>
                    <td>${r.correct}/${r.total}</td>
                    <td class="${pctColor(r.accuracy)}">${r.accuracy.toFixed(1)}%</td>
                    <td class="text-yellow-400">${r.points.toFixed(2)}</td>
                    <td>${formatTime(r.timeUsed)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    </div>`;
  }

  return { renderResults, renderAll };
})();
