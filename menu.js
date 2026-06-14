import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { renderSkillsTree } from './skills.js';
import { renderDuelsInterface } from './duels.js';
import { ACHIEVEMENTS, getAllAchievements, getAchievementStats } from './achievements.js';

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
var rankingUnsub = null;
var bgAudio = null;

// Función global rnd para evitar errores
window.rnd = function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

function getLevelData(xp) {
  let lvl = 1, needed = 100, total = xp || 0;
  while (total >= needed && lvl < 10000000) {
    total -= needed;
    lvl++;
    needed += 100;
  }
  return { lvl, currentXP: total, nextLevelXP: needed };
}

async function saveUser() {
  if (userRef && user) await setDoc(userRef, user);
}

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  
  if (!user.skins) user.skins = ['spiderman'];
  if (!user.skin) user.skin = 'spiderman';
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.powers) user.powers = { double: 0, fifty: 0, light: 0 };
  if (!user.logros) user.logros = {};
  if (!user.infinityStreak) user.infinityStreak = 0;
  if (!user.infinityBestStreak) user.infinityBestStreak = 0;
  
  infinityStreak = user.infinityStreak || 0;

  updateUI();
  applyTheme(localStorage.getItem('background') || 'ciudad');
  initMenu();
}

function updateUI() {
  const data = getLevelData(user.xp);
  document.getElementById('displayUsername').textContent = currentUser;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  
  const progress = (data.currentXP / data.nextLevelXP) * 100;
  const levelBadge = document.getElementById('levelInfo') || document.createElement('span');
  if (!document.getElementById('levelInfo')) {
    levelBadge.id = 'levelInfo';
    levelBadge.className = 'xp-badge';
    levelBadge.style.color = '#4cff90';
    document.querySelector('.user-info').appendChild(levelBadge);
  }
  levelBadge.innerHTML = `📈 Nv.${data.lvl} (${Math.floor(progress)}%) - Falta: ${data.nextLevelXP - data.currentXP} XP`;

  const avatarImg = getAvatarSrc(user.skin);
  document.getElementById('avatarDisplay').innerHTML = `<img src="${avatarImg}" class="avatar-img-main"/>`;
}

function getAvatarSrc(skin) {
  const avatars = {
    'spiderman': 'spiderman.png', 'batman': 'batman.jpg', 'goku': 'goku.png',
    'ironman': 'ironman.png', 'sasuke': 'sasuke.png', 'kakashi': 'kakashi.jpg',
    'vegeta': 'vegeta.png', 'itachi': 'itachi.png', 'zoro': 'zoro.png', 'luffy': 'luffy.png'
  };
  return avatars[skin] || 'spiderman.png';
}

function applyTheme(theme) {
  document.body.className = theme;
  localStorage.setItem('background', theme);
  if (bgAudio) { bgAudio.pause(); bgAudio = null; }
  if (localStorage.getItem('music') !== 'off') {
    bgAudio = new Audio(theme + '.mp3');
    bgAudio.loop = true;
    bgAudio.play().catch(() => console.log("Música silenciada"));
  }
}

function initMenu() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = function() {
      const page = this.dataset.page;
      document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
      
      if (page === 'game') window.location.href = 'game.html';
      else if (page === 'infinito') { document.getElementById('infinitoSection').classList.remove('hidden'); nextProblem(); }
      else if (page === 'avatar') { document.getElementById('avatarSection').classList.remove('hidden'); showAvatarEditor(); }
      else if (page === 'skills') { document.getElementById('skillsSection').classList.remove('hidden'); renderSkillsTree(user, userRef, saveUser); }
      else if (page === 'duels') { document.getElementById('duelsSection').classList.remove('hidden'); renderDuelsInterface(db, user, currentUser, userRef, saveUser); }
      else if (page === 'shop') { document.getElementById('shopSection').classList.remove('hidden'); renderShop(); }
      else if (page === 'logros') { document.getElementById('logrosSection').classList.remove('hidden'); showLogros(); }
      else if (page === 'ranking') { document.getElementById('rankingSection').classList.remove('hidden'); showRanking(); }
      else if (page === 'config') document.getElementById('configSection').classList.remove('hidden');
    };
  });

  document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };
  document.getElementById('backgroundSelect').onchange = (e) => applyTheme(e.target.value);
  document.getElementById('musicToggle').onchange = (e) => {
    localStorage.setItem('music', e.target.checked ? 'on' : 'off');
    if (!e.target.checked && bgAudio) bgAudio.pause();
    else if (e.target.checked) applyTheme(localStorage.getItem('background') || 'ciudad');
  };

  document.getElementById('infinitySolveBtn').onclick = checkInfinity;
}

// --- TIENDA ---
function renderShop() {
  const shopGrid = document.getElementById('shopGrid');
  const powers = [
    { id: 'double', name: 'Doble o Nada', price: 150, icon: '💰', desc: 'Doble XP y Monedas' },
    { id: 'fifty', name: '50/50', price: 100, icon: '🌓', desc: 'Quita 2 opciones' },
    { id: 'light', name: 'Al Sonido de la Luz', price: 100, icon: '⚡', desc: 'x1.5 XP durante 10s' }
  ];

  let html = '<div class="clash-grid">';
  powers.forEach(p => {
    html += `<div class="clash-item">
      <div class="clash-avatar">${p.icon}</div>
      <div class="clash-info"><div class="clash-name">${p.name}</div><div class="clash-xp">${p.desc}</div><div class="price">💰 ${p.price}</div></div>
      <button class="clash-challenge-btn" onclick="window.buyPower('${p.id}', ${p.price})">COMPRAR (${user.powers[p.id] || 0})</button>
    </div>`;
  });
  html += '</div>';
  shopGrid.innerHTML = html;

  window.buyPower = async (id, price) => {
    if (user.coins >= price) {
      user.coins -= price;
      user.powers[id] = (user.powers[id] || 0) + 1;
      await saveUser(); updateUI(); renderShop();
    } else alert('❌ Monedas insuficientes');
  };
}

function showAvatarEditor() {
  const editor = document.getElementById('avatarEditor');
  const skins = [
    { id: 'spiderman', name: 'Spider-Man', price: 0 }, { id: 'batman', name: 'Batman', price: 500 },
    { id: 'goku', name: 'Goku', price: 1200 }, { id: 'ironman', name: 'Iron Man', price: 800 },
    { id: 'sasuke', name: 'Sasuke', price: 700 }, { id: 'kakashi', name: 'Kakashi', price: 650 },
    { id: 'vegeta', name: 'Vegeta', price: 1100 }, { id: 'itachi', name: 'Itachi', price: 1500 },
    { id: 'zoro', name: 'Zoro', price: 600 }, { id: 'luffy', name: 'Luffy', price: 900 }
  ];

  let html = '<div class="skins-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;">';
  skins.forEach(s => {
    const owned = user.skins.includes(s.id);
    html += `<div class="skin-item ${owned ? 'active' : ''}" style="text-align:center; padding:10px; border:1px solid rgba(76,144,255,0.2); border-radius:10px;">
      <img src="${getAvatarSrc(s.id)}" class="skin-img" style="width:80px; height:80px; border-radius:50%; object-fit:cover;">
      <div class="skin-name" style="font-weight:bold; margin:5px 0;">${s.name}</div>
      <button class="clash-challenge-btn" style="width:100%; font-size:12px;" onclick="window.buySkin('${s.id}', ${s.price})">${owned ? 'EQUIPAR' : '💰 ' + s.price}</button>
    </div>`;
  });
  html += '</div>';
  editor.innerHTML = html;

  window.buySkin = async (id, price) => {
    if (user.skins.includes(id)) { user.skin = id; await saveUser(); updateUI(); showAvatarEditor(); }
    else if (user.coins >= price) { user.coins -= price; user.skins.push(id); user.skin = id; await saveUser(); updateUI(); showAvatarEditor(); }
    else alert('❌ Monedas insuficientes');
  };
}

async function showLogros() {
  const allAchievements = getAllAchievements();
  
  // Inicializar logros en el usuario si no existen
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
  
  // Agrupar logros por categoría
  const categories = {};
  allAchievements.forEach(a => {
    if (!categories[a.category]) categories[a.category] = [];
    categories[a.category].push(a);
  });
  
  // Renderizar por categoría
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

function showRanking() {
  const list = document.getElementById('rankingList');
  const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
  onSnapshot(q, (snap) => {
    let players = [];
    snap.forEach(d => players.push({ name: d.id, ...d.data() }));
    let html = '<div class="podium-container">';
    if(players[1]) html += `<div class="podium-item silver">🥈<br>${players[1].name}</div>`;
    if(players[0]) html += `<div class="podium-item gold">🥇<br>${players[0].name}</div>`;
    if(players[2]) html += `<div class="podium-item bronze">🥉<br>${players[2].name}</div>`;
    html += '</div><div class="ranking-list-full">';
    players.forEach((p, i) => {
      html += `<div class="rank-row ${p.name===currentUser?'me':''}"><span>#${i+1} ${p.name}</span><span>⭐ ${p.xp}</span></div>`;
    });
    html += '</div>';
    list.innerHTML = html;
  });
}

var currentInfinityProblem = null;
var infinityStreak = 0;

function nextProblem() {
  const a = window.rnd(1, 50), b = window.rnd(1, 50);
  currentInfinityProblem = { q: `${a} + ${b}`, a: a + b };
  document.getElementById('infinityProblemBox').innerHTML = `
    <div class="problem-box animated zoomIn" style="background: rgba(8,12,26,0.8); border: 2px solid #4c90ff; border-radius: 20px; padding: 40px; box-shadow: 0 0 30px rgba(76,144,255,0.2);">
      <div class="prob-level" style="color: #4c90ff; font-family: 'Orbitron'; font-size: 14px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">DESAFÍO INFINITO</div>
      <div class="prob-question" style="font-family: 'Orbitron'; font-size: 48px; color: #fff; text-shadow: 0 0 15px rgba(76,144,255,0.5);">${currentInfinityProblem.q} = ?</div>
    </div>`;
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const streakBox = document.getElementById('infinityStreakBox');
  const streakCount = document.getElementById('infinityStreakCount');
  if (infinityStreak > 0) {
    streakBox.style.display = 'block';
    streakCount.textContent = infinityStreak;
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
    
    // Verificar y desbloquear logros de racha automáticamente
    const newAchievement = checkStreakAchievements();
    
    document.getElementById('infinityResult').innerHTML = '<span class="correct animated bounceIn">✅ +5 XP +2 💰 🔥 Racha: ' + infinityStreak + '</span>';
    
    // Guardar cambios en Firebase
    await saveUser(); 
    
    updateUI(); 
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
