import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAllAchievements, getAchievementStats, ACHIEVEMENTS } from './achievements.js';
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

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  if (!user.logros) user.logros = {};
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.skins) user.skins = ['spiderman'];
  if (!user.skin) user.skin = 'spiderman';
  
  await checkAllAchievements(user, userRef);
  initMenu();
}

async function saveUser() {
  await setDoc(userRef, user);
  await checkAllAchievements(user, userRef);
}

function getAvatarSrc(name) {
  const jpgList = ['batman', 'kakashi', 'neon', 'parque', 'ciudad', 'bosque'];
  if (jpgList.includes(name)) return name + '.jpg';
  return name + '.png';
}

function initMenu() {
  document.getElementById('displayUsername').textContent = currentUser;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';

  var initSkin = user.skin || 'spiderman';
  document.getElementById('avatarDisplay').innerHTML = `<img src="${getAvatarSrc(initSkin)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;

  var savedBg = localStorage.getItem('background') || 'ciudad';
  document.body.className = savedBg;
  document.getElementById('backgroundSelect').value = savedBg;

  document.getElementById('backgroundSelect').addEventListener('change', function(e) {
    document.body.className = e.target.value;
    localStorage.setItem('background', e.target.value);
  });

  document.getElementById('logoutBtn').onclick = function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  };

  var menuBtns = document.querySelectorAll('.menu-btn');
  menuBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      var page = this.dataset.page;
      document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
      if (page === 'game') window.location.href = 'game.html';
      else if (page === 'avatar') { document.getElementById('avatarSection').classList.remove('hidden'); showAvatarEditor(); }
      else if (page === 'logros') { document.getElementById('logrosSection').classList.remove('hidden'); showLogros(); }
      else if (page === 'config') document.getElementById('configSection').classList.remove('hidden');
    });
  });

  const skins = [
    { avatar: 'spiderman', name: 'Spider-Man', price: 0 },
    { avatar: 'batman', name: 'Batman', price: 80 },
    { avatar: 'goku', name: 'Goku', price: 200 },
    { avatar: 'ironman', name: 'Iron Man', price: 150 },
    { avatar: 'sasuke', name: 'Sasuke', price: 140 },
    { avatar: 'kakashi', name: 'Kakashi', price: 120 },
    { avatar: 'vegeta', name: 'Vegeta', price: 210 },
    { avatar: 'itachi', name: 'Itachi', price: 220 },
    { avatar: 'zoro', name: 'Zoro', price: 95 },
    { avatar: 'luffy', name: 'Luffy', price: 110 }
  ];

  function showAvatarEditor() {
    var editor = document.getElementById('avatarEditor');
    let html = `<div class="skins-grid">`;
    skins.forEach(s => {
      const owned = user.skins.includes(s.avatar);
      const active = user.skin === s.avatar;
      html += `
        <div class="skin-item ${active ? 'active' : ''} ${!owned ? 'locked' : ''}" onclick="window.selectSkin('${s.avatar}', ${s.price})">
          <img src="${getAvatarSrc(s.avatar)}" class="skin-img"/>
          <div class="skin-name">${s.name}</div>
          <small>${owned ? (active ? '✅ Activo' : 'Equipar') : '💰 ' + s.price}</small>
        </div>`;
    });
    html += `</div>`;
    editor.innerHTML = html;
  }

  window.selectSkin = async (skin, price) => {
    const owned = user.skins.includes(skin);
    if (owned) {
      user.skin = skin;
      await saveUser();
      location.reload();
    } else if (user.coins >= price) {
      user.coins -= price;
      user.skins.push(skin);
      user.skin = skin;
      await saveUser();
      location.reload();
    } else {
      alert('No tienes suficientes monedas');
    }
  };

  function showLogros() {
    const stats = getAchievementStats(user.logros);
    let html = `
      <div class="logros-stats">
        <div class="logros-stat-item">
          <div class="logros-stat-value">${stats.unlocked}/${stats.total}</div>
          <div class="logros-stat-label">Completados</div>
        </div>
        <div class="logros-stat-item">
          <div class="logros-stat-value">${stats.percentage}%</div>
          <div class="logros-stat-label">Progreso</div>
        </div>
        <div class="logros-progress-bar">
          <div class="logros-progress-fill" style="width: ${stats.percentage}%"></div>
        </div>
      </div>
    `;

    for (const cat in ACHIEVEMENTS) {
      html += `<h3 class="logros-category-title">${cat.toUpperCase()}</h3><div class="logros-container">`;
      ACHIEVEMENTS[cat].forEach(log => {
        const done = user.logros[log.id];
        html += `
          <div class="logro-card ${done ? 'achieved' : 'locked'}">
            <div class="logro-icon">${log.icon}</div>
            <div class="logro-title">${log.title}</div>
            <div class="logro-desc">${log.desc}</div>
            <div class="logro-status">${done ? 'COMPLETADO' : 'BLOQUEADO'}</div>
          </div>`;
      });
      html += `</div>`;
    }
    document.getElementById('logrosList').innerHTML = html;
  }
}

loadUser();
