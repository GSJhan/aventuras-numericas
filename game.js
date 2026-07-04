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
var currentProblem = null;
var quizStreak = 0;
var infinityStreak = 0;
var infinityBestStreak = 0;
var infinityCoinsEarned = 0;
var isProcessingInfinityAnswer = false;
var currentQuizDifficulty = 'facil';

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

async function saveUser() {
  await setDoc(userRef, user);
  await checkAllAchievements(user, userRef);
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

  let timeLeft = 3;
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
    user.duelsWon = (user.duelsWon || 0) + 1;
  } else if (myScore < opScore) {
    resultMsg = `PERDISTE. -${duelData.bet} monedas`;
    icon = '💀';
    user.coins -= duelData.bet;
  } else {
    resultMsg = '¡EMPATE! Se devuelven las monedas';
    icon = '🤝';
    user.coins += duelData.bet;
  }

  await saveUser();
  localStorage.removeItem('activeDuel');
  
  window.showCustomModal('Resultado de Batalla', resultMsg, icon, () => {
    window.location.href = 'menu.html';
  });
}

// --- GENERADOR DE PROBLEMAS ---
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

// --- LÓGICA DEL JUEGO ---
window.goBackToChoice = () => {
  document.getElementById('gameChoice').classList.remove('hidden');
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  
  document.getElementById('quizSetup').style.display = 'block';
  document.getElementById('quizStats').style.display = 'none';
  document.getElementById('quizGame').style.display = 'none';
  document.getElementById('quizDifficulty').value = 'facil';
  currentQuizDifficulty = 'facil';
  quizStreak = 0;
  
  document.getElementById('infinitySetup').style.display = 'block';
  document.getElementById('infinityStats').style.display = 'none';
  document.getElementById('infinityGame').style.display = 'none';
  infinityStreak = 0;
  infinityCoinsEarned = 0;
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
    currentQuizDifficulty = diff;
    document.getElementById('quizSetup').style.display = 'none';
    document.getElementById('quizStats').style.display = 'block';
    document.getElementById('quizGame').style.display = 'block';
    document.getElementById('quizDifficultyGame').value = diff;
    quizStreak = 0;
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
  
  // Cambiar dificultad durante el juego con el selector
  document.getElementById('quizDifficultyGame').addEventListener('change', function() {
    if (document.getElementById('quizGame').style.display !== 'none') {
      currentQuizDifficulty = this.value;
      quizStreak = 0;
      showQuizQuestion(this.value);
      updateQuizStreak();
    }
  });

  // Botón para cambiar dificultad directamente
  if (document.getElementById('changeDifficultyBtn')) {
    document.getElementById('changeDifficultyBtn').addEventListener('click', function() {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: transparent;
        border: 2px solid rgba(76,144,255,0.6);
        border-radius: 20px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        backdrop-filter: blur(20px);
      `;
      
      content.innerHTML = `
        <h3 style="color: #4c90ff; font-family: 'Orbitron', monospace; margin-bottom: 20px; font-size: 20px;">Cambiar Dificultad</h3>
        <select id="tempDifficultySelect" style="width: 100%; padding: 12px; font-size: 16px; border-radius: 8px; border: 2px solid rgba(76,144,255,0.5); background: transparent; color: #e8eaff; margin-bottom: 20px; backdrop-filter: blur(10px);">
          <option value="facil">Fácil (+10 XP)</option>
          <option value="normal">Normal (+25 XP)</option>
          <option value="dificil">Difícil (+50 XP)</option>
          <option value="experto">Extremo (+100 XP)</option>
        </select>
        <div style="display: flex; gap: 10px;">
          <button id="confirmDiffBtn" style="flex:1; padding: 12px; background: linear-gradient(135deg, #4c90ff, #9b59ff); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Confirmar</button>
          <button id="cancelDiffBtn" style="flex:1; padding: 12px; background: transparent; border: 2px solid rgba(255,77,109,0.5); color: #ff4d6d; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,77,109,0.15)'" onmouseout="this.style.background='transparent'">Cancelar</button>
        </div>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      const tempSelect = document.getElementById('tempDifficultySelect');
      tempSelect.value = currentQuizDifficulty;
      
      document.getElementById('confirmDiffBtn').onclick = function() {
        const newDiff = tempSelect.value;
        currentQuizDifficulty = newDiff;
        document.getElementById('quizDifficultyGame').value = newDiff;
        quizStreak = 0;
        showQuizQuestion(newDiff);
        updateQuizStreak();
        modal.remove();
      };
      
      document.getElementById('cancelDiffBtn').onclick = function() {
        modal.remove();
      };
    });
  }
}
  // Botón para cambiar dificultad en Quiz
  if (document.getElementById('changeDifficultyQuizBtn')) {
    document.getElementById('changeDifficultyQuizBtn').addEventListener('click', function() {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: transparent;
        border: 2px solid rgba(76,144,255,0.6);
        border-radius: 20px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        backdrop-filter: blur(20px);
      `;
      
      content.innerHTML = `
        <h3 style="color: #4c90ff; font-family: 'Orbitron', monospace; margin-bottom: 20px; font-size: 20px;">Cambiar Dificultad</h3>
        <select id="tempQuizDifficultySelect" style="width: 100%; padding: 12px; font-size: 16px; border-radius: 8px; border: 2px solid rgba(76,144,255,0.5); background: transparent; color: #e8eaff; margin-bottom: 20px;">
          <option value="facil">Fácil (+10 XP)</option>
          <option value="normal">Normal (+25 XP)</option>
          <option value="dificil">Difícil (+50 XP)</option>
          <option value="experto">Extremo (+100 XP)</option>
        </select>
        <div style="display: flex; gap: 10px;">
          <button id="confirmQuizDiffBtn" style="flex:1; padding: 12px; background: linear-gradient(135deg, #4c90ff, #9b59ff); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Confirmar</button>
          <button id="cancelQuizDiffBtn" style="flex:1; padding: 12px; background: transparent; border: 2px solid rgba(255,77,109,0.5); color: #ff4d6d; border-radius: 8px; cursor: pointer; font-weight: bold;">Cancelar</button>
        </div>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      const tempSelect = document.getElementById('tempQuizDifficultySelect');
      tempSelect.value = currentQuizDifficulty;
      
      document.getElementById('confirmQuizDiffBtn').onclick = function() {
        const newDiff = tempSelect.value;
        currentQuizDifficulty = newDiff;
        document.getElementById('quizDifficulty').value = newDiff;
        quizStreak = 0;
        showQuizQuestion(newDiff);
        updateQuizStreak();
        modal.remove();
      };
      
      document.getElementById('cancelQuizDiffBtn').onclick = function() {
        modal.remove();
      };
    });
  }
// --- QUIZ CON DIFICULTAD SELECCIONABLE ---
window.showQuizQuestion = (diff) => {
  currentQuizDifficulty = diff;
  currentProblem = generateProblem(diff);
  document.getElementById('questionText').innerHTML = currentProblem.q;
  document.getElementById('quizAnsInput').value = '';
  document.getElementById('quizAnsInput').focus();
  updateQuizStreak();
};

window.checkQuizAnswer = async () => {
  const ans = parseInt(document.getElementById('quizAnsInput').value);
  if (ans === currentProblem.ans) {
    quizStreak++;
    user.quizQuestionsAnswered = (user.quizQuestionsAnswered || 0) + 1;
    
    const xpGain = { facil: 10, normal: 25, dificil: 50, experto: 100 };
    user.xp += xpGain[currentQuizDifficulty] || 10;
    
    user.coins += 5;
    
    if (!user.stats) user.stats = {};
    user.stats[currentQuizDifficulty] = (user.stats[currentQuizDifficulty] || 0) + 1;
    
    const feedbackEl = document.getElementById('quizFeedback');
    if (feedbackEl) {
      feedbackEl.innerHTML = '✅ ¡Felicidades! Respuesta correcta';
      feedbackEl.style.color = '#4cff90';
      feedbackEl.style.display = 'block';
    }
    
await saveUser();
updateXPDisplay();
document.getElementById('quizAnsInput').value = ''; // ← Agregar esta línea
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
    
    // Cambiar el problema después de 1.5 segundos cuando falla
    setTimeout(() => {
      window.showQuizQuestion(currentQuizDifficulty);
      if (feedbackEl) feedbackEl.style.display = 'none';
    }, 1500);
  }
};

function updateQuizStreak() {
  document.getElementById('currentStreakDisplay').textContent = `🔥 Racha: ${quizStreak}`;
}

// --- INFINITO CON PROTECCIÓN CONTRA DOBLE CLICK ---
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
    
    // Cambiar el problema inmediatamente cuando falla en infinito
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

// --- MODAL ---
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

// --- MÚSICA SINCRONIZADA CON ICONO ---
let isMusicChanging = false;

function initMusic() {
  const bgMusic = document.getElementById('bgMusic');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');
  const tracks = { 'ciudad': 'ciudad.mp3', 'galaxia': 'galaxia.mp3', 'parque': 'parque.mp3', 'fondo1': 'bosque.mp3', 'fondo2': 'neon.mp3' };
  
  const currentTheme = localStorage.getItem('background') || 'ciudad';
  bgMusic.src = tracks[currentTheme] || 'ciudad.mp3';
  
  bgMusic.play().catch(() => {
    // Si falla autoplay, esperar a que el usuario interactúe
  });
  
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
