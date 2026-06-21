/* ── app.js: State manager & router (loaded last) ── */
const App = (() => {
  let _state = {
    page: 'landing',
    testId: null,
    questions: [],
    currentQ: 0,
    answers: {},
    visited: {},
    reviewMarked: {},
    timerInterval: null,
    totalSeconds: 0,
    remainingSeconds: 0,
    testStartTime: null,
  };

  function getState() { return _state; }

  function setState(patch) { Object.assign(_state, patch); }

  function clearTimer() {
    if (_state.timerInterval) {
      clearInterval(_state.timerInterval);
      _state.timerInterval = null;
    }
  }

  function navigate(page, extra) {
    clearTimer();
    setState({ page, ...(extra || {}) });
    render();
  }

  function render() {
    switch (_state.page) {
      case 'landing':       Landing.render();      break;
      case 'test':          TestUI.render();        break;
      case 'results':       /* rendered by Analytics directly */ break;
      case 'all-analytics': /* rendered by Analytics directly */ break;
      default:              Landing.render();
    }
  }

  return { getState, setState, clearTimer, navigate, render };
})();

/* Boot */
App.navigate('landing');
