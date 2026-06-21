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

function calculateLevel(xp) {
  // Fórmula que escala hasta 10 millones de niveles
  // Cada nivel requiere un poco más que el anterior
  // Ejemplo: Nivel 1 = 0 XP, Nivel 2 = 500 XP, etc.
  return Math.floor(xp / 500) + 1;
}

function getXPForNextLevel(level) {
  return level * 500;
}

function initMenu() {
  const level = calculateLevel(user.xp);
  const xpForNext = getXPForNextLevel(level);
  const xpCurrentLevel = user.xp % 500;
  const xpRemaining = 500 - xpCurrentLevel;

  document.getElementById('displayUsername').textContent = currentUser + ` (Nivel ${level})`;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
  document.getElementById('displayXP').textContent = `⭐ ${user.xp} XP (Faltan ${xpRemaining} para nivel ${level + 1})`;

  var initSkin = user.skin || 'spiderman';
  document.getElementById('avatarDisplay').innerHTML = `<img src="${getAvatarSrc(initSkin)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;

  var savedBg = localStorage.getItem('background') || 'ciudad';
  document.body.className = savedBg;
  showThemes();

  // --- LÓGICA DE MÚSICA ---
  const bgMusic = document.getElementById('bgMusic');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');
  const configMusicBtn = document.getElementById('toggleMusicBtnConfig');
  const musicStatusText = document.getElementById('musicStatusText');

  const tracks = {
    'ciudad': 'ciudad.mp3',
    'galaxia': 'galaxia.mp3',
    'parque': 'parque.mp3',
    'fondo1': 'bosque.mp3',
    'fondo2': 'neon.mp3'
  };

  function updateMusicSource() {
    const currentBg = localStorage.getItem('background') || 'ciudad';
    bgMusic.src = tracks[currentBg] || 'ciudad.mp3';
  }

  function toggleMusic() {
    if (bgMusic.paused) {
      bgMusic.play().catch(e => console.log("Error al reproducir:", e));
      floatingMusicBtn.classList.remove('off');
      floatingMusicBtn.textContent = '🎵';
      if (configMusicBtn) configMusicBtn.textContent = 'Desactivar Música';
      if (musicStatusText) musicStatusText.textContent = 'Estado: Activada';
    } else {
      bgMusic.pause();
      floatingMusicBtn.classList.add('off');
      floatingMusicBtn.textContent = '🔇';
      if (configMusicBtn) configMusicBtn.textContent = 'Activar Música';
      if (musicStatusText) musicStatusText.textContent = 'Estado: Desactivada';
    }
  }

  floatingMusicBtn.onclick = toggleMusic;
  if (configMusicBtn) configMusicBtn.onclick = toggleMusic;
  updateMusicSource();

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
      else if (page === 'config') { document.getElementById('configSection').classList.remove('hidden'); showThemes(); }
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
      let actionHtml = '';
      
      if (owned) {
        actionHtml = `<button class="skin-action-btn select" onclick="event.stopPropagation(); window.selectSkin('${s.avatar}', ${s.price})">${active ? '✅ Equipado' : 'Seleccionar'}</button>`;
      } else {
        actionHtml = `<button class="skin-action-btn buy" onclick="event.stopPropagation(); window.selectSkin('${s.avatar}', ${s.price})">Comprar</button><div class="skin-price">💰 ${s.price}</div>`;
      }
      
      html += `
        <div class="skin-item ${active ? 'active' : ''} ${!owned ? 'locked' : ''}">
          <img src="${getAvatarSrc(s.avatar)}" class="skin-img"/>
          <div class="skin-name">${s.name}</div>
          <div class="skin-action">
            ${actionHtml}
          </div>
        </div>`;
    });
    html += `</div>`;
    editor.innerHTML = html;
  }

  window.selectSkin = async (skin, price) => {
    const owned = user.skins.includes(skin);
    if (owned) {
      user.skin = skin;
      await setDoc(userRef, user); // Guardar directamente sin checkAllAchievements para evitar recargas o procesos lentos
      // Actualizar UI sin recargar
      document.getElementById('avatarDisplay').innerHTML = `<img src="${getAvatarSrc(skin)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;
      showAvatarEditor();
    } else if (user.coins >= price) {
      user.coins -= price;
      user.skins.push(skin);
      user.skin = skin;
      await setDoc(userRef, user);
      // Actualizar UI sin recargar
      document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
      document.getElementById('avatarDisplay').innerHTML = `<img src="${getAvatarSrc(skin)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;
      showAvatarEditor();
    } else {
      alert('No tienes suficientes monedas');
    }
  };

  function showThemes() {
    const themes = [
      { id: 'ciudad', name: 'Ciudad Futurista', img: 'ciudad.jpg' },
      { id: 'galaxia', name: 'Galaxia', img: 'galaxia.jpg' },
      { id: 'parque', name: 'Parque', img: 'parque.jpg' },
      { id: 'fondo1', name: 'Bosque', img: 'bosque.jpg' },
      { id: 'fondo2', name: 'Neón (Llamativo)', img: 'neon.jpg', special: 'neon-theme' }
    ];

    const container = document.getElementById('themesContainer');
    if (!container) return;
    
    const currentBg = localStorage.getItem('background') || 'ciudad';
    let html = '';
    themes.forEach(t => {
      const active = currentBg === t.id;
      html += `
        <div class="theme-item ${t.special || ''}">
          <img src="${t.img}" class="theme-preview">
          <span class="theme-name">${t.name}</span>
          <button class="select-theme-btn ${active ? 'active' : ''}" onclick="window.setTheme('${t.id}')">
            ${active ? 'Seleccionado' : 'Seleccionar'}
          </button>
        </div>`;
    });
    container.innerHTML = html;
  }

  window.setTheme = (themeId) => {
    document.body.className = themeId;
    localStorage.setItem('background', themeId);
    updateMusicSource();
    if (!bgMusic.paused) {
      bgMusic.play();
    }
    showThemes();
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
