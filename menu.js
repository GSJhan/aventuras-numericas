import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { renderSkillsTree } from './skills.js';
import { renderDuelsInterface } from './duels.js';

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

// --- SISTEMA DE NIVELES (Hasta 10,000,000) ---
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
  
  // Inicializar datos si no existen
  if (!user.skins) user.skins = ['spiderman'];
  if (!user.skin) user.skin = 'spiderman';
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.powers) user.powers = { double: 0, fifty: 0, light: 0 };
  if (!user.logros) user.logros = {};

  updateUI();
  applyTheme(localStorage.getItem('background') || 'ciudad');
  initMenu();
}

function updateUI() {
  const data = getLevelData(user.xp);
  document.getElementById('displayUsername').textContent = currentUser;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  
  // Barra de XP y Nivel
  const progress = (data.currentXP / data.nextLevelXP) * 100;
  const levelInfo = document.getElementById('levelInfo');
  if (!levelInfo) {
    const userInfo = document.querySelector('.user-info');
    const badge = document.createElement('span');
    badge.id = 'levelInfo';
    badge.className = 'xp-badge';
    badge.style.color = '#4cff90';
    userInfo.appendChild(badge);
  }
  document.getElementById('levelInfo').innerHTML = `📈 Nv.${data.lvl} (${Math.floor(progress)}%) - Falta: ${data.nextLevelXP - data.currentXP} XP`;

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
    bgAudio.play().catch(() => console.log("Música silenciada por el navegador"));
  }
}

function initMenu() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = function() {
      const page = this.dataset.page;
      document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
      
      if (page === 'game') window.location.href = 'game.html';
      else if (page === 'infinito') { document.getElementById('infinitoSection').classList.remove('hidden'); if(!currentInfinityProblem) nextProblem(); }
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
  document.getElementById('backgroundSelect').value = localStorage.getItem('background') || 'ciudad';
  document.getElementById('backgroundSelect').onchange = (e) => applyTheme(e.target.value);
  document.getElementById('musicToggle').checked = localStorage.getItem('music') !== 'off';
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
    html += `<div class="clash-item animated fadeIn">
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
      await saveUser();
      updateUI();
      renderShop();
    } else alert('❌ No tienes suficientes monedas');
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

  let html = '<div class="skins-grid">';
  skins.forEach(s => {
    const owned = user.skins.includes(s.id);
    html += `<div class="skin-item ${owned ? 'active' : ''} animated zoomIn" onclick="window.buySkin('${s.id}', ${s.price})">
      <img src="${getAvatarSrc(s.id)}" class="skin-img">
      <div class="skin-name">${s.name}</div>
      <div class="${owned ? 'owned' : 'price'}">${owned ? 'EQUIPAR' : '💰 ' + s.price}</div>
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

// --- LOGROS ---
function showLogros() {
  const logros = [
    { id:'mision3', icon:'🏆', title:'Novato', desc:'3 problemas resueltos' },
    { id:'rach5', icon:'🔥', title:'Racha x5', desc:'5 aciertos seguidos' },
    { id:'nivel10', icon:'⭐', title:'Nivel 10', desc:'Llega al nivel 10' },
    { id:'duels5', icon:'⚔️', title:'Guerrero', desc:'Gana 5 duelos' }
  ];
  let html = '<div class="logros-list">';
  logros.forEach(l => {
    const done = user.logros[l.id];
    html += `<div class="logro-item ${done?'achieved':''} animated fadeIn">
      <div class="icon">${l.icon}</div>
      <div class="info"><h3>${l.title}</h3><p>${l.desc}</p></div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('logrosList').innerHTML = html;
}

// --- RANKING ---
function showRanking() {
  const list = document.getElementById('rankingList');
  const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
  onSnapshot(q, (snap) => {
    let players = [];
    snap.forEach(d => players.push({ name: d.id, ...d.data() }));
    let html = '<div class="podium-container animated fadeIn">';
    // Top 3 Visual
    if(players[1]) html += `<div class="podium-item silver">🥈<br>${players[1].name}</div>`;
    if(players[0]) html += `<div class="podium-item gold">🥇<br>${players[0].name}</div>`;
    if(players[2]) html += `<div class="podium-item bronze">🥉<br>${players[2].name}</div>`;
    html += '</div><div class="ranking-list-full">';
    players.forEach((p, i) => {
      html += `<div class="rank-row ${p.name===currentUser?'me':''}">
        <span>#${i+1} ${p.name}</span>
        <span>⭐ ${p.xp}</span>
      </div>`;
    });
    html += '</div>';
    list.innerHTML = html;
  });
}

// --- MODO INFINITO ---
var currentInfinityProblem = null;
function nextProblem() {
  const a = rnd(1, 50), b = rnd(1, 50);
  currentInfinityProblem = { q: `${a} + ${b}`, a: a + b };
  document.getElementById('infinityProblemBox').innerHTML = `<div class="prob-question animated zoomIn">${currentInfinityProblem.q} = ?</div>`;
}
async function checkInfinity() {
  const val = parseInt(document.getElementById('infinityEquation').value);
  if (val === currentInfinityProblem.a) {
    user.xp += 5; user.coins += 2;
    document.getElementById('infinityResult').innerHTML = '<span class="correct animated bounceIn">✅ +5 XP +2 💰</span>';
    await saveUser(); updateUI(); document.getElementById('infinityEquation').value = ''; nextProblem();
  } else {
    document.getElementById('infinityResult').innerHTML = '<span class="wrong animated shake">❌ Inténtalo de nuevo</span>';
  }
}

loadUser();
