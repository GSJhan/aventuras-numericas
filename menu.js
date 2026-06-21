import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
  if (!user.stats) user.stats = { facil: 0, normal: 0, dificil: 0, experto: 0, infinito: 0 };
  if (!user.powerDoubleOwned) user.powerDoubleOwned = 0;
  if (!user.powerFiftyOwned) user.powerFiftyOwned = 0;
  if (!user.powerLightOwned) user.powerLightOwned = 0;
  
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
  return Math.floor(xp / 500) + 1;
}

function getXPForNextLevel(level) {
  return level * 500;
}

function updateXPBar() {
  const level = calculateLevel(user.xp);
  const xpCurrentLevel = user.xp % 500;
  const xpRemaining = 500 - xpCurrentLevel;
  const percentage = (xpCurrentLevel / 500) * 100;

  document.getElementById('xpLevel').textContent = level;
  document.getElementById('xpCurrent').textContent = xpCurrentLevel;
  document.getElementById('xpNeeded').textContent = '500';
  document.getElementById('xpBarFill').style.width = percentage + '%';
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
  updateXPBar();

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
      else if (page === 'skills') { document.getElementById('skillsSection').classList.remove('hidden'); showSkills(); }
      else if (page === 'ranking') { document.getElementById('rankingSection').classList.remove('hidden'); showRanking(); }
      else if (page === 'tienda') { document.getElementById('tiendaSection').classList.remove('hidden'); showTienda(); }
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
      await setDoc(userRef, user);
      document.getElementById('avatarDisplay').innerHTML = `<img src="${getAvatarSrc(skin)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;
      showAvatarEditor();
    } else if (user.coins >= price) {
      user.coins -= price;
      user.skins.push(skin);
      user.skin = skin;
      await setDoc(userRef, user);
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

  function showSkills() {
    const stats = user.stats || { facil: 0, normal: 0, dificil: 0, experto: 0, infinito: 0 };
    
    // Calcular valores del radar (escala 0-10)
    const radarData = {
      facil: Math.min((stats.facil / 10) * 10, 10),
      normal: Math.min((stats.normal / 20) * 10, 10),
      dificil: Math.min((stats.dificil / 15) * 10, 10),
      experto: Math.min((stats.experto / 25) * 10, 10),
      infinito: Math.min(((user.infinityBestStreak || 0) / 50) * 10, 10)
    };

    // Dibujar radar
    const canvas = document.getElementById('skillsRadar');
    if (canvas && canvas.getContext) {
      drawSkillsRadar(canvas, radarData);
    }

    // Mostrar estadísticas
    let statsHtml = '';
    const difficulties = [
      { key: 'facil', label: 'Fácil', icon: '😊' },
      { key: 'normal', label: 'Normal', icon: '😐' },
      { key: 'dificil', label: 'Difícil', icon: '😤' },
      { key: 'experto', label: 'Experto', icon: '🔥' },
      { key: 'infinito', label: 'Infinito', icon: '♾️' }
    ];

    difficulties.forEach(diff => {
      const value = radarData[diff.key];
      statsHtml += `
        <div class="skill-stat-item">
          <span class="skill-stat-name">${diff.icon} ${diff.label}</span>
          <div class="skill-stat-bar">
            <div class="skill-stat-fill" style="width: ${value * 10}%"></div>
          </div>
          <span class="skill-stat-value">${value.toFixed(1)}/10</span>
        </div>`;
    });

    document.getElementById('skillsStats').innerHTML = statsHtml;
  }

  function drawSkillsRadar(canvas, data) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const sides = 5;
    const angle = (Math.PI * 2) / sides;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar grid
    ctx.strokeStyle = 'rgba(76,144,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      for (let j = 0; j < sides; j++) {
        const x = centerX + r * Math.cos(angle * j - Math.PI / 2);
        const y = centerY + r * Math.sin(angle * j - Math.PI / 2);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Dibujar ejes
    ctx.strokeStyle = 'rgba(76,144,255,0.5)';
    for (let i = 0; i < sides; i++) {
      const x = centerX + radius * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + radius * Math.sin(angle * i - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Dibujar datos
    const values = [data.facil, data.normal, data.dificil, data.experto, data.infinito];
    ctx.fillStyle = 'rgba(76,255,144,0.3)';
    ctx.strokeStyle = 'rgba(76,255,144,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const r = (radius / 10) * values[i];
      const x = centerX + r * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + r * Math.sin(angle * i - Math.PI / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Etiquetas
    ctx.fillStyle = 'rgba(232,234,255,0.8)';
    ctx.font = 'bold 12px Orbitron';
    ctx.textAlign = 'center';
    const labels = ['Fácil', 'Normal', 'Difícil', 'Experto', 'Infinito'];
    for (let i = 0; i < sides; i++) {
      const x = centerX + (radius + 25) * Math.cos(angle * i - Math.PI / 2);
      const y = centerY + (radius + 25) * Math.sin(angle * i - Math.PI / 2);
      ctx.fillText(labels[i], x, y);
    }
  }

  async function showRanking() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('xp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      let users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Mostrar podio (top 3)
      let podiumHtml = '';
      const classes = ['gold', 'silver', 'bronze'];
      const medals = ['🥇', '🥈', '🥉'];
      
      // Ordenar para que el 1ero esté en el centro: 2, 1, 3
      const order = [1, 0, 2]; 
      
      order.forEach(idx => {
        if (users[idx]) {
          const u = users[idx];
          const level = calculateLevel(u.xp || 0);
          podiumHtml += `
            <div class="podium-item ${classes[idx]}">
              <div style="font-size:32px; margin-bottom:5px;">${medals[idx]}</div>
              <div class="podium-name">${u.id}</div>
              <div class="podium-xp">Nivel ${level}</div>
              <div class="podium-xp">${u.xp || 0} XP</div>
            </div>`;
        }
      });
      document.getElementById('rankingPodium').innerHTML = podiumHtml;

      // Mostrar lista completa
      let listHtml = '';
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const level = calculateLevel(u.xp || 0);
        const isCurrentUser = u.id === currentUser;
        listHtml += `
          <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}">
            <div class="ranking-position">#${i + 1}</div>
            <div class="ranking-info">
              <div class="ranking-name">${u.id}${isCurrentUser ? ' (Tú)' : ''}</div>
              <div class="ranking-stats">Nivel ${level} • ${u.coins || 0} 💰</div>
            </div>
            <div class="ranking-xp">${u.xp || 0} XP</div>
          </div>`;
      }
      document.getElementById('rankingList').innerHTML = listHtml;
    } catch (e) {
      console.error('Error al cargar ranking:', e);
      document.getElementById('rankingList').innerHTML = '<p style="color:red;">Error al cargar ranking</p>';
    }
  }

  function showTienda() {
    const poderes = [
      { id: 'double', name: 'Doble XP', icon: '2️⃣', desc: 'Duplica XP por 10 preguntas', price: 500, owned: user.powerDoubleOwned || 0 },
      { id: 'fifty', name: '50/50', icon: '5️⃣', desc: 'Elimina 2 opciones incorrectas', price: 300, owned: user.powerFiftyOwned || 0 },
      { id: 'hint', name: 'Pista', icon: '💡', desc: 'Obtén una pista para la pregunta', price: 200, owned: user.powerLightOwned || 0 }
    ];

    let tiendaHtml = '';
    poderes.forEach(poder => {
      tiendaHtml += `
        <div class="poder-card">
          <div class="poder-icon">${poder.icon}</div>
          <div class="poder-name">${poder.name}</div>
          <div class="poder-desc">${poder.desc}</div>
          <div class="poder-owned">Poseídos: ${poder.owned}</div>
          <div class="poder-price">💰 ${poder.price}</div>
          <button class="poder-btn buy" onclick="window.buyPower('${poder.id}', ${poder.price})" ${user.coins < poder.price ? 'disabled' : ''}>
            ${user.coins >= poder.price ? 'Comprar' : 'Sin monedas'}
          </button>
        </div>`;
    });

    document.getElementById('tiendaPoderes').innerHTML = tiendaHtml;
  }

  window.showCustomModal = (title, message, icon, callback) => {
  const modal = document.getElementById('customModal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  document.getElementById('modalIcon').textContent = icon;
  modal.classList.remove('hidden');
  
  const confirmBtn = document.getElementById('modalConfirmBtn');
  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
    if (callback) callback();
  };
};

window.buyPower = async (powerId, price) => {
    if (user.coins < price) {
      window.showCustomModal('Error', 'No tienes suficientes monedas', '❌');
      return;
    }

    const powerNames = { double: 'Doble XP', fifty: '50/50', hint: 'Pista' };
    const powerIcons = { double: '2️⃣', fifty: '5️⃣', hint: '💡' };

    user.coins -= price;
    if (powerId === 'double') user.powerDoubleOwned = (user.powerDoubleOwned || 0) + 1;
    else if (powerId === 'fifty') user.powerFiftyOwned = (user.powerFiftyOwned || 0) + 1;
    else if (powerId === 'hint') user.powerLightOwned = (user.powerLightOwned || 0) + 1;

    await saveUser();
    document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
    showTienda();
    
    window.showCustomModal('+1 ' + powerNames[powerId], 'Comprado exitosamente', powerIcons[powerId]);
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
