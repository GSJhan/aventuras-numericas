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
}

function updateXPDisplay() {
  const level = Math.floor(user.xp / 500) + 1;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = `⭐ ${user.xp} XP (Nivel ${level})`;
}

// --- LÓGICA DE BATALLA ---
async function initBattle() {
  document.getElementById('gameChoice').classList.add('hidden');
  document.getElementById('battleSection').classList.remove('hidden');
  
  const duelRef = doc(db, 'duels', activeDuelId);
  onSnapshot(duelRef, (snap) => {
    if (!snap.exists()) return;
    duelData = snap.data();
    updateBattleUI();
    if (duelData.status === 'finished') {
        finishBattle();
    }
  });

  // Empezar cuenta regresiva
  let timeLeft = 3; // 3 seg de preparación
  const prepInterval = setInterval(() => {
    document.getElementById('battleQuestionText').textContent = '¡PREPÁRATE! ' + timeLeft;
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(prepInterval);
      startBattleTimer();
      showBattleQuestion();
    }
  }, 1000);
}

function updateBattleUI() {
  const isP1 = duelData.challenger === currentUser;
  document.getElementById('p1Name').textContent = duelData.challenger;
  document.getElementById('p2Name').textContent = duelData.opponent;
  document.getElementById('p1Score').textContent = duelData.p1Score;
  document.getElementById('p2Score').textContent = duelData.p2Score;
}

function startBattleTimer() {
  let timeLeft = duelData.duration;
  const totalTime = duelData.duration;
  
  battleTimer = setInterval(() => {
    timeLeft--;
    document.getElementById('battleTimerText').textContent = timeLeft + 's';
    const percent = (timeLeft / totalTime) * 100;
    document.getElementById('battleTimerFill').style.width = percent + '%';

    if (timeLeft <= 0) {
      clearInterval(battleTimer);
      endBattle();
    }
  }, 1000);
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
  const ans = parseInt(document.getElementById('battleAnsInput').value);
  if (ans === currentProblem.ans) {
    const isP1 = duelData.challenger === currentUser;
    const update = isP1 ? { p1Score: duelData.p1Score + 1 } : { p2Score: duelData.p2Score + 1 };
    await setDoc(doc(db, 'duels', activeDuelId), update, { merge: true });
    showBattleQuestion();
  } else {
    document.getElementById('battleAnsInput').value = '';
    // Penalización visual o simplemente borrar
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
  
  let resultMsg = '';
  let icon = '';

  if (myScore > opScore) {
    resultMsg = `¡GANASTE! +${duelData.bet} monedas`;
    icon = '🏆';
    user.coins += duelData.bet;
  } else if (myScore < opScore) {
    resultMsg = `PERDISTE. -${duelData.bet} monedas`;
    icon = '💀';
    user.coins -= duelData.bet;
  } else {
    resultMsg = '¡EMPATE! Se devuelven las monedas';
    icon = '🤝';
  }

  await setDoc(userRef, user);
  localStorage.removeItem('activeDuel');
  
  window.showCustomModal('Resultado de Batalla', resultMsg, icon, () => {
    window.location.href = 'menu.html';
  });
}

// --- RESTO DE LÓGICA (QUIZ, INFINITO, ETC) ---
// ... (Mantener lógica previa de generateProblem, solveEquation, etc.)
// Reutilizo generateProblem de la versión anterior
var currentProblem = null;
function generateProblem(diff) {
  let a, b, c, q, ans;
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

// Copio funciones necesarias para que el archivo sea funcional
window.goBackToChoice = () => {
  document.getElementById('gameChoice').classList.remove('hidden');
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
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
  document.getElementById('quizBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('quizSection').classList.remove('hidden');
  };
  document.getElementById('infinityBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('infinitySection').classList.remove('hidden');
  };
  document.getElementById('startQuizBtn').onclick = () => {
    const diff = document.getElementById('quizDifficulty').value;
    document.getElementById('quizSetup').style.display = 'none';
    document.getElementById('quizStats').style.display = 'block';
    document.getElementById('quizGame').style.display = 'block';
    currentProblem = generateProblem(diff);
    document.getElementById('questionText').innerHTML = currentProblem.q;
  };
  document.getElementById('startInfinityBtn').onclick = () => {
    document.getElementById('infinitySetup').style.display = 'none';
    document.getElementById('infinityStats').style.display = 'block';
    document.getElementById('infinityGame').style.display = 'block';
    showInfinityQuestion();
  };
  document.getElementById('solveBtn').onclick = () => {
    const eq = document.getElementById('eqInput').value;
    const result = solveEquation(eq);
    document.getElementById('calcResult').innerHTML = formatSolution(result);
  };
}

function showInfinityQuestion() {
  const diffs = ['facil', 'normal', 'dificil', 'experto'];
  const diff = diffs[Math.floor(Math.random() * diffs.length)];
  currentProblem = generateProblem(diff);
  document.getElementById('infinityQuestionText').innerHTML = currentProblem.q;
  document.getElementById('infinityDiffSpan2').textContent = diff;
}

window.showCustomModal = (title, message, icon, callback) => {
  const modal = document.getElementById('customModal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  document.getElementById('modalIcon').textContent = icon;
  modal.classList.remove('hidden');
  document.getElementById('modalConfirmBtn').onclick = () => {
    modal.classList.add('hidden');
    if (callback) callback();
  };
};

function initMusic() {
  const bgMusic = document.getElementById('bgMusic');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');
  const tracks = { 'ciudad': 'ciudad.mp3', 'galaxia': 'galaxia.mp3', 'parque': 'parque.mp3', 'fondo1': 'bosque.mp3', 'fondo2': 'neon.mp3' };
  bgMusic.src = tracks[localStorage.getItem('background') || 'ciudad'] || 'ciudad.mp3';
  floatingMusicBtn.onclick = () => {
    if (bgMusic.paused) { bgMusic.play(); floatingMusicBtn.textContent = '🎵'; }
    else { bgMusic.pause(); floatingMusicBtn.textContent = '🔇'; }
  };
}

loadUser();
