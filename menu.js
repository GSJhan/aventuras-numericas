import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAllAchievements, getAchievementStats } from './achievements.js';
import { checkAllAchievements } from './global-achievements.js';

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
if (!currentUser) window.location.href = 'index.html';

var user = null;
var userRef = null;

async function saveUser() {
  await setDoc(userRef, user);
  // Verificar logros automáticamente después de guardar
  await checkAllAchievements(user, userRef);
}

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  user = snap.data();
  
  if (!user.logros) user.logros = {};
  if (!user.powers) user.powers = { double: 0, fifty: 0, light: 0 };
  if (!user.coins) user.coins = 0;
  if (!user.xp) user.xp = 0;
  if (!user.infinityStreak) user.infinityStreak = 0;
  if (!user.infinityBestStreak) user.infinityBestStreak = 0;
  
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  initMenu();
}

function initMenu() {
  document.getElementById('jugarBtn').onclick = showJugar;
  document.getElementById('logroBtn').onclick = showLogros;
  document.getElementById('habilidadesBtn').onclick = () => {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('skillsSection').classList.remove('hidden');
    import('./skills.js').then(m => m.showSkills());
  };
  document.getElementById('backBtn').onclick = () => {
    document.getElementById('gameSection').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
  };
  document.getElementById('backBtn2').onclick = () => {
    document.getElementById('skillsSection').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
  };
  document.getElementById('backBtn3').onclick = () => {
    document.getElementById('logrosList').innerHTML = '';
    document.getElementById('logrosSection').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
  };
  nextProblem();
}

function showJugar() {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');
}

function showPowers() {
  let html = `
    <div class="powers-section">
      <h3>Poderes Disponibles</h3>
      <button class="power-btn" onclick="buyPower('double', 50)">💰 Doble XP - 50 monedas (${user.powers.double || 0})</button>
      <button class="power-btn" onclick="buyPower('fifty', 40)">🌓 50/50 - 40 monedas (${user.powers.fifty || 0})</button>
      <button class="power-btn" onclick="buyPower('light', 60)">⚡ Luz - 60 monedas (${user.powers.light || 0})</button>
    </div>
  `;
  document.getElementById('powersList').innerHTML = html;
}

window.buyPower = async (type, cost) => {
  if (user.coins >= cost) {
    user.coins -= cost;
    user.powers[type]++;
    await saveUser();
    document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
    showPowers();
    alert('✅ Poder comprado');
  } else alert('❌ Monedas insuficientes');
};

async function showLogros() {
  const allAchievements = getAllAchievements();
  
  if (!user.logros) user.logros = {};
  let changed = false;
  allAchievements.forEach(a => {
    if (!(a.id in user.logros)) {
      user.logros[a.id] = false;
      changed = true;
    }
  });
  
  if (changed) await saveUser();
  
  const stats = getAchievementStats(user.logros);
  
  let html = `
    <div class="logros-stats">
      <div class="logros-stat-item">
        <div class="logros-stat-value">${stats.unlocked}</div>
        <div class="logros-stat-label">Desbloqueados</div>
      </div>
      <div class="logros-stat-item">
        <div class="logros-stat-value">${stats.total}</div>
        <div class="logros-stat-label">Total</div>
      </div>
      <div class="logros-stat-item">
        <div class="logros-stat-value">${stats.percentage}%</div>
        <div class="logros-stat-label">Progreso</div>
      </div>
    </div>
    <div class="logros-progress-bar">
      <div class="logros-progress-fill" style="width: ${stats.percentage}%"></div>
    </div>
  `;
  
  const categories = {};
  allAchievements.forEach(a => {
    if (!categories[a.category]) categories[a.category] = [];
    categories[a.category].push(a);
  });
  
  for (const category in categories) {
    html += `<div class="logros-category-title">${category}</div>`;
    html += '<div class="logros-container">';
    categories[category].forEach(a => {
      const achieved = user.logros[a.id];
      html += `
        <div class="logro-card ${achieved ? 'achieved' : 'locked'} animated fadeIn" title="${a.desc}">
          <span class="logro-icon">${a.icon}</span>
          <div class="logro-title">${a.title}</div>
          <div class="logro-desc">${a.desc}</div>
          <div class="logro-status">${achieved ? '✅ Desbloqueado' : '🔒 Bloqueado'}</div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  document.getElementById('logrosList').innerHTML = html;
}

var currentInfinityProblem = null;
var infinityStreak = 0;
var infinityDifficulty = 'facil';

function generateProblem(difficulty) {
  let a, b, result, question;
  
  switch(difficulty) {
    case 'facil':
      // Suma y Resta
      const op1 = Math.random() > 0.5 ? '+' : '-';
      a = window.rnd(1, 20);
      b = window.rnd(1, 20);
      if (op1 === '+') {
        question = `${a} + ${b}`;
        result = a + b;
      } else {
        question = `${a + b} - ${b}`;
        result = a;
      }
      break;
      
    case 'normal':
      // Multiplicación y División
      const op2 = Math.random() > 0.5 ? 'x' : 'd';
      a = window.rnd(5, 20);
      b = window.rnd(5, 20);
      if (op2 === 'x') {
        question = `${a} × ${b}`;
        result = a * b;
      } else {
        question = `${a * b} ÷ ${b}`;
        result = a;
      }
      break;
      
    case 'dificil':
      // Potencia y Raíz
      const op3 = Math.random() > 0.5 ? 'p' : 'r';
      if (op3 === 'p') {
        a = window.rnd(2, 10);
        b = window.rnd(2, 4);
        question = `${a}^${b}`;
        result = Math.pow(a, b);
      } else {
        a = window.rnd(2, 10);
        question = `√${a * a}`;
        result = a;
      }
      break;
      
    case 'extremo':
      // Ecuaciones Cuadráticas
      const p = window.rnd(1, 10);
      const q = window.rnd(1, 10);
      const b_coef = -(p + q);
      const c_coef = p * q;
      question = `x² + ${b_coef}x + ${c_coef} = 0 (suma de raíces)`;
      result = p + q;
      break;
  }
  
  return { q: question, a: result };
}

function nextProblem() {
  // Seleccionar dificultad ALEATORIA
  const difficulties = ['facil', 'normal', 'dificil', 'extremo'];
  infinityDifficulty = difficulties[window.rnd(0, 3)];
  
  currentInfinityProblem = generateProblem(infinityDifficulty);
  
  const difficultyEmoji = {
    'facil': '😊',
    'normal': '😐',
    'dificil': '😤',
    'extremo': '🔥'
  };
  
  const difficultyLabel = {
    'facil': 'FÁCIL',
    'normal': 'NORMAL',
    'dificil': 'DIFÍCIL',
    'extremo': 'EXPERTO'
  };
  
  document.getElementById('infinityProblemBox').innerHTML = `
    <div class="problem-box animated zoomIn" style="background: rgba(8,12,26,0.8); border: 2px solid #4c90ff; border-radius: 20px; padding: 40px; box-shadow: 0 0 30px rgba(76,144,255,0.2);">
      <div class="prob-level" style="color: #4c90ff; font-family: 'Orbitron'; font-size: 14px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">${difficultyEmoji[infinityDifficulty]} ${difficultyLabel[infinityDifficulty]}</div>
      <div class="prob-question" style="font-family: 'Orbitron'; font-size: 48px; color: #fff; text-shadow: 0 0 15px rgba(76,144,255,0.5);">${currentInfinityProblem.q} = ?</div>
    </div>`;
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const streakBox = document.getElementById('infinityStreakBox');
  const streakCount = document.getElementById('infinityStreakCount');
  if (infinityStreak > 0) {
    streakBox.style.display = 'block';
    streakCount.textContent = '🔥 ' + infinityStreak;
  } else {
    streakBox.style.display = 'none';
  }
}

async function checkInfinity() {
  const val = parseInt(document.getElementById('infinityEquation').value);
  if (val === currentInfinityProblem.a) {
    infinityStreak++;
    user.xp += 5; 
    user.coins += 2;
    user.infinityStreak = infinityStreak;
    user.infinityBestStreak = Math.max(user.infinityBestStreak || 0, infinityStreak);
    
    // Contar problemas resueltos en infinito
    if (!user.infinityProblemsSolved) user.infinityProblemsSolved = 0;
    user.infinityProblemsSolved++;
    if (!user.infinityCoinsEarned) user.infinityCoinsEarned = 0;
    user.infinityCoinsEarned += 2;
    if (!user.infinityXpEarned) user.infinityXpEarned = 0;
    user.infinityXpEarned += 5;
    
    // Verificar y desbloquear logros de racha automáticamente
    const newAchievement = checkStreakAchievements();
    
    document.getElementById('infinityResult').innerHTML = '<span class="correct animated bounceIn">✅ +5 XP +2 💰 🔥 Racha: ' + infinityStreak + '</span>';
    
    // Guardar cambios en Firebase
    await saveUser(); 
    
    document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
    document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
    document.getElementById('infinityEquation').value = ''; 
    nextProblem();
  } else {
    infinityStreak = 0;
    user.infinityStreak = 0;
    document.getElementById('infinityResult').innerHTML = '<span class="wrong animated shake">❌ Racha perdida</span>';
    await saveUser();
    updateStreakDisplay();
  }
}

function checkStreakAchievements() {
  if (!user.logros) user.logros = {};
  let unlockedAny = false;
  
  const streakAchievements = [
    { id: 'streak_3', value: 3 },
    { id: 'streak_5', value: 5 },
    { id: 'streak_10', value: 10 },
    { id: 'streak_25', value: 25 },
    { id: 'streak_50', value: 50 },
    { id: 'streak_100', value: 100 },
    { id: 'streak_250', value: 250 },
    { id: 'streak_500', value: 500 }
  ];
  
  streakAchievements.forEach(achievement => {
    if (infinityStreak >= achievement.value && user.logros[achievement.id] === false) {
      user.logros[achievement.id] = true;
      showAchievementNotification(achievement.id);
      unlockedAny = true;
    }
  });
  
  return unlockedAny;
}

function showAchievementNotification(achievementId) {
  const achievementNames = {
    'streak_3': '🔥 Racha x3',
    'streak_5': '🔥🔥 Racha x5',
    'streak_10': '🔥🔥🔥 Racha x10',
    'streak_25': '🌪️ Racha x25',
    'streak_50': '⚡ Racha x50',
    'streak_100': '💥 Racha x100',
    'streak_250': '🌟 Racha x250',
    'streak_500': '👑 Racha x500'
  };
  
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ffd700, #ff9500);
    color: #000;
    padding: 20px 30px;
    border-radius: 12px;
    font-weight: bold;
    font-family: 'Orbitron', sans-serif;
    box-shadow: 0 10px 30px rgba(255,215,0,0.5);
    z-index: 9999;
    animation: slideIn 0.5s ease;
  `;
  notification.innerHTML = `🏆 ¡LOGRO DESBLOQUEADO!<br>${achievementNames[achievementId] || achievementId}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

loadUser();
