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

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  if (!user.logros) user.logros = {};
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';

  initGame();
}

var difficulty = 'facil';
var currentStreak = 0;
var currentProblem = null;

function initGame() {
  document.getElementById('calcBtn').onclick = () => {
    document.getElementById('calculatorSection').classList.remove('hidden');
    document.getElementById('quizSection').classList.add('hidden');
  };

  document.getElementById('quizBtn').onclick = () => {
    document.getElementById('quizSection').classList.remove('hidden');
    document.getElementById('calculatorSection').classList.add('hidden');
  };

  document.getElementById('startQuizBtn').onclick = () => {
    difficulty = document.getElementById('quizDifficulty').value;
    currentStreak = 0;
    document.getElementById('quizStats').style.display = 'block';
    showQuestion();
  };

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
  currentProblem = generateProblem(difficulty);
  document.getElementById('questionText').textContent = currentProblem.q;
  document.getElementById('quizAnsInput').value = '';
  document.getElementById('quizAnsInput').focus();
  document.getElementById('currentStreakDisplay').textContent = '🔥 Racha: ' + currentStreak;
}

function generateProblem(diff) {
  let a, b, q, ans;
  if (diff === 'facil') {
    a = Math.floor(Math.random() * 10);
    b = Math.floor(Math.random() * 10);
    q = `${a} + ${b}`;
    ans = a + b;
  } else if (diff === 'normal') {
    a = Math.floor(Math.random() * 20);
    b = Math.floor(Math.random() * 20);
    q = `${a} * ${b}`;
    ans = a * b;
  } else {
    a = Math.floor(Math.random() * 50);
    b = Math.floor(Math.random() * 50);
    q = `${a} * ${b} - ${a}`;
    ans = a * b - a;
  }
  return { q, ans };
}

window.checkQuizAnswer = async () => {
  const userAns = parseInt(document.getElementById('quizAnsInput').value);
  if (userAns === currentProblem.ans) {
    currentStreak++;
    user.xp += 10;
    user.coins += 5;
    user.quizQuestionsAnswered = (user.quizQuestionsAnswered || 0) + 1;
    if (currentStreak > (user.infinityBestStreak || 0)) user.infinityBestStreak = currentStreak;
    
    alert('¡Correcto! +10 XP +5 💰');
    showQuestion();
  } else {
    alert('Incorrecto. La respuesta era ' + currentProblem.ans);
    currentStreak = 0;
    showQuestion();
  }
  saveUser();
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
};

loadUser();
