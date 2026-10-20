import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { checkAllAchievements } from './global-achievements.js';
import { solveEquation, formatSolution } from './equation-solver.js';

const firebaseConfig = {
  apiKey: "AIzaSy83l2S3KIA2LR4MwbUMVgzdTVJxE6l67M",
  authDomain: "aventuras-numericas.firebaseapp.com",
  projectId: "aventuras-numericas",
  storageBucket: "aventuras-numericas.firebasestorage.app",
  messagingSenderId: "460325123048",
  appId: "1:460325123048:web:84c41597efbd2976b0e76d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

var currentUser = localStorage.getItem('currentUser');
document.body.className = localStorage.getItem('background') || 'ciudad';
if (!currentUser) window.location.href = 'index.html';

var user = null;
var userRef = null;
var activeDuelId = localStorage.getItem('activeDuel');
var isBattleMode = new URLSearchParams(window.location.search).get('mode') === 'battle';
var duelData = null;
var battleTimer = null;
var battlePreparationTimer = null;
var battleHasStarted = false;
var battleSkinsLoaded = false;
var battleResultHandled = false;
var currentProblem = null;
var quizStreak = 0;
var infinityStreak = 0;
var infinityBestStreak = 0;
var infinityCoinsEarned = 0;
var isProcessingInfinityAnswer = false;
var currentQuizDifficulty = 'facil';
var activePowerDouble = false;
var activePowerFifty = false;
var activePowerLight = false;
var currentPowerHint = 'Usa tus poderes para ayudarte en la siguiente pregunta.';

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  updateXPDisplay();

  if (isBattleMode && activeDuelId) {
    initBattle();
  } else {
    initGame();
  }
  initMusic();
  updateQuizPowerPanel();
}

function updateXPDisplay() {
  const level = Math.floor(user.xp / 500) + 1;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = `⭐ ${user.xp} XP (Nivel ${level})`;
}

async function saveUser() {
  await setDoc(userRef, user);
  await checkAllAchievements(user, userRef);
}

function getPowerCounts() {
  if (!user) return { double: 0, fifty: 0, light: 0 };
  return {
    double: Number(user.powerDoubleOwned || 0),
    fifty: Number(user.powerFiftyOwned || 0),
    light: Number(user.powerLightOwned || 0)
  };
}

function updateQuizPowerPanel() {
  const panel = document.getElementById('quizPowerPanel');
  if (!panel) return;

  const counts = getPowerCounts();
  const powerButtons = panel.querySelectorAll('[data-power]');

  powerButtons.forEach(button => {
    const powerType = button.dataset.power;
    const count = counts[powerType] || 0;
    const countNode = button.querySelector('.power-count');
    if (countNode) countNode.textContent = count;

    const hasPower = count > 0;
    button.disabled = !hasPower;
    button.classList.toggle('disabled', !hasPower);
    button.classList.toggle('usable', hasPower);
  });

  const hintNode = document.getElementById('powerHint');
  if (hintNode) {
    hintNode.textContent = currentPowerHint || 'Usa tus poderes para ayudarte en la siguiente pregunta.';
  }
}

function buildProblemHint(problem) {
  if (!problem || (!problem.ans && problem.ans !== 0)) return 'Intenta resolverlo con calma.';
  const answer = Number(problem.ans);
  if (answer === 0) return 'Pista: la respuesta es 0.';
  const sign = answer > 0 ? 'positiva' : 'negativa';
  const parity = answer % 2 === 0 ? 'par' : 'impar';
  return `Pista: la respuesta es ${sign} y ${parity}.`;
}

function buildFiftyHint(problem) {
  if (!problem || (!problem.ans && problem.ans !== 0)) return '50/50: rango indefinido.';
  const answer = Number(problem.ans);
  const lower = Math.max(-50, answer - 10);
  const upper = answer + 10;
  return `50/50: la respuesta está entre ${lower} y ${upper}.`;
}

window.usePower = async function(powerType) {
  if (!user || !currentProblem) return;
  const counts = getPowerCounts();

  if (powerType === 'double') {
    if (counts.double <= 0) {
      currentPowerHint = 'No tienes 2x Puntos disponibles.';
      updateQuizPowerPanel();
      return;
    }
    user.powerDoubleOwned = counts.double - 1;
    activePowerDouble = true;
    currentPowerHint = '2x Puntos activado para la siguiente respuesta correcta.';
  } else if (powerType === 'fifty') {
    if (counts.fifty <= 0) {
      currentPowerHint = 'No tienes 50/50 disponible.';
      updateQuizPowerPanel();
      return;
    }
    user.powerFiftyOwned = counts.fifty - 1;
    activePowerFifty = true;
    currentPowerHint = buildFiftyHint(currentProblem);
  } else if (powerType === 'light') {
    if (counts.light <= 0) {
      currentPowerHint = 'No tienes Pista disponible.';
      updateQuizPowerPanel();
      return;
    }
    user.powerLightOwned = counts.light - 1;
    activePowerLight = true;
    currentPowerHint = buildProblemHint(currentProblem);
  } else {
    return;
  }

  await saveUser();
  updateQuizPowerPanel();
};

async function initBattle() {
  document.getElementById('gameChoice').classList.add('hidden');
  document.getElementById('battleSection').classList.remove('hidden');

  const duelRef = doc(db, 'duels', activeDuelId);
  onSnapshot(duelRef, (snap) => {
    if (!snap.exists()) return;
    duelData = snap.data();
    updateBattleUI();
    loadBattleSkins();
    if (duelData.status === 'active' && !battleHasStarted) syncBattleStart();
    if (duelData.status === 'finished' && !battleResultHandled) {
        finishBattle();
    }
  });
}

function syncBattleStart() {
  if (!duelData || battleHasStarted) return;
  const preparation = document.getElementById('battlePreparation');
  const answerInput = document.getElementById('battleAnsInput');
  const answerButton = document.querySelector('#battleGame .btn-primary');
  const startAt = Number(duelData.startTime || Date.now() + 5000);
  if (answerInput) answerInput.disabled = true;
  if (answerButton) answerButton.disabled = true;
  clearInterval(battlePreparationTimer);
  const tick = () => {
    const seconds = Math.max(0, Math.ceil((startAt - Date.now()) / 1000));
    if (seconds > 0) {
      if (preparation) preparation.textContent = `Prepárate: ${seconds}`;
      document.getElementById('battleQuestionText').textContent = '¡PREPÁRATE!';
      return;
    }
    clearInterval(battlePreparationTimer);
    battleHasStarted = true;
    if (preparation) preparation.textContent = '¡A JUGAR!';
    if (answerInput) answerInput.disabled = false;
    if (answerButton) answerButton.disabled = false;
    startBattleTimer(startAt);
    showBattleQuestion();
  };
  tick();
  if (!battleHasStarted) battlePreparationTimer = setInterval(tick, 250);
}

const battleSkinSources = {
  spiderman: 'spiderman.png', batman: 'batman.jpg', ironman: 'ironman.png',
  goku: 'goku.png', sasuke: 'sasuke.png', kakashi: 'kakashi.jpg',
  vegeta: 'vegeta.png', itachi: 'itachi.png', zoro: 'zoro.png', luffy: 'luffy.png'
};

async function loadBattleSkins() {
  if (!duelData || battleSkinsLoaded) return;
  try {
    let challenger = { skin: duelData.challengerSkin };
    let opponent = { skin: duelData.opponentSkin };
    if (!challenger.skin || !opponent.skin) {
      const [challengerSnap, opponentSnap] = await Promise.all([
        getDoc(doc(db, 'users', duelData.challenger)),
        getDoc(doc(db, 'users', duelData.opponent))
      ]);
      challenger = challengerSnap.exists() ? challengerSnap.data() : challenger;
      opponent = opponentSnap.exists() ? opponentSnap.data() : opponent;
    }
    const setAvatar = (id, skin) => {
      const node = document.getElementById(id);
      if (!node) return;
      const source = battleSkinSources[skin] || battleSkinSources.spiderman;
      node.innerHTML = `<img class="battle-skin" src="${source}" alt="Avatar" onerror="this.src='spiderman.png'">`;
    };
    setAvatar('p1Avatar', challenger.skin);
    setAvatar('p2Avatar', opponent.skin);
    battleSkinsLoaded = true;
  } catch (error) {
    console.warn('No se pudieron cargar las skins de la batalla:', error);
  }
}

function updateBattleUI() {
  document.getElementById('p1Name').textContent = duelData.challenger;
  document.getElementById('p2Name').textContent = duelData.opponent;
  const p1Score = Number(duelData.p1Score || 0);
  const p2Score = Number(duelData.p2Score || 0);
  document.getElementById('p1Score').textContent = p1Score;
  document.getElementById('p2Score').textContent = p2Score;
  document.getElementById('battleBetLabel').textContent = `Apuesta: ${Number(duelData.bet || 0)} 💰`;
  const p1 = document.querySelector('.battle-player:first-child');
  const p2 = document.querySelector('.battle-player:last-child');
  [p1, p2].forEach(player => player?.classList.remove('team-leading', 'team-draw'));
  if (p1 && p2) {
    if (p1Score === p2Score) {
      p1.classList.add('team-draw');
      p2.classList.add('team-draw');
    } else (p1Score > p2Score ? p1 : p2).classList.add('team-leading');
  }
}

function startBattleTimer(startAt) {
  clearInterval(battleTimer);
  const duration = Number(duelData.duration || 60);
  const battleEndsAt = Number(startAt || duelData.startTime || Date.now()) + (duration * 1000);
  const updateTimer = () => {
    const timeLeft = Math.max(0, Math.ceil((battleEndsAt - Date.now()) / 1000));
    document.getElementById('battleTimerText').textContent = timeLeft + 's';
    document.getElementById('battleTimerFill').style.width = `${Math.min(100, (timeLeft / duration) * 100)}%`;
    if (timeLeft <= 0) {
      clearInterval(battleTimer);
      endBattle();
    }
  };
  updateTimer();
  battleTimer = setInterval(() => {
    updateTimer();
  }, 250);
}

function showBattleQuestion() {
  const diffs = ['facil', 'normal', 'dificil'];
  const diff = diffs[Math.floor(Math.random() * diffs.length)];
  currentProblem = generateProblem(diff);
  document.getElementById('battleQuestionText').innerHTML = currentProblem.q;
  document.getElementById('battleAnsInput').value = '';
  document.getElementById('battleAnsInput').focus();
}

window.checkBattleAnswer = async () => {
  if (document.getElementById('battleAnsInput')?.disabled) return;
  const ans = parseInt(document.getElementById('battleAnsInput').value);
  if (Number.isNaN(ans)) return;
  const isP1 = duelData.challenger === currentUser;
  const correctKey = isP1 ? 'p1Correct' : 'p2Correct';
  const wrongKey = isP1 ? 'p1Wrong' : 'p2Wrong';
  const currentCorrect = Number(duelData[correctKey] || 0);
  const currentWrong = Number(duelData[wrongKey] || 0);
  if (ans === currentProblem.ans) {
    const update = isP1
      ? { p1Score: Number(duelData.p1Score || 0) + 1, [correctKey]: currentCorrect + 1 }
      : { p2Score: Number(duelData.p2Score || 0) + 1, [correctKey]: currentCorrect + 1 };
    await setDoc(doc(db, 'duels', activeDuelId), update, { merge: true });
    showBattleQuestion();
  } else {
    await setDoc(doc(db, 'duels', activeDuelId), { [wrongKey]: currentWrong + 1 }, { merge: true });
    document.getElementById('battleAnsInput').value = '';
  }
};

async function endBattle() {
  const isP1 = duelData.challenger === currentUser;
  if (isP1) {
    await setDoc(doc(db, 'duels', activeDuelId), { status: 'finished' }, { merge: true });
  }
}

async function finishBattle() {
  clearInterval(battleTimer);
  const isP1 = duelData.challenger === currentUser;
  const myScore = isP1 ? duelData.p1Score : duelData.p2Score;
  const opScore = isP1 ? duelData.p2Score : duelData.p1Score;
  const correct = Number(duelData[isP1 ? 'p1Correct' : 'p2Correct'] || 0);
  const wrong = Number(duelData[isP1 ? 'p1Wrong' : 'p2Wrong'] || 0);
  const total = correct + wrong;
  const precision = total ? Math.round((correct / total) * 100) : 0;
  if (battleResultHandled) return;
  battleResultHandled = true;
  const winner = myScore > opScore ? duelData.challenger : myScore < opScore ? duelData.opponent : 'draw';
  await setDoc(doc(db, 'duels', activeDuelId), { winner, finishedAt: Date.now() }, { merge: true });
  
  let resultMsg = '';
  let icon = '';

  if (myScore > opScore) {
    resultMsg = `¡GANASTE! +${duelData.bet} monedas`;
    icon = '🏆';
    user.coins += Number(duelData.bet || 0);
    user.duelsWon = (user.duelsWon || 0) + 1;
    user.duelCurrentStreak = Number(user.duelCurrentStreak || 0) + 1;
    user.duelBestStreak = Math.max(Number(user.duelBestStreak || 0), user.duelCurrentStreak);
  } else if (myScore < opScore) {
    resultMsg = `PERDISTE. -${duelData.bet} monedas`;
    icon = '💀';
    user.coins -= Number(duelData.bet || 0);
    user.duelCurrentStreak = 0;
  } else {
    resultMsg = '¡EMPATE! Se devuelven las monedas';
    icon = '🤝';
    user.coins += Number(duelData.bet || 0);
  }

  await saveUser();
  localStorage.removeItem('activeDuel');
  
  const streak = Number(user.duelCurrentStreak || 0);
  const resultSummary = `${resultMsg}<br><span class="battle-result-stat">Correctas: ${correct}</span><br><span class="battle-result-stat">Fallos: ${wrong}</span><br><span class="battle-result-stat">Precisión: ${precision}%</span><br><span class="battle-result-streak">Racha de victorias: ${streak}</span>`;
  window.showCustomModal('Resultado de Batalla', resultSummary, icon, () => {
    window.location.href = 'menu.html';
  });
}

function generateProblem(diff) {
  let a, b, q, ans;
  if (diff === 'facil') {
    a = Math.floor(Math.random() * 20) + 1; b = Math.floor(Math.random() * 20) + 1;
    if (Math.random() > 0.5) { q = `${a} + ${b}`; ans = a + b; }
    else { if (a < b) [a, b] = [b, a]; q = `${a} - ${b}`; ans = a - b; }
  } else if (diff === 'normal') {
    if (Math.random() > 0.5) { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; q = `${a} × ${b}`; ans = a * b; }
    else { b = Math.floor(Math.random() * 10) + 2; ans = Math.floor(Math.random() * 10) + 1; a = b * ans; q = `${a} ÷ ${b}`; }
  } else if (diff === 'dificil') {
    if (Math.random() > 0.5) { a = Math.floor(Math.random() * 10) + 2; b = Math.floor(Math.random() * 2) + 2; q = `${a}<sup>${b}</sup>`; ans = Math.pow(a, b); }
    else { ans = Math.floor(Math.random() * 15) + 2; a = ans * ans; q = `√${a}`; }
  } else if (diff === 'experto') {
    let r1 = Math.floor(Math.random() * 10) + 1; let r2 = Math.floor(Math.random() * 10) + 1;
    let b_val = -(r1 + r2); let c_val = r1 * r2;
    let b_str = b_val < 0 ? `${b_val}x` : `+${b_val}x`; let c_str = c_val < 0 ? `${c_val}` : `+${c_val}`;
    q = `x² ${b_str} ${c_str} = 0 (Raíz >)`; ans = Math.max(r1, r2);
  }
  return { q, ans };
}

window.goBackToChoice = () => {
  document.getElementById('gameChoice').classList.remove('hidden');
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  
  document.getElementById('quizSetup').style.display = 'block';
  document.getElementById('quizStats').style.display = 'none';
  document.getElementById('quizGame').style.display = 'none';
  document.getElementById('quizDifficulty').value = 'facil';
  currentQuizDifficulty = 'facil';
  quizStreak = 0;
  activePowerDouble = false;
  activePowerFifty = false;
  activePowerLight = false;
  currentPowerHint = 'Usa tus poderes para ayudarte en la siguiente pregunta.';
  
  document.getElementById('infinitySetup').style.display = 'block';
  document.getElementById('infinityStats').style.display = 'none';
  document.getElementById('infinityGame').style.display = 'none';
  infinityStreak = 0;
  infinityCoinsEarned = 0;
  updateQuizPowerPanel();
};

function initGame() {
  document.getElementById('mainBackBtn').onclick = () => {
    if (!document.getElementById('gameChoice').classList.contains('hidden')) {
      window.location.href = 'menu.html';
    } else {
      window.goBackToChoice();
    }
  };

  document.getElementById('calcBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('calculatorSection').classList.remove('hidden');
  };

  const quizBtn = document.getElementById('Btn');
  if (quizBtn) {
    quizBtn.onclick = () => {
      document.getElementById('gameChoice').classList.add('hidden');
      document.getElementById('quizSection').classList.remove('hidden');
    };
  }

  document.getElementById('infinityBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('infinitySection').classList.remove('hidden');
  };

  document.getElementById('startQuizBtn').onclick = () => {
    const diff = document.getElementById('quizDifficulty').value;
    currentQuizDifficulty = diff;
    document.getElementById('quizSetup').style.display = 'none';
    document.getElementById('quizStats').style.display = 'block';
    document.getElementById('quizGame').style.display = 'block';
    document.getElementById('quizDifficultyGame').value = diff;
    quizStreak = 0;
    activePowerDouble = false;
    activePowerFifty = false;
    activePowerLight = false;
    currentPowerHint = 'Usa tus poderes para ayudarte en la siguiente pregunta.';
    updateQuizPowerPanel();
    showQuizQuestion(diff);
  };

  document.getElementById('startInfinityBtn').onclick = () => {
    document.getElementById('infinitySetup').style.display = 'none';
    document.getElementById('infinityStats').style.display = 'block';
    document.getElementById('infinityGame').style.display = 'block';
    infinityStreak = 0;
    infinityCoinsEarned = 0;
    showInfinityQuestion();
  };

  document.getElementById('solveBtn').onclick = () => {
    const eq = document.getElementById('eqInput').value;
    const result = solveEquation(eq);
    document.getElementById('calcResult').innerHTML = formatSolution(result);
  };

  document.getElementById('quizDifficultyGame').addEventListener('change', function() {
    if (document.getElementById('quizGame').style.display !== 'none') {
      currentQuizDifficulty = this.value;
      quizStreak = 0;
      showQuizQuestion(this.value);
      updateQuizStreak();
    }
  });

  document.querySelectorAll('[data-power]').forEach(button => {
    button.onclick = () => window.usePower(button.dataset.power);
  });
}

window.showQuizQuestion = (diff) => {
  currentQuizDifficulty = diff;
  currentProblem = generateProblem(diff);
  document.getElementById('questionText').innerHTML = currentProblem.q;
  document.getElementById('quizAnsInput').value = '';
  document.getElementById('quizFeedback').style.display = 'none';
  document.getElementById('quizAnsInput').focus();
  currentPowerHint = 'Usa tus poderes para ayudarte en la siguiente pregunta.';
  activePowerDouble = false;
  activePowerFifty = false;
  activePowerLight = false;
  updateQuizPowerPanel();
  updateQuizStreak();
};

window.checkQuizAnswer = async () => {
  const ans = parseInt(document.getElementById('quizAnsInput').value);
  if (ans === currentProblem.ans) {
    quizStreak++;
    user.quizQuestionsAnswered = (user.quizQuestionsAnswered || 0) + 1;
    const xpGain = { facil: 10, normal: 25, dificil: 50, experto: 100 };
    const multiplier = activePowerDouble ? 2 : 1;
    user.xp += (xpGain[currentQuizDifficulty] || 10) * multiplier;
    user.coins += 5 * multiplier;

    if (!user.stats) user.stats = {};
    user.stats[currentQuizDifficulty] = (user.stats[currentQuizDifficulty] || 0) + 1;

    const feedbackEl = document.getElementById('quizFeedback');
    if (feedbackEl) {
      const message = activePowerDouble ? '✅ ¡Felicidades! Respuesta correcta + 2x puntos' : '✅ ¡Felicidades! Respuesta correcta';
      feedbackEl.innerHTML = message;
      feedbackEl.style.color = '#4cff90';
      feedbackEl.style.display = 'block';
    }

    activePowerDouble = false;
    currentPowerHint = 'Usa tus poderes para ayudarte en la siguiente pregunta.';
    await saveUser();
    updateXPDisplay();
    document.getElementById('quizAnsInput').value = '';
    updateQuizPowerPanel();
    setTimeout(() => window.showQuizQuestion(currentQuizDifficulty), 800);
  } else {
    quizStreak = 0;

    const feedbackEl = document.getElementById('quizFeedback');
    if (feedbackEl) {
      feedbackEl.innerHTML = '❌ Respuesta incorrecta. ¡Tú puedes!';
      feedbackEl.style.color = '#ff4d6d';
      feedbackEl.style.display = 'block';
    }

    document.getElementById('quizAnsInput').value = '';
    updateQuizStreak();
    setTimeout(() => {
      window.showQuizQuestion(currentQuizDifficulty);
      if (feedbackEl) feedbackEl.style.display = 'none';
    }, 1500);
  }
};

function updateQuizStreak() {
  document.getElementById('currentStreakDisplay').textContent = quizStreak;
}

window.showInfinityQuestion = () => {
  isProcessingInfinityAnswer = false;
  const diffs = ['facil', 'normal', 'dificil', 'experto'];
  const diff = diffs[Math.floor(Math.random() * diffs.length)];
  currentProblem = generateProblem(diff);
  document.getElementById('infinityQuestionText').innerHTML = currentProblem.q;
  document.getElementById('infinityDiffSpan2').textContent = diff;
  document.getElementById('infinityAnsInput').value = '';
  document.getElementById('infinityAnsInput').focus();
  updateInfinityDisplay();
};

window.checkInfinityAnswer = async () => {
  if (isProcessingInfinityAnswer) return;
  isProcessingInfinityAnswer = true;
  
  const ans = parseInt(document.getElementById('infinityAnsInput').value);
  if (ans === currentProblem.ans) {
    infinityStreak++;
    if (infinityStreak > infinityBestStreak) infinityBestStreak = infinityStreak;
    user.infinityProblemsSolved = (user.infinityProblemsSolved || 0) + 1;
    user.infinityStreak = infinityStreak;
    user.infinityBestStreak = Math.max(user.infinityBestStreak || 0, infinityBestStreak);
    const coinsEarned = Math.floor(infinityStreak / 5) + 1;
    infinityCoinsEarned += coinsEarned;
    user.coins += coinsEarned;
    user.infinityCoinsEarned = (user.infinityCoinsEarned || 0) + coinsEarned;
    user.xp += 15;
    if (!user.stats) user.stats = {};
    user.stats.infinito = (user.stats.infinito || 0) + 1;
    await saveUser();
    updateXPDisplay();
    window.showInfinityQuestion();
  } else {
    infinityStreak = 0;
    window.showInfinityQuestion();
    document.getElementById('infinityAnsInput').value = '';
    updateInfinityDisplay();
    isProcessingInfinityAnswer = false;
  }
};

function updateInfinityDisplay() {
  document.getElementById('infinityStreakDisplay').textContent = infinityStreak;
  document.getElementById('infinityBestStreakDisplay').textContent = infinityBestStreak;
  document.getElementById('infinityCoinsDisplay').textContent = infinityCoinsEarned;
}

window.showCustomModal = (title, message, icon, callback) => {
  const modal = document.getElementById('customModal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').innerHTML = message;
  document.getElementById('modalIcon').textContent = icon;
  modal.classList.remove('hidden');
  document.getElementById('modalConfirmBtn').onclick = () => {
    modal.classList.add('hidden');
    if (callback) callback();
  };
};

let isMusicChanging = false;

function initMusic() {
  const bgMusic = document.getElementById('bgMusic');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');
  const tracks = { 'ciudad': 'ciudad.mp3', 'galaxia': 'galaxia.mp3', 'parque': 'parque.mp3', 'fondo1': 'bosque.mp3', 'fondo2': 'neon.mp3' };
  const currentTheme = localStorage.getItem('background') || 'ciudad';
  bgMusic.src = tracks[currentTheme] || 'ciudad.mp3';
  bgMusic.play().catch(() => {});
  updateMusicButtonUI();

  floatingMusicBtn.onclick = async () => {
    if (isMusicChanging) return;
    isMusicChanging = true;
    
    try {
      if (bgMusic.paused) {
        await bgMusic.play();
      } else {
        bgMusic.pause();
      }
      updateMusicButtonUI();
    } catch (e) {
      console.warn('Error al controlar música:', e.message);
    } finally {
      isMusicChanging = false;
    }
  };
}

function updateMusicButtonUI() {
  const bgMusic = document.getElementById('bgMusic');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');
  if (bgMusic.paused) {
    floatingMusicBtn.textContent = '🔇';
    floatingMusicBtn.classList.add('off');
  } else {
    floatingMusicBtn.textContent = '🎵';
    floatingMusicBtn.classList.remove('off');
  }
}

loadUser();
