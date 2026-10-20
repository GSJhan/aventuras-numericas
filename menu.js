import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

const DEFAULT_USER = {
  username: '',
  xp: 0,
  coins: 0,
  level: 1,
  skin: 'spiderman',
  skins: ['spiderman'],
  logros: {},
  skills: { algebra: 0, geometry: 0, speed: 0, precision: 0, infinity: 0 },
  stats: { facil: 0, normal: 0, dificil: 0, experto: 0, infinito: 0 },
  problemsSolved: 0,
  quizQuestionsAnswered: 0,
  infinityProblemsSolved: 0,
  infinityBestStreak: 0,
  duelsWon: 0,
  powerDoubleOwned: 0,
  powerFiftyOwned: 0,
  powerLightOwned: 0,
  powerDoubleUsed: 0,
  powerFiftyUsed: 0,
  powerLightUsed: 0
};

const AVATARS = [
  { id: 'spiderman', name: 'Spiderman', src: 'spiderman.png' },
  { id: 'batman', name: 'Batman', src: 'batman.jpg' },
  { id: 'ironman', name: 'Iron Man', src: 'ironman.png' },
  { id: 'goku', name: 'Goku', src: 'goku.png' },
  { id: 'sasuke', name: 'Sasuke', src: 'sasuke.png' },
  { id: 'kakashi', name: 'Kakashi', src: 'kakashi.jpg' },
  { id: 'vegeta', name: 'Vegeta', src: 'vegeta.png' },
  { id: 'itachi', name: 'Itachi', src: 'itachi.png' },
  { id: 'zoro', name: 'Zoro', src: 'zoro.png' },
  { id: 'luffy', name: 'Luffy', src: 'luffy.png' }
];

const POWERS = [
  { id: 'double', name: 'Doble', icon: '✖️', desc: 'Duplica tus puntos.', cost: 35 },
  { id: 'fifty', name: '50%', icon: '🎯', desc: 'Reduce la cuenta a la mitad.', cost: 45 },
  { id: 'light', name: 'Luz', icon: '⚡', desc: 'Poder de ayuda rápida.', cost: 30 }
];

const FALLBACK_FRIENDS = [
  { username: 'Marta', xp: 1200 },
  { username: 'Lucas', xp: 950 },
  { username: 'Nina', xp: 1450 },
  { username: 'Dani', xp: 880 },
  { username: 'Ari', xp: 1700 }
];

let user = null;
let musicEnabled = false;

function safeGetCurrentUser() {
  return localStorage.getItem('currentUser') || '';
}

function getAvatarSrc(avatarId) {
  const item = AVATARS.find(a => a.id === avatarId);
  return item ? item.src : 'spiderman.png';
}

function getAvatarEmoji(avatarId) {
  const map = {
    spiderman: '🕷️',
    batman: '🦇',
    ironman: '🤖',
    goku: '🧡',
    sasuke: '⚫',
    kakashi: '👁️',
    vegeta: '💜',
    itachi: '🌙',
    zoro: '🗡️',
    luffy: '❤️'
  };
  return map[avatarId] || '🦸';
}

function getXpProgress(xp) {
  const safeXP = Number(xp) || 0;
  const level = Math.floor(safeXP / 500) + 1;
  const currentLevelXP = safeXP - ((level - 1) * 500);
  const nextThreshold = level * 500;
  const percent = Math.min(100, (currentLevelXP / 500) * 100);
  return { level, currentLevelXP, nextThreshold, percent };
}

function ensurePowerState() {
  if (!user) return;
  user.powerDoubleOwned = Number(user.powerDoubleOwned || 0);
  user.powerFiftyOwned = Number(user.powerFiftyOwned || 0);
  user.powerLightOwned = Number(user.powerLightOwned || 0);
}

function setBodyTheme(themeId) {
  const theme = themeId || 'ciudad';
  document.body.classList.remove('ciudad', 'galaxia', 'parque', 'fondo1', 'fondo2');
  document.body.classList.add(theme);
  localStorage.setItem('background', theme);
}

function renderThemeButtons() {
  const container = document.getElementById('themesContainer');
  if (!container) return;

  const activeTheme = localStorage.getItem('background') || 'ciudad';
  container.innerHTML = [
    { id: 'ciudad', name: 'Ciudad' },
    { id: 'galaxia', name: 'Galaxia' },
    { id: 'parque', name: 'Parque' },
    { id: 'fondo1', name: 'Bosque' },
    { id: 'fondo2', name: 'Neón' }
  ].map(theme => `
    <button class="theme-option ${activeTheme === theme.id ? 'active' : ''}" data-theme="${theme.id}" title="${theme.name}">
      <div style="width:100%; height:100%; background: linear-gradient(135deg, ${theme.id === 'ciudad' ? '#1d4ed8, #0f172a' : theme.id === 'galaxia' ? '#312e81, #111827' : theme.id === 'parque' ? '#166534, #14532d' : theme.id === 'fondo1' ? '#1f2937, #0f766e' : '#7c3aed, #0f172a'});"></div>
    </button>
  `).join('');

  container.querySelectorAll('.theme-option').forEach(button => {
    button.addEventListener('click', () => {
      setBodyTheme(button.dataset.theme);
      renderThemeButtons();
    });
  });
}

function renderHeader() {
  if (!user) return;

  const xp = getXpProgress(user.xp || 0);
  const displayUsername = document.getElementById('displayUsername');
  const displayCoins = document.getElementById('displayCoins');
  const xpLevel = document.getElementById('xpLevel');
  const xpCurrent = document.getElementById('xpCurrent');
  const xpNeeded = document.getElementById('xpNeeded');
  const xpBarFill = document.getElementById('xpBarFill');
  const avatarDisplay = document.getElementById('avatarDisplay');

  if (displayUsername) displayUsername.textContent = user.username || safeGetCurrentUser() || 'Usuario';
  if (displayCoins) displayCoins.textContent = `💰 ${Number(user.coins || 0)}`;
  if (xpLevel) xpLevel.textContent = xp.level;
  if (xpCurrent) xpCurrent.textContent = xp.currentLevelXP;
  if (xpNeeded) xpNeeded.textContent = 500;
  if (xpBarFill) xpBarFill.style.width = `${xp.percent}%`;
  if (avatarDisplay) {
    const chosen = user.skin || 'spiderman';
    if (avatarDisplay.tagName === 'IMG') {
      avatarDisplay.src = getAvatarSrc(chosen);
      avatarDisplay.alt = chosen;
    } else {
      avatarDisplay.innerHTML = `<img src="${getAvatarSrc(chosen)}" class="avatar-img-main" alt="${chosen}" onerror="this.outerHTML='🦸'">`;
    }
  }
}

function renderProfile() {
  const profileContent = document.getElementById('profileContent');
  if (!profileContent || !user) return;

  const xpInfo = getXpProgress(user.xp || 0);
  const achievementsTotal = Object.keys(user.logros || {}).length;

  profileContent.innerHTML = `
    <div class="profile-header">
      <img class="profile-avatar" src="${getAvatarSrc(user.skin || 'spiderman')}" alt="avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
      <div class="profile-avatar" style="display:none; font-size:32px; text-align:center; line-height:80px;">${getAvatarEmoji(user.skin || 'spiderman')}</div>
      <div class="profile-info">
        <h3>${user.username || safeGetCurrentUser() || 'Usuario'}</h3>
        <p>Nivel: ${xpInfo.level}</p>
        <p>XP: ${user.xp || 0} / ${xpInfo.nextThreshold}</p>
      </div>
    </div>
    <div class="profile-stats-grid">
      <div class="stat-item"><span>Monedas</span><span>${user.coins || 0}</span></div>
      <div class="stat-item"><span>Racha</span><span>${user.infinityBestStreak || 0}</span></div>
      <div class="stat-item"><span>Desafíos</span><span>${user.quizQuestionsAnswered || 0}</span></div>
      <div class="stat-item"><span>Logros</span><span>${achievementsTotal}</span></div>
    </div>
  `;
}

function renderConfig() {
  const musicText = document.getElementById('musicStatusText');
  const toggleButton = document.getElementById('toggleMusicBtnConfig');
  if (musicText) musicText.textContent = `Estado: ${musicEnabled ? 'Activada' : 'Desactivada'}`;
  if (toggleButton) toggleButton.textContent = musicEnabled ? 'Pausar Música' : 'Activar Música';
}

function buildFriendsHTML(list) {
  if (!list || !list.length) {
    return `<div class="friend-item"><span>No hay amigos aún</span><button class="btn-small">Añadir</button></div>`;
  }

  return list.map(friend => `
    <div class="friend-item">
      <div>
        <strong>${friend.username || friend.name || 'Usuario'}</strong>
        <div style="opacity:0.75; font-size:12px;">XP ${friend.xp || 0}</div>
      </div>
      <button class="btn-small" onclick="alert('Solicitud enviada a ${friend.username || friend.name || 'este jugador'}')">Añadir</button>
    </div>
  `).join('');
}

async function loadFriendsFromFirebase() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (docSnap.id !== safeGetCurrentUser()) {
        users.push({ username: docSnap.id, ...data });
      }
    });
    return users.length ? users : FALLBACK_FRIENDS;
  } catch (error) {
    console.warn('No se pudieron cargar los amigos desde Firebase:', error);
    return FALLBACK_FRIENDS;
  }
}

async function showFriendsList() {
  const container = document.getElementById('friendsContent');
  if (!container) return;

  const friends = await loadFriendsFromFirebase();
  container.innerHTML = `
    <div class="friends-list">
      ${buildFriendsHTML(friends.slice(0, 6))}
    </div>
  `;
}

async function showAddFriends() {
  const container = document.getElementById('friendsContent');
  if (!container) return;

  const friends = await loadFriendsFromFirebase();
  const html = `
    <div class="search-box">
      <input id="friendSearchInput" type="text" placeholder="Buscar amigo..." />
      <button class="btn-small" type="button" onclick="window.filterFriends()">Buscar</button>
    </div>
    <div class="friends-list">
      ${buildFriendsHTML(friends)}
    </div>
  `;
  container.innerHTML = html;
  const input = document.getElementById('friendSearchInput');
  if (input) {
    input.addEventListener('input', () => {
      const list = friends.filter(f => (f.username || '').toLowerCase().includes(input.value.toLowerCase()));
      const listContainer = document.querySelector('#friendsContent .friends-list');
      if (listContainer) listContainer.innerHTML = buildFriendsHTML(list);
    });
  }
}

window.filterFriends = function () {
  const input = document.getElementById('friendSearchInput');
  if (!input) return;
  const value = input.value.toLowerCase();
  const container = document.querySelector('#friendsContent .friends-list');
  if (!container) return;
  const all = FALLBACK_FRIENDS.slice();
  const filtered = all.filter(friend => (friend.username || '').toLowerCase().includes(value));
  container.innerHTML = buildFriendsHTML(filtered);
};

function showSkillsPanel() {
  const statsContainer = document.getElementById('skillsStats');
  if (!statsContainer || !user) return;

  const skills = user.skills || { algebra: 0, geometry: 0, speed: 0, precision: 0, infinity: 0 };
  const entries = Object.entries(skills).map(([key, value]) => `
    <div class="stat-item">
      <span>${key}</span>
      <span>${value}</span>
    </div>
  `).join('');

  statsContainer.innerHTML = entries;

  const canvas = document.getElementById('skillsRadar');
  if (!canvas) return;

  if (typeof Chart !== 'undefined') {
    new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Álgebra', 'Geometría', 'Velocidad', 'Precisión', 'Infinito'],
        datasets: [{
          label: 'Habilidades',
          data: [skills.algebra || 0, skills.geometry || 0, skills.speed || 0, skills.precision || 0, skills.infinity || 0],
          backgroundColor: 'rgba(76,144,255,0.25)',
          borderColor: '#4c90ff',
          borderWidth: 2
        }]
      },
      options: { responsive: true, scales: { r: { suggestedMin: 0, suggestedMax: 10 } } }
    });
  }
}

function showRankingPanel() {
  const podium = document.getElementById('rankingPodium');
  const list = document.getElementById('rankingList');
  if (!podium || !list) return;

  const ranking = [
    { username: 'Nina', xp: 1820 },
    { username: 'Ari', xp: 1700 },
    { username: user?.username || safeGetCurrentUser() || 'Tú', xp: user?.xp || 0 },
    { username: 'Marta', xp: 1200 },
    { username: 'Lucas', xp: 950 }
  ].sort((a, b) => b.xp - a.xp);

  podium.innerHTML = `
    <div class="podium-item silver">#2<br>${ranking[1].username}</div>
    <div class="podium-item gold">#1<br>${ranking[0].username}</div>
    <div class="podium-item bronze">#3<br>${ranking[2].username}</div>
  `;

  list.innerHTML = ranking.map((entry, index) => `
    <div class="rank-row ${entry.username === (user?.username || safeGetCurrentUser()) ? 'me' : ''}">
      <span>#${index + 1} ${entry.username}</span>
      <span>${entry.xp} XP</span>
    </div>
  `).join('');
}

window.showTienda = function () {
  if (!user) return;
  ensurePowerState();

  const container = document.getElementById('tiendaPoderes');
  if (!container) return;

  container.innerHTML = POWERS.map(power => {
    const owned = power.id === 'double'
      ? (user.powerDoubleOwned || 0)
      : power.id === 'fifty'
        ? (user.powerFiftyOwned || 0)
        : (user.powerLightOwned || 0);

    return `
      <div class="tienda-item">
        <div>${power.icon}</div>
        <div>${power.name}</div>
        <div>${power.desc}</div>
        <div>Tienes: ${owned}</div>
        <button class="btn-primary" onclick="window.buyPower('${power.id}', ${power.cost})">${power.cost} 💰</button>
      </div>
    `;
  }).join('');
};

window.buyPower = async function (powerId, cost) {
  if (!user) return;
  ensurePowerState();

  if (Number(user.coins || 0) < Number(cost)) {
    alert('No tienes suficientes monedas');
    return;
  }

  user.coins = Number(user.coins || 0) - Number(cost);

  if (powerId === 'double') user.powerDoubleOwned += 1;
  else if (powerId === 'fifty') user.powerFiftyOwned += 1;
  else if (powerId === 'light') user.powerLightOwned += 1;

  await saveUser();
  renderHeader();
  window.showTienda();
  alert('¡Poder comprado!');
};

window.showAvatarEditor = function () {
  const container = document.getElementById('avatarEditor');
  if (!container || !user) return;

  const avatarGrid = AVATARS.map(avatar => {
    const owned = Array.isArray(user.skins) && user.skins.includes(avatar.id);
    const selected = user.skin === avatar.id;
    const btnText = owned ? (selected ? '✓ Equipado' : 'Equipar') : 'Comprar (500 💰)';
    const btnClass = owned ? (selected ? 'btn-gray' : 'btn-green') : 'btn-primary';

    return `
      <div class="avatar-option ${selected ? 'selected' : ''}">
        <img src="${getAvatarSrc(avatar.id)}" class="avatar-choice-img" onerror="this.src='spiderman.png'" alt="${avatar.name}">
        <div style="margin-top:10px; font-size:12px;">${avatar.name}</div>
        <button class="${btnClass}" onclick="${owned ? `window.selectAvatar('${avatar.id}')` : `window.buyAvatar('${avatar.id}')`}" style="width:100%; margin-top:8px; padding:8px; border:none; border-radius:8px; font-weight:bold;">
          ${btnText}
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = '<div class="avatar-grid">' + avatarGrid + '</div>';
};

window.buyAvatar = async function (avatarId) {
  if (!user) return;
  if ((user.coins || 0) < 500) {
    alert('No tienes suficientes monedas');
    return;
  }

  if (!Array.isArray(user.skins)) user.skins = [];
  if (user.skins.includes(avatarId)) {
    alert('Ya posees este avatar');
    return;
  }

  user.coins = Number(user.coins || 0) - 500;
  user.skins.push(avatarId);
  await saveUser();
  renderHeader();
  window.showAvatarEditor();
  alert('¡Avatar comprado!');
};

window.selectAvatar = async function (avatarId) {
  if (!user) return;
  if (!Array.isArray(user.skins) || !user.skins.includes(avatarId)) {
    alert('Debes comprar este avatar primero');
    return;
  }

  user.skin = avatarId;
  await saveUser();
  renderHeader();
  window.showAvatarEditor();
};

async function saveUser() {
  if (!user) return;
  const currentUserName = safeGetCurrentUser();
  if (!currentUserName) return;
  user.username = currentUserName;
  const userRef = doc(db, 'users', currentUserName);
  await setDoc(userRef, user, { merge: true });
  renderProfile();
  renderHeader();
}

async function loadCurrentUserData() {
  const currentUserName = safeGetCurrentUser();
  if (!currentUserName) {
    window.location.href = 'auth.html';
    return;
  }

  try {
    const userRef = doc(db, 'users', currentUserName);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      localStorage.removeItem('currentUser');
      window.location.href = 'auth.html';
      return;
    }

    user = {
      ...DEFAULT_USER,
      username: currentUserName,
      ...snapshot.data()
    };

    if (!Array.isArray(user.skins) || user.skins.length === 0) {
      user.skins = ['spiderman'];
    }
    if (!user.skin) user.skin = 'spiderman';

    setBodyTheme(localStorage.getItem('background') || 'ciudad');
    renderHeader();
    renderProfile();
    showSkillsPanel();
    showRankingPanel();
    window.showTienda();
    window.showAvatarEditor();
    showFriendsList();
  } catch (error) {
    console.error('Error cargando usuario:', error);
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
  }
}

function bindMenuButtons() {
  document.querySelectorAll('.menu-btn').forEach(button => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;
      if (!page) return;

      if (page === 'game') {
        window.location.href = 'game.html';
        return;
      }

      showSection(page);
    });
  });
}

function showSection(sectionName) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.add('hidden'));

  const target = document.getElementById(`${sectionName}Section`);
  if (target) target.classList.remove('hidden');

  if (sectionName === 'profile') renderProfile();
  if (sectionName === 'config') renderConfig();
  if (sectionName === 'skills') showSkillsPanel();
  if (sectionName === 'ranking') showRankingPanel();
  if (sectionName === 'tienda') window.showTienda();
  if (sectionName === 'avatar') window.showAvatarEditor();
  if (sectionName === 'friends') showFriendsList();
}

function bindLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
  });
}

function bindMusicToggle() {
  const toggleButton = document.getElementById('toggleMusicBtnConfig');
  const bgMusic = document.getElementById('bgMusic');
  if (!toggleButton || !bgMusic) return;

  toggleButton.addEventListener('click', async () => {
    try {
      const selectedTheme = localStorage.getItem('background') || 'ciudad';
      const trackMap = {
        ciudad: 'ciudad.mp3',
        galaxia: 'galaxia.mp3',
        parque: 'parque.mp3',
        fondo1: 'bosque.mp3',
        fondo2: 'neon.mp3'
      };

      bgMusic.src = trackMap[selectedTheme] || 'ciudad.mp3';
      if (!musicEnabled) {
        await bgMusic.play();
        musicEnabled = true;
      } else {
        bgMusic.pause();
        musicEnabled = false;
      }
      renderConfig();
    } catch (error) {
      console.warn('No se pudo activar la música:', error);
      musicEnabled = false;
      renderConfig();
    }
  });
}

window.showFriendsList = showFriendsList;
window.showAddFriends = showAddFriends;
window.showSection = showSection;
window.showAvatarEditor = window.showAvatarEditor;
window.showTienda = window.showTienda;
window.buyPower = window.buyPower;
window.buyAvatar = window.buyAvatar;
window.selectAvatar = window.selectAvatar;
window.minimizeBattleInvite = function () {
  const modal = document.getElementById('battleInviteModal');
  if (modal) modal.classList.add('hidden');
};
window.cancelBattleInvite = function () {
  const modal = document.getElementById('battleInviteModal');
  if (modal) modal.classList.add('hidden');
};
window.restoreBattleInvite = function () {
  const modal = document.getElementById('battleInviteModal');
  if (modal) modal.classList.remove('hidden');
};
window.renderProfile = renderProfile;
window.setBodyTheme = setBodyTheme;
window.getAvatarSrc = getAvatarSrc;

async function initMenu() {
  bindMenuButtons();
  bindLogoutButton();
  bindMusicToggle();
  renderThemeButtons();
  window.showTienda = window.showTienda;
  await loadCurrentUserData();
  showSection('profile');
}

initMenu();

export { loadCurrentUserData, saveUser, getAvatarSrc, getAvatarEmoji, user };
