import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

async function saveUser() {
  await setDoc(userRef, user);
  await checkAllAchievements(user, userRef);
}

function calculateLevel(xp) {
  return Math.floor(xp / 500) + 1;
}

function updateXPDisplay() {
  const level = calculateLevel(user.xp);
  const xpCurrentLevel = user.xp % 500;
  const xpRemaining = 500 - xpCurrentLevel;
  
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = `⭐ ${user.xp} XP (Nivel ${level}, faltan ${xpRemaining})`;
}

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  if (!user.logros) user.logros = {};
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  
  updateXPDisplay();

  initGame();
  initMusic();
}

function initMusic() {
  const bgMusic = document.getElementById('bgMusic');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');
  
  const tracks = {
    'ciudad': 'ciudad.mp3',
    'galaxia': 'galaxia.mp3',
    'parque': 'parque.mp3',
    'fondo1': 'bosque.mp3',
    'fondo2': 'neon.mp3'
  };

  const currentBg = localStorage.getItem('background') || 'ciudad';
  bgMusic.src = tracks[currentBg] || 'ciudad.mp3';

  floatingMusicBtn.onclick = () => {
    if (bgMusic.paused) {
      bgMusic.play().catch(e => console.log("Error al reproducir:", e));
      floatingMusicBtn.classList.remove('off');
      floatingMusicBtn.textContent = '🎵';
    } else {
      bgMusic.pause();
      floatingMusicBtn.classList.add('off');
      floatingMusicBtn.textContent = '🔇';
    }
  };
}

var difficulty = 'facil';
var currentStreak = 0;
var currentProblem = null;

function initGame() {
  // Botón Calculadora
  document.getElementById('calcBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('calculatorSection').classList.remove('hidden');
    document.getElementById('quizSection').classList.add('hidden');
  };

  // Botón Quiz
  document.getElementById('quizBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('quizSection').classList.remove('hidden');
    document.getElementById('calculatorSection').classList.add('hidden');
  };

  // Botón Comenzar Quiz
  document.getElementById('startQuizBtn').onclick = () => {
    difficulty = document.getElementById('quizDifficulty').value;
    currentStreak = 0;
    document.getElementById('quizSetup').style.display = 'none';
    document.getElementById('quizStats').style.display = 'block';
    document.getElementById('quizGame').style.display = 'block';
    showQuestion();
  };

  // Botón Resolver Ecuación
  document.getElementById('solveBtn').onclick = () => {
    const eq = document.getElementById('eqInput').value;
    const result = solveEquation(eq);
    document.getElementById('calcResult').innerHTML = formatSolution(result);
    
    if (!result.error) {
        user.calcTotalSolved = (user.calcTotalSolved || 0) + 1;
        if (result.type === 'linear') user.calcLinearSolved = (user.calcLinearSolved || 0) + 1;
        if (result.type === 'quadratic') user.calcQuadraticSolved = (user.calcQuadraticSolved || 0) + 1;
        saveUser();
    }
  };
}

function showQuestion() {
  let diffToUse = difficulty;
  if (difficulty === 'infinito') {
    const diffs = ['facil', 'normal', 'dificil', 'experto'];
    diffToUse = diffs[Math.floor(Math.random() * diffs.length)];
  }
  currentProblem = generateProblem(diffToUse);
  currentProblem.actualDiff = diffToUse; // Guardar la dificultad real usada
  document.getElementById('questionText').innerHTML = currentProblem.q;
  document.getElementById('quizAnsInput').value = '';
  document.getElementById('quizAnsInput').focus();
  document.getElementById('currentStreakDisplay').textContent = '🔥 Racha: ' + currentStreak;
}

function generateProblem(diff) {
  let a, b, c, q, ans;
  
  if (diff === 'facil') {
    // Fácil: Suma y Resta
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    if (Math.random() > 0.5) {
      q = `${a} + ${b}`;
      ans = a + b;
    } else {
      if (a < b) [a, b] = [b, a];
      q = `${a} - ${b}`;
      ans = a - b;
    }
  } else if (diff === 'normal') {
    // Normal: Multiplicación y División
    if (Math.random() > 0.5) {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      q = `${a} × ${b}`;
      ans = a * b;
    } else {
      b = Math.floor(Math.random() * 10) + 2;
      ans = Math.floor(Math.random() * 10) + 1;
      a = b * ans;
      q = `${a} ÷ ${b}`;
    }
  } else if (diff === 'dificil') {
    // Difícil: Potencia y Raíz
    if (Math.random() > 0.5) {
      a = Math.floor(Math.random() * 10) + 2;
      b = Math.floor(Math.random() * 2) + 2; // cuadrado o cubo
      q = `${a}<sup>${b}</sup>`;
      ans = Math.pow(a, b);
    } else {
      ans = Math.floor(Math.random() * 15) + 2;
      a = ans * ans;
      q = `√${a}`;
    }
  } else if (diff === 'experto') {
    // Experto: Ecuaciones Cuadráticas (x² + bx + c = 0)
    // Generamos raíces enteras para que sea resoluble mentalmente (x-r1)(x-r2) = x² - (r1+r2)x + r1*r2
    let r1 = Math.floor(Math.random() * 10) + 1;
    let r2 = Math.floor(Math.random() * 10) + 1;
    let b_val = -(r1 + r2);
    let c_val = r1 * r2;
    
    // Formato: x² + bx + c = 0. Pedimos la raíz mayor.
    let b_str = b_val < 0 ? `${b_val}x` : `+${b_val}x`;
    let c_str = c_val < 0 ? `${c_val}` : `+${c_val}`;
    q = `x² ${b_str} ${c_str} = 0 (Raíz >)`;
    ans = Math.max(r1, r2);
  }
  
  return { q, ans };
}

function getXPReward(diff) {
  switch(diff) {
    case 'facil': return 10;
    case 'normal': return 25;
    case 'dificil': return 50;
    case 'experto': return 100;
    default: return 10;
  }
}

function getCoinReward(diff) {
  switch(diff) {
    case 'facil': return 3;
    case 'normal': return 8;
    case 'dificil': return 15;
    case 'experto': return 30;
    default: return 3;
  }
}

window.checkQuizAnswer = async () => {
  const userAns = parseInt(document.getElementById('quizAnsInput').value);
  const diffUsed = currentProblem.actualDiff || difficulty;
  const xpReward = getXPReward(diffUsed);
  const coinReward = getCoinReward(diffUsed);
  
  if (userAns === currentProblem.ans) {
    currentStreak++;
    user.xp += xpReward;
    user.coins += coinReward;
    user.quizQuestionsAnswered = (user.quizQuestionsAnswered || 0) + 1;
    
    // Registrar completación por dificultad
    if (diffUsed === 'facil') user.quizEasyCompleted = (user.quizEasyCompleted || 0) + 1;
    else if (diffUsed === 'normal') user.quizNormalCompleted = (user.quizNormalCompleted || 0) + 1;
    else if (diffUsed === 'dificil') user.quizHardCompleted = (user.quizHardCompleted || 0) + 1;
    else if (diffUsed === 'experto') user.quizExpertCompleted = (user.quizExpertCompleted || 0) + 1;
    
    if (difficulty === 'infinito') {
      if (currentStreak > (user.infinityBestStreak || 0)) {
        user.infinityBestStreak = currentStreak;
      }
    }
    
    alert(`¡Correcto! +${xpReward} XP +${coinReward} 💰`);
    showQuestion();
  } else {
    alert('Incorrecto. La respuesta era ' + currentProblem.ans);
    currentStreak = 0;
    showQuestion();
  }
  
  saveUser();
  updateXPDisplay();
};

loadUser();
