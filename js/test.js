/* ── test.js ── */
const TestUI = (() => {

  function begin(questions, mpq, testId) {
    const secs = Math.round(questions.length * mpq * 60);
    App.setState({
      testId, questions,
      currentQ: 0, answers: {}, visited: {}, reviewMarked: {},
      totalSeconds: secs, remainingSeconds: secs,
      testStartTime: Date.now(),
    });
    App.clearTimer();
    App.navigate('test');

    const iv = setInterval(() => {
      const s   = App.getState();
      const rem = s.remainingSeconds - 1;
      App.setState({ remainingSeconds: rem });
      const el = document.getElementById('timer');
      if (el) {
        el.textContent = formatTime(rem);
        if (rem <= 300) el.className = 'timer warn';
      }
      if (rem <= 0) { clearInterval(iv); App.clearTimer(); submit(); }
    }, 1000);
    App.setState({ timerInterval: iv });
  }

  function palClass(i) {
    const s = App.getState();
    if (s.reviewMarked[i]) return 'p-review';
    if (s.answers[i] !== undefined) return 'p-answered';
    if (s.visited[i]) return 'p-visited';
    return 'p-unvisited';
  }

  function render() {
    const s = App.getState();
    const { questions, currentQ, answers, reviewMarked, remainingSeconds } = s;
    if (!questions || !questions.length) { App.navigate('landing'); return; }

    s.visited[currentQ] = true;

    const q        = questions[currentQ];
    const answered = Object.keys(answers).length;
    const reviewed = Object.values(reviewMarked).filter(Boolean).length;

    document.getElementById('app').innerHTML = `
    <div style="display:flex;flex-direction:column;height:100vh;background:var(--bg);overflow:hidden;">

      <!-- ── Top bar ── -->
      <header style="
        flex-shrink:0;
        display:flex;align-items:center;justify-content:space-between;gap:1rem;
        padding:0 1.25rem;height:52px;
        background:rgba(15,23,42,0.96);
        border-bottom:1px solid var(--border);
        backdrop-filter:blur(8px);
      ">
        <div style="display:flex;align-items:center;gap:1rem;min-width:0;">
          <button onclick="App.navigate('landing')" class="btn btn-ghost btn-sm">Exit</button>
          <div style="height:1.25rem;width:1px;background:var(--border);"></div>
          <span style="font-size:0.8125rem;color:var(--t2);">
            Question <strong style="color:var(--t1);">${currentQ + 1}</strong> / ${questions.length}
          </span>
          ${q.topic ? `<span class="tag" style="display:none;display:inline-flex;">${escHtml(q.topic)}</span>` : ''}
        </div>

        <div style="display:flex;align-items:center;gap:0.625rem;">
          <button onclick="TestUI.prev()" class="btn btn-ghost btn-sm">← Prev</button>
          <button onclick="TestUI.toggleReview()"
            class="btn btn-purple btn-sm ${reviewMarked[currentQ] ? 'active' : ''}">
            ${reviewMarked[currentQ] ? 'Unmark' : 'Mark Review'}
          </button>
          <button onclick="TestUI.next()" class="btn btn-primary btn-sm">Next →</button>
          <div style="height:1.25rem;width:1px;background:var(--border);"></div>
          <div id="timer" class="timer ${remainingSeconds <= 300 ? 'warn' : ''}">${formatTime(remainingSeconds)}</div>
          <button onclick="TestUI.submit()" class="btn btn-danger btn-sm">Submit</button>
        </div>
      </header>

      <!-- ── Body ── -->
      <div style="flex:1;display:flex;overflow:hidden;">

        <!-- Question panel -->
        <main style="flex:1;overflow-y:auto;padding:1.75rem 2rem;">

          <!-- Topic chip -->
          <div style="margin-bottom:1rem;">
            <span class="tag">${escHtml(q.topic || 'General')}</span>
          </div>

          <!-- Question text -->
          <div class="question-body" style="margin-bottom:1.5rem;">${fmtText(q.question)}</div>

          <!-- Options -->
          <div style="display:flex;flex-direction:column;gap:0.625rem;">
            ${q.options.map(opt => `
              <div onclick="TestUI.select('${opt.key}')"
                class="option ${answers[currentQ] === opt.key ? 'opt-selected' : ''}">
                <span class="opt-badge">${escHtml(opt.key)}</span>
                <span class="opt-text">${fmtText(opt.text)}</span>
              </div>
            `).join('')}
          </div>

        </main>

        <!-- Palette sidebar -->
        <aside style="
          width:256px;flex-shrink:0;
          background:var(--surface);
          border-left:1px solid var(--border);
          display:flex;flex-direction:column;
          overflow:hidden;
        ">
          <!-- Sidebar header -->
          <div style="padding:0.875rem 1rem;border-bottom:1px solid var(--border);flex-shrink:0;">
            <p class="section-title">Question Palette</p>
          </div>

          <!-- Scrollable content -->
          <div style="flex:1;overflow-y:auto;padding:1rem;">

            <!-- Grid -->
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.375rem;margin-bottom:1.25rem;">
              ${questions.map((_, i) => `
                <button onclick="TestUI.jump(${i})"
                  class="palette-btn ${palClass(i)} ${i === currentQ ? 'p-current' : ''}">
                  ${i + 1}
                </button>
              `).join('')}
            </div>

            <!-- Legend -->
            <div style="margin-bottom:1.25rem;">
              <p class="section-title" style="margin-bottom:0.625rem;">Legend</p>
              <div style="display:flex;flex-direction:column;gap:0.375rem;">
                <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:var(--t3);">
                  <span class="p-legend-dot" style="background:var(--surface-2);border:1px solid var(--border-hi);"></span> Not visited
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:var(--t3);">
                  <span class="p-legend-dot" style="background:#7f1d1d;"></span> Visited, unanswered
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:var(--t3);">
                  <span class="p-legend-dot" style="background:#065f46;"></span> Answered
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:var(--t3);">
                  <span class="p-legend-dot" style="background:#4c1d95;"></span> Marked for review
                </div>
              </div>
            </div>

            <!-- Counts -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
              ${[
                ['Answered',   answered,                              'text-green'],
                ['Unanswered', questions.length - answered,          'text-sub'],
                ['Review',     reviewed,                             'text-purple-300'],
                ['Visited',    Object.keys(s.visited).length,        'text-blue'],
              ].map(([lbl, val, cls]) => `
                <div class="card-inner" style="text-align:center;padding:0.625rem;">
                  <div style="font-size:1.125rem;font-weight:700;" class="${cls}">${val}</div>
                  <div class="caption">${lbl}</div>
                </div>
              `).join('')}
            </div>

          </div>
        </aside>

      </div>
    </div>`;
  }

  function select(key) {
    const s = App.getState();
    s.answers[s.currentQ] = key;
    render();
  }

  function toggleReview() {
    const s = App.getState();
    s.reviewMarked[s.currentQ] = !s.reviewMarked[s.currentQ];
    render();
  }

  function jump(i)  { App.setState({ currentQ: i }); render(); }
  function next()   { const s = App.getState(); if (s.currentQ < s.questions.length - 1) { App.setState({ currentQ: s.currentQ + 1 }); render(); } }
  function prev()   { const s = App.getState(); if (s.currentQ > 0) { App.setState({ currentQ: s.currentQ - 1 }); render(); } }

  function submit() {
    App.clearTimer();
    const s = App.getState();
    const { questions, answers, totalSeconds, remainingSeconds, testId, testStartTime } = s;

    let correct = 0, wrong = 0, unattempted = 0;
    const topicStats = {};
    const wrongQs    = [];

    questions.forEach((q, i) => {
      if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, wrong: 0, total: 0 };
      topicStats[q.topic].total++;
      const ua = answers[i];
      if (!ua) { unattempted++; }
      else if (ua === q.correctAnswer) { correct++; topicStats[q.topic].correct++; }
      else { wrong++; topicStats[q.topic].wrong++; wrongQs.push(i); }
    });

    const timeUsed = totalSeconds - remainingSeconds;
    const accuracy = questions.length ? (correct / questions.length * 100) : 0;
    const points   = calcPoints(correct, wrong);

    const result = {
      id: genId(), testId,
      timestamp: testStartTime || Date.now(),
      correct, wrong, unattempted,
      total: questions.length,
      accuracy, points, timeUsed,
      topicStats, answers, wrongQs,
    };

    DB.saveResult(result);
    Analytics.renderResults(result, testId, questions);
  }

  return { begin, render, select, toggleReview, jump, next, prev, submit };
})();
