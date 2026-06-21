/* ── analytics.js ── */
const Analytics = (() => {

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

    <!-- Nav -->
    <nav class="top-nav">
      <div class="nav-logo">TSPSC <span>Prep</span></div>
      <div style="display:flex;gap:0.5rem;align-items:center;">
        ${result.testId ? `<button onclick="Landing.loadAndStart('${result.testId}')" class="btn btn-primary btn-sm">Retry Test</button>` : ''}
        <button onclick="Analytics.renderAll()" class="btn btn-ghost btn-sm">All Analytics</button>
        <button onclick="App.navigate('landing')" class="btn btn-ghost btn-sm">Home</button>
      </div>
    </nav>

    <div class="page" style="padding-top:2rem;">

      <!-- Page title -->
      <div style="margin-bottom:1.5rem;">
        <p class="section-title" style="margin-bottom:0.25rem;">Results</p>
        <h1 class="page-title">Test Performance</h1>
      </div>

      <!-- Score cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;margin-bottom:0.75rem;">
        <div class="score-card">
          <div class="score-card-lbl">Score</div>
          <div class="score-card-val text-blue">${result.correct}<span style="font-size:1rem;font-weight:500;color:var(--t3);">/${result.total}</span></div>
        </div>
        <div class="score-card">
          <div class="score-card-lbl">Accuracy</div>
          <div class="score-card-val ${pctColor(result.accuracy)}">${result.accuracy.toFixed(1)}<span style="font-size:1rem;font-weight:500;">%</span></div>
        </div>
        <div class="score-card">
          <div class="score-card-lbl">Points (TSPSC)</div>
          <div class="score-card-val text-amber">${result.points.toFixed(2)}</div>
        </div>
        <div class="score-card">
          <div class="score-card-lbl">Time Used</div>
          <div class="score-card-val" style="font-size:1.5rem;font-family:'JetBrains Mono',monospace;font-weight:500;color:var(--t2);">${formatTime(result.timeUsed)}</div>
        </div>
      </div>

      <!-- C/W/U row -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:1.75rem;">
        <div class="score-card" style="border-color:rgba(16,185,129,0.25);background:rgba(16,185,129,0.05);">
          <div class="score-card-lbl" style="color:#34d399;">Correct</div>
          <div style="display:flex;align-items:baseline;gap:0.5rem;margin-top:0.25rem;">
            <span style="font-size:2rem;font-weight:700;color:#34d399;">${result.correct}</span>
            <span class="caption">+${(result.correct * 2).toFixed(0)} pts</span>
          </div>
        </div>
        <div class="score-card" style="border-color:rgba(244,63,94,0.25);background:rgba(244,63,94,0.05);">
          <div class="score-card-lbl" style="color:#fb7185;">Wrong</div>
          <div style="display:flex;align-items:baseline;gap:0.5rem;margin-top:0.25rem;">
            <span style="font-size:2rem;font-weight:700;color:#fb7185;">${result.wrong}</span>
            <span class="caption">−${(result.wrong * 0.66).toFixed(2)} pts</span>
          </div>
        </div>
        <div class="score-card">
          <div class="score-card-lbl">Unattempted</div>
          <div style="font-size:2rem;font-weight:700;color:var(--t3);margin-top:0.25rem;">${result.unattempted}</div>
        </div>
      </div>

      <!-- Subject performance -->
      <div class="card" style="margin-bottom:1.25rem;">
        <p class="section-title" style="margin-bottom:1rem;">Subject Performance</p>
        <div style="display:flex;flex-direction:column;gap:0.875rem;">
          ${Object.entries(result.topicStats)
            .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
            .map(([topic, d]) => {
              const pct = d.total ? (d.correct / d.total * 100) : 0;
              return `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.375rem;">
                  <span style="font-size:0.875rem;font-weight:500;color:var(--t1);">${escHtml(topic)}</span>
                  <span style="display:flex;align-items:center;gap:0.75rem;font-size:0.8125rem;">
                    <span class="text-muted">${d.correct} / ${d.total}</span>
                    <span class="${pctColor(pct)}" style="font-weight:600;min-width:3.5rem;text-align:right;">${pct.toFixed(1)}%</span>
                  </span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill ${fillColor(pct)}" style="width:${pct}%;"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Wrong questions -->
      ${result.wrongQs && result.wrongQs.length > 0 ? `
        <div class="card" style="margin-bottom:1.25rem;">
          <details open>
            <summary style="display:flex;align-items:center;justify-content:space-between;">
              <p class="section-title" style="color:#fb7185;">Wrong Answers &nbsp;<span style="color:var(--t3);font-weight:400;text-transform:none;letter-spacing:0;">${result.wrongQs.length} questions</span></p>
              <span class="chevron text-muted"></span>
            </summary>
            <div style="margin-top:1rem;display:flex;flex-direction:column;gap:0.75rem;">
              ${result.wrongQs.map(i => {
                const q  = questions[i];
                if (!q) return '';
                const ua = result.answers[i];
                return `
                <div class="wrong-card">
                  <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:0.625rem;">
                    <span class="caption">Q${i + 1}</span>
                    <span class="tag">${escHtml(q.topic || '')}</span>
                  </div>
                  <div style="font-size:0.875rem;font-weight:500;color:var(--t1);line-height:1.7;margin-bottom:0.75rem;">${fmtText(q.question)}</div>
                  <div style="display:flex;flex-direction:column;gap:0.375rem;margin-bottom:0.625rem;">
                    ${q.options.map(opt => {
                      let cls = '';
                      if (opt.key === q.correctAnswer) cls = 'is-correct';
                      else if (opt.key === ua) cls = 'is-wrong';
                      return `
                      <div class="rev-opt ${cls}">
                        <span class="rev-opt-key">${escHtml(opt.key)}.</span>
                        <span style="flex:1;line-height:1.6;">${fmtText(opt.text)}</span>
                        ${opt.key === q.correctAnswer ? `<span style="font-size:0.75rem;color:#34d399;flex-shrink:0;">Correct</span>` : ''}
                        ${opt.key === ua && ua !== q.correctAnswer ? `<span style="font-size:0.75rem;color:#fb7185;flex-shrink:0;">Your answer</span>` : ''}
                      </div>`;
                    }).join('')}
                  </div>
                  ${q.explanation ? `
                    <details>
                      <summary style="display:flex;align-items:center;gap:0.375rem;font-size:0.75rem;color:var(--blue);cursor:pointer;">
                        Explanation <span class="chevron"></span>
                      </summary>
                      <div style="margin-top:0.5rem;font-size:0.8125rem;color:var(--t2);line-height:1.7;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);padding:0.75rem;">${fmtText(q.explanation)}</div>
                    </details>
                  ` : ''}
                </div>`;
              }).join('')}
            </div>
          </details>
        </div>
      ` : `
        <div class="card" style="margin-bottom:1.25rem;text-align:center;padding:1.25rem;">
          <p style="font-size:0.875rem;color:var(--green);">No wrong answers — perfect on all attempted questions.</p>
        </div>
      `}

      <!-- Attempt history -->
      ${allResults.length > 1 ? `
        <div class="card" style="margin-bottom:1.25rem;">
          <p class="section-title" style="margin-bottom:1rem;">Attempt History</p>
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr>
                <th>#</th><th>Date</th><th>Score</th><th>Accuracy</th><th>Points</th><th>Time</th>
              </tr></thead>
              <tbody>
                ${allResults.map((r, idx) => `
                  <tr class="${r.id === result.id ? 'highlight' : ''}">
                    <td class="text-muted">${idx + 1}${r.id === result.id ? ' <span style="color:#60a5fa;font-size:0.7rem;">(now)</span>' : ''}</td>
                    <td>${formatDate(r.timestamp)}</td>
                    <td style="color:var(--t1);">${r.correct}/${r.total}</td>
                    <td class="${pctColor(r.accuracy)}">${r.accuracy.toFixed(1)}%</td>
                    <td class="text-amber">${r.points.toFixed(2)}</td>
                    <td class="mono" style="font-size:0.8125rem;">${formatTime(r.timeUsed)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Full question review -->
      ${questions.length > 0 ? `
        <div class="card">
          <details>
            <summary style="display:flex;align-items:center;justify-content:space-between;">
              <p class="section-title">Full Question Review</p>
              <span class="chevron text-muted"></span>
            </summary>
            <div style="margin-top:1rem;display:flex;flex-direction:column;gap:0.875rem;">
              ${questions.map((q, i) => {
                const ua = result.answers[i];
                const ok = ua === q.correctAnswer;
                const statusColor = !ua ? 'var(--t3)' : ok ? '#34d399' : '#fb7185';
                const statusText  = !ua ? 'Skipped'   : ok ? 'Correct'  : 'Wrong';
                return `
                <div class="card-inner">
                  <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
                    <span class="caption">Q${i + 1}</span>
                    <span class="tag">${escHtml(q.topic || 'General')}</span>
                    <span style="margin-left:auto;font-size:0.75rem;font-weight:600;color:${statusColor};">${statusText}</span>
                  </div>
                  <div style="font-size:0.875rem;font-weight:500;color:var(--t1);line-height:1.7;margin-bottom:0.75rem;">${fmtText(q.question)}</div>
                  <div style="display:flex;flex-direction:column;gap:0.3rem;">
                    ${q.options.map(opt => {
                      let cls = '';
                      if (opt.key === q.correctAnswer) cls = 'is-correct';
                      else if (opt.key === ua && !ok) cls = 'is-wrong';
                      return `
                      <div class="rev-opt ${cls}">
                        <span class="rev-opt-key">${escHtml(opt.key)}.</span>
                        <span style="flex:1;line-height:1.6;">${fmtText(opt.text)}</span>
                        ${opt.key === q.correctAnswer ? `<span style="font-size:0.7rem;color:#34d399;flex-shrink:0;">Correct</span>` : ''}
                        ${opt.key === ua && !ok ? `<span style="font-size:0.7rem;color:#fb7185;flex-shrink:0;">Yours</span>` : ''}
                      </div>`;
                    }).join('')}
                  </div>
                  ${q.explanation ? `
                    <details style="margin-top:0.625rem;">
                      <summary style="display:flex;align-items:center;gap:0.375rem;font-size:0.75rem;color:var(--blue);cursor:pointer;">
                        Explanation <span class="chevron"></span>
                      </summary>
                      <div style="margin-top:0.5rem;font-size:0.8125rem;color:var(--t2);line-height:1.7;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:0.75rem;">${fmtText(q.explanation)}</div>
                    </details>
                  ` : ''}
                </div>`;
              }).join('')}
            </div>
          </details>
        </div>
      ` : ''}

    </div>`;
  }

  /* ── All-tests analytics ── */
  function renderAll() {
    const stats   = DB.getTotalStats();
    const results = DB.getResults();
    const tests   = DB.getTests();
    App.setState({ page: 'all-analytics' });

    document.getElementById('app').innerHTML = `

    <nav class="top-nav">
      <div class="nav-logo">TSPSC <span>Prep</span></div>
      <button onclick="App.navigate('landing')" class="btn btn-ghost btn-sm">Home</button>
    </nav>

    <div class="page" style="padding-top:2rem;">

      <div style="margin-bottom:1.5rem;">
        <p class="section-title" style="margin-bottom:0.25rem;">Analytics</p>
        <h1 class="page-title">All Tests Overview</h1>
      </div>

      ${!stats ? `
        <div class="card" style="text-align:center;padding:3.5rem 1.5rem;color:var(--t3);">
          <div style="font-size:1.75rem;margin-bottom:0.75rem;opacity:0.35;">◻</div>
          <p style="font-size:0.9rem;">No results yet.</p>
          <p style="font-size:0.8125rem;margin-top:0.25rem;">Take a test first to see analytics here.</p>
        </div>
      ` : `

        <!-- Overall cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;margin-bottom:0.75rem;">
          <div class="score-card">
            <div class="score-card-lbl">Total Points</div>
            <div class="score-card-val text-amber">${stats.totalPoints.toFixed(1)}</div>
          </div>
          <div class="score-card">
            <div class="score-card-lbl">Tests Taken</div>
            <div class="score-card-val text-blue">${stats.totalTests}</div>
          </div>
          <div class="score-card">
            <div class="score-card-lbl">Overall Accuracy</div>
            <div class="score-card-val ${pctColor(stats.totalCorrect / stats.totalQuestions * 100)}">${(stats.totalCorrect / stats.totalQuestions * 100).toFixed(1)}%</div>
          </div>
          <div class="score-card">
            <div class="score-card-lbl">Questions Done</div>
            <div class="score-card-val" style="color:var(--t2);">${stats.totalQuestions}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.75rem;">
          <div class="score-card" style="border-color:rgba(16,185,129,0.25);background:rgba(16,185,129,0.05);">
            <div class="score-card-lbl" style="color:#34d399;">Total Correct</div>
            <div style="font-size:2rem;font-weight:700;color:#34d399;margin-top:0.25rem;">${stats.totalCorrect}</div>
          </div>
          <div class="score-card" style="border-color:rgba(244,63,94,0.25);background:rgba(244,63,94,0.05);">
            <div class="score-card-lbl" style="color:#fb7185;">Total Wrong</div>
            <div style="font-size:2rem;font-weight:700;color:#fb7185;margin-top:0.25rem;">${stats.totalWrong}</div>
          </div>
        </div>

        <!-- Cumulative subject performance -->
        <div class="card" style="margin-bottom:1.25rem;">
          <p class="section-title" style="margin-bottom:1rem;">Cumulative Subject Performance</p>
          <div style="display:flex;flex-direction:column;gap:0.875rem;">
            ${Object.entries(stats.topicStats)
              .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
              .map(([topic, d]) => {
                const pct = d.total ? (d.correct / d.total * 100) : 0;
                return `
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.375rem;">
                    <span style="font-size:0.875rem;font-weight:500;color:var(--t1);">${escHtml(topic)}</span>
                    <span style="display:flex;align-items:center;gap:0.75rem;font-size:0.8125rem;">
                      <span class="text-muted">${d.correct} / ${d.total}</span>
                      <span class="${pctColor(pct)}" style="font-weight:600;min-width:3.5rem;text-align:right;">${pct.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill ${fillColor(pct)}" style="width:${pct}%;"></div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Per-test summary -->
        ${tests.length ? `
          <div class="card" style="margin-bottom:1.25rem;">
            <p class="section-title" style="margin-bottom:1rem;">Per-Test Summary</p>
            <div style="display:flex;flex-direction:column;gap:0.625rem;">
              ${tests.map(t => {
                const rs = DB.getResultsByTest(t.id);
                if (!rs.length) return '';
                const best    = rs.reduce((b, r) => (!b || r.accuracy > b.accuracy) ? r : b, null);
                const last    = rs[rs.length - 1];
                const totPts  = rs.reduce((s, r) => s + r.points, 0);
                return `
                <div class="card-inner" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.75rem;">
                  <div>
                    <div style="font-size:0.875rem;font-weight:600;color:var(--t1);">${escHtml(t.name)}</div>
                    <div class="caption" style="margin-top:0.2rem;">${t.questions.length} questions · ${rs.length} attempt${rs.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                    <span style="font-size:0.75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:0.2rem 0.6rem;">
                      Best <span class="${pctColor(best.accuracy)}">${best.accuracy.toFixed(1)}%</span>
                    </span>
                    <span style="font-size:0.75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:0.2rem 0.6rem;">
                      Last <span class="${pctColor(last.accuracy)}">${last.accuracy.toFixed(1)}%</span>
                    </span>
                    <span style="font-size:0.75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:0.2rem 0.6rem;">
                      <span class="text-amber">${totPts.toFixed(1)}</span> pts
                    </span>
                    <button onclick="Landing.loadAndStart('${t.id}')" class="btn btn-primary btn-sm">Retry</button>
                    <button onclick="Analytics.renderResults(null,'${t.id}')" class="btn btn-ghost btn-sm">Results</button>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Recent activity table -->
        <div class="card">
          <p class="section-title" style="margin-bottom:1rem;">Recent Activity</p>
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr>
                <th>Test</th><th>Date</th><th>Score</th><th>Accuracy</th><th>Points</th><th>Time</th>
              </tr></thead>
              <tbody>
                ${results.slice().reverse().slice(0, 30).map(r => {
                  const t = tests.find(x => x.id === r.testId);
                  return `<tr>
                    <td style="font-weight:500;color:var(--t1);">${t ? escHtml(t.name) : '<span class="text-muted">Custom</span>'}</td>
                    <td>${formatDate(r.timestamp)}</td>
                    <td style="color:var(--t1);">${r.correct}/${r.total}</td>
                    <td class="${pctColor(r.accuracy)}">${r.accuracy.toFixed(1)}%</td>
                    <td class="text-amber">${r.points.toFixed(2)}</td>
                    <td class="mono" style="font-size:0.8125rem;">${formatTime(r.timeUsed)}</td>
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
