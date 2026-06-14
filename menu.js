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

async function saveUser() {
  if (userRef && user) {
    await setDoc(userRef, user);
  }
}

function calcLevelFrom(xp) {
  var lvl = 1, needed = 100, total = xp || 0;
  while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
  return lvl;
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

  document.getElementById('displayUsername').textContent = currentUser;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  
  const avatarImg = getAvatarSrc(user.skin);
  document.getElementById('avatarDisplay').innerHTML = `<img src="${avatarImg}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>`;
  
  initMenu();
}

function getAvatarSrc(skin) {
  const avatars = {
    'spiderman': 'spiderman.png',
    'batman': 'batman.jpg',
    'goku': 'goku.png',
    'ironman': 'ironman.png',
    'sasuke': 'sasuke.png',
    'kakashi': 'kakashi.jpg',
    'vegeta': 'vegeta.png',
    'itachi': 'itachi.png',
    'zoro': 'zoro.png',
    'luffy': 'luffy.png'
  };
  return avatars[skin] || 'spiderman.png';
}

function initMenu() {
  const buttons = document.querySelectorAll('.menu-btn');
  buttons.forEach(btn => {
    btn.onclick = function() {
      const page = this.dataset.page;
      document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
      
      if (page === 'game') {
        window.location.href = 'game.html';
      } else if (page === 'infinito') {
        document.getElementById('infinitoSection').classList.remove('hidden');
        if (!currentInfinityProblem) nextProblem();
      } else if (page === 'avatar') {
        document.getElementById('avatarSection').classList.remove('hidden');
        showAvatarEditor();
      } else if (page === 'skills') {
        document.getElementById('skillsSection').classList.remove('hidden');
        renderSkillsTree(user, userRef, saveUser);
      } else if (page === 'duels') {
        document.getElementById('duelsSection').classList.remove('hidden');
        renderDuelsInterface(db, user, currentUser, userRef, saveUser);
      } else if (page === 'shop') {
        document.getElementById('shopSection').classList.remove('hidden');
        renderShop();
      } else if (page === 'logros') {
        document.getElementById('logrosSection').classList.remove('hidden');
        showLogros();
      } else if (page === 'ranking') {
        document.getElementById('rankingSection').classList.remove('hidden');
        showRanking();
      } else if (page === 'config') {
        document.getElementById('configSection').classList.remove('hidden');
      }
    };
  });

  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  };

  // Modo Infinito
  document.getElementById('infinitySolveBtn').onclick = checkInfinity;
  document.getElementById('infinityEquation').onkeydown = (e) => { if(e.key==='Enter') checkInfinity(); };
}

// ── TIENDA ────────────────────────────────────────────────────────────────
function renderShop() {
  const shopGrid = document.getElementById('shopGrid');
  const powers = [
    { id: 'double', name: 'Doble o Nada', price: 150, icon: '💰', desc: 'Doble XP y Monedas' },
    { id: 'fifty', name: '50/50', price: 100, icon: '🌓', desc: 'Quita 2 opciones' },
    { id: 'light', name: 'Al Sonido de la Luz', price: 100, icon: '⚡', desc: 'x1.5 XP durante 10s' }
  ];

  let html = '<div class="shop-powers"><h3>⚡ Poderes Especiales</h3><div class="clash-grid">';
  powers.forEach(p => {
    html += `
      <div class="clash-item">
        <div class="clash-avatar">${p.icon}</div>
        <div class="clash-info">
          <div class="clash-name">${p.name}</div>
          <div class="clash-xp">${p.desc}</div>
          <div class="price">💰 ${p.price}</div>
        </div>
        <button class="clash-challenge-btn" onclick="window.buyPower('${p.id}', ${p.price})">COMPRAR (${user.powers[p.id] || 0})</button>
      </div>`;
  });
  html += '</div></div>';
  shopGrid.innerHTML = html;

  window.buyPower = async (id, price) => {
    if (user.coins >= price) {
      user.coins -= price;
      user.powers[id] = (user.powers[id] || 0) + 1;
      await saveUser();
      document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
      renderShop();
    } else {
      alert('❌ No tienes suficientes monedas');
    }
  };
}

function showAvatarEditor() {
  const editor = document.getElementById('avatarEditor');
  const skins = [
    { id: 'spiderman', name: 'Spider-Man', price: 0 },
    { id: 'batman', name: 'Batman', price: 500 },
    { id: 'goku', name: 'Goku', price: 1200 },
    { id: 'ironman', name: 'Iron Man', price: 800 },
    { id: 'sasuke', name: 'Sasuke', price: 700 },
    { id: 'kakashi', name: 'Kakashi', price: 650 },
    { id: 'vegeta', name: 'Vegeta', price: 1100 },
    { id: 'itachi', name: 'Itachi', price: 1500 },
    { id: 'zoro', name: 'Zoro', price: 600 },
    { id: 'luffy', name: 'Luffy', price: 900 }
  ];

  let html = '<div class="skins-grid">';
  skins.forEach(s => {
    const owned = user.skins.includes(s.id);
    html += `
      <div class="skin-item ${owned ? 'active' : ''}" onclick="window.buySkin('${s.id}', ${s.price})">
        <img src="${getAvatarSrc(s.id)}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">
        <div class="skin-name">${s.name}</div>
        <div class="${owned ? 'owned' : 'price'}">${owned ? '✅' : '💰 ' + s.price}</div>
      </div>`;
  });
  html += '</div>';
  editor.innerHTML = html;

  window.buySkin = async (id, price) => {
    if (user.skins.includes(id)) {
      user.skin = id;
      await saveUser();
      loadUser();
      showAvatarEditor();
    } else if (user.coins >= price) {
      user.coins -= price;
      user.skins.push(id);
      user.skin = id;
      await saveUser();
      loadUser();
      showAvatarEditor();
    } else {
      alert('❌ Monedas insuficientes');
    }
  };
}

// ── MODO INFINITO ────────────────────────────────────────────────────────
var currentInfinityProblem = null;
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function nextProblem() {
  const a = rnd(1, 50), b = rnd(1, 50);
  currentInfinityProblem = { q: `${a} + ${b}`, a: a + b };
  document.getElementById('infinityProblemBox').innerHTML = `<div class="prob-question">${currentInfinityProblem.q} = ?</div>`;
}

async function checkInfinity() {
  const ans = parseInt(document.getElementById('infinityEquation').value);
  if (ans === currentInfinityProblem.a) {
    user.xp += 5;
    user.coins += 2;
    await saveUser();
    document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
    document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
    document.getElementById('infinityEquation').value = '';
    nextProblem();
  } else {
    alert('❌ Incorrecto');
  }
}

function showLogros() {
  // Implementación simplificada de logros
  document.getElementById('logrosList').innerHTML = '<p style="text-align:center;padding:20px;">🏆 Juega para desbloquear logros</p>';
}

function showRanking() {
  const list = document.getElementById('rankingList');
  const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
  onSnapshot(q, (snap) => {
    let html = '<div style="padding:10px;">';
    snap.forEach(doc => {
      html += `<div class="friend-item"><span>${doc.id}</span><span>⭐ ${doc.data().xp}</span></div>`;
    });
    html += '</div>';
    list.innerHTML = html;
  });
}

loadUser();
