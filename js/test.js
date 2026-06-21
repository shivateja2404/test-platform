/* ── test.js: Test-taking UI ── */
const TestUI = (() => {

  function begin(questions, mpq, testId) {
    const secs = Math.round(questions.length * mpq * 60);
    App.setState({
      testId,
      questions,
      currentQ: 0,
      answers: {},
      visited: {},
      reviewMarked: {},
      totalSeconds: secs,
      remainingSeconds: secs,
      testStartTime: Date.now(),
    });
    App.clearTimer();
    App.navigate('test');

    const iv = setInterval(() => {
      const s = App.getState();
      const rem = s.remainingSeconds - 1;
      App.setState({ remainingSeconds: rem });
      const el = document.getElementById('timer');
      if (el) {
        el.textContent = formatTime(rem);
        if (rem <= 300) el.className = 'timer-box timer-warning';
      }
      if (rem <= 0) { clearInterval(iv); App.clearTimer(); submit(); }
    }, 1000);
    App.setState({ timerInterval: iv });
  }

  function navClass(i) {
    const s = App.getState();
    if (s.reviewMarked[i]) return 'bg-purple-600';
    if (s.answers[i] !== undefined) return 'bg-green-600';
    if (s.visited[i]) return 'bg-red-600';
    return 'bg-slate-600';
  }

  function render() {
    const s = App.getState();
    const { questions, currentQ, answers, reviewMarked, remainingSeconds } = s;
    if (!questions || questions.length === 0) { App.navigate('landing'); return; }

    /* Mark visited */
    s.visited[currentQ] = true;

    const q = questions[currentQ];
    const answered = Object.keys(answers).length;
    const reviewed = Object.keys(reviewMarked).filter(k => reviewMarked[k]).length;

    document.getElementById('app').innerHTML = `
    <div class="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-900">

      <!-- ── LEFT: Question area ── -->
      <div class="flex-1 flex flex-col overflow-hidden">

        <!-- Top bar -->
        <div class="flex justify-between items-center bg-slate-900 border-b border-slate-700 px-5 py-3 flex-shrink-0">
          <div>
            <span class="text-slate-400 text-sm">Question</span>
            <span class="font-bold text-blue-400 text-lg mx-1">${currentQ + 1}</span>
            <span class="text-slate-400 text-sm">/ ${questions.length}</span>
          </div>
          <div id="timer" class="timer-box ${remainingSeconds <= 300 ? 'timer-warning' : ''}">
            ${formatTime(remainingSeconds)}
          </div>
        </div>

        <!-- Question body -->
        <div class="flex-1 overflow-auto p-5">
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">

            <!-- Topic -->
            <div class="mb-3">
              <span class="topic-tag">${escHtml(q.topic || 'General')}</span>
            </div>

            <!-- Question text (supports numbered lists via \n) -->
            <div class="question-text text-base font-medium leading-loose">
              ${fmtText(q.question)}
            </div>

            <!-- Options -->
            <div class="mt-6 space-y-3">
              ${q.options.map(opt => `
                <div onclick="TestUI.select('${opt.key}')"
                  class="question-option ${answers[currentQ] === opt.key ? 'selected' : ''}">
                  <div class="flex gap-3 items-start">
                    <span class="option-key">${escHtml(opt.key)}</span>
                    <span class="flex-1 question-text">${fmtText(opt.text)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Nav buttons -->
          <div class="flex flex-wrap gap-3 mt-5">
            <button onclick="TestUI.prev()" class="btn btn-slate">← Previous</button>
            <button onclick="TestUI.toggleReview()"
              class="btn btn-purple ${reviewMarked[currentQ] ? 'marked' : ''}">
              ${reviewMarked[currentQ] ? '★ Unmark Review' : '☆ Mark for Review'}
            </button>
            <button onclick="TestUI.next()" class="btn btn-blue">Next →</button>
            <button onclick="TestUI.submit()" class="btn btn-red ml-auto">Submit Test</button>
          </div>
        </div>
      </div>

      <!-- ── RIGHT: Palette sidebar ── -->
      <div class="lg:w-72 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <div class="font-bold text-base">Question Palette</div>
        </div>
        <div class="flex-1 overflow-auto p-4">

          <!-- Grid of question buttons -->
          <div class="grid grid-cols-5 gap-2">
            ${questions.map((_, i) => `
              <button onclick="TestUI.jump(${i})"
                class="palette-btn ${navClass(i)} ${i === currentQ ? 'active-q' : ''}">
                ${i + 1}
              </button>
            `).join('')}
          </div>

          <!-- Legend -->
          <div class="mt-5 space-y-2 text-xs text-slate-400">
            <div class="flex items-center gap-2"><span class="palette-legend bg-slate-600"></span> Not Visited</div>
            <div class="flex items-center gap-2"><span class="palette-legend bg-red-600"></span> Visited / Unanswered</div>
            <div class="flex items-center gap-2"><span class="palette-legend bg-green-600"></span> Answered</div>
            <div class="flex items-center gap-2"><span class="palette-legend bg-purple-600"></span> Marked for Review</div>
          </div>

          <!-- Stats -->
          <div class="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div class="bg-slate-700 rounded-lg p-2 text-center">
              <div class="font-bold text-green-400">${answered}</div>
              <div class="text-slate-400 text-xs">Answered</div>
            </div>
            <div class="bg-slate-700 rounded-lg p-2 text-center">
              <div class="font-bold text-slate-300">${questions.length - answered}</div>
              <div class="text-slate-400 text-xs">Unanswered</div>
            </div>
            <div class="bg-slate-700 rounded-lg p-2 text-center">
              <div class="font-bold text-purple-400">${reviewed}</div>
              <div class="text-slate-400 text-xs">For Review</div>
            </div>
            <div class="bg-slate-700 rounded-lg p-2 text-center">
              <div class="font-bold text-blue-400">${Object.keys(s.visited).length}</div>
              <div class="text-slate-400 text-xs">Visited</div>
            </div>
          </div>

        </div>
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

  function jump(i) { App.setState({ currentQ: i }); render(); }

  function next() {
    const s = App.getState();
    if (s.currentQ < s.questions.length - 1) { App.setState({ currentQ: s.currentQ + 1 }); render(); }
  }

  function prev() {
    const s = App.getState();
    if (s.currentQ > 0) { App.setState({ currentQ: s.currentQ - 1 }); render(); }
  }

  function submit() {
    App.clearTimer();
    const s = App.getState();
    const { questions, answers, totalSeconds, remainingSeconds, testId, testStartTime } = s;

    let correct = 0, wrong = 0, unattempted = 0;
    const topicStats = {};
    const wrongQs = [];

    questions.forEach((q, i) => {
      if (!topicStats[q.topic]) topicStats[q.topic] = { correct:0, wrong:0, total:0 };
      topicStats[q.topic].total++;
      const ua = answers[i];
      if (!ua) {
        unattempted++;
      } else if (ua === q.correctAnswer) {
        correct++;
        topicStats[q.topic].correct++;
      } else {
        wrong++;
        topicStats[q.topic].wrong++;
        wrongQs.push(i);
      }
    });

    const timeUsed = totalSeconds - remainingSeconds;
    const accuracy = questions.length > 0 ? (correct / questions.length * 100) : 0;
    const points   = calcPoints(correct, wrong);

    const result = {
      id: genId(),
      testId,
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
