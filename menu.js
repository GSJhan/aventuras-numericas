import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  problemSolved: 0,
  quizQuestionsAnswered: 0,
  infinityProblemsSolved: 0,
  duelsWon: 0,
  powerDoubleOwned: 0,
  powerFiftyOwned: 0,
  powerLightOwned: 0
};

const AVATAR_MAP = {
  spiderman: '🕷️',
  batman: '🦇',
  ironman: '🤖',
  goku: '🧡',
  sasuke: '⚫',
  kakashi: '👁️',
  vegeta: '💜',
  itachi: '🌙',
  zoro: '🗡️',
  luffy: '❤️',
  default: '🦸'
};

const THEMES = [
  { id: 'ciudad', name: 'Ciudad' },
  { id: 'galaxia', name: 'Galaxia' },
  { id: 'parque', name: 'Parque' },
  { id: 'fondo1', name: 'Bosque' },
  { id: 'fondo2', name: 'Neón' }
];

let user = null;
let musicEnabled = false;

function getCurrentUserName() {
  return localStorage.getItem('currentUser') || '';
}

function getAvatarEmoji(skin) {
  return AVATAR_MAP[skin] || AVATAR_MAP.default;
}

function getLevelFromXP(xp) {
  return Math.floor((Number(xp) || 0) / 500) + 1;
}

function getXPProgress(xp) {
  const current = Number(xp) || 0;
  const level = getLevelFromXP(current);
  const currentLevelXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const progress = current - currentLevelXP;
  return {
    level,
    currentLevelXP: progress,
    nextLevelXP,
    percent: Math.min(100, (progress / 500) * 100)
  };
}

function setBodyTheme(themeId) {
  const safeTheme = themeId || 'ciudad';
  document.body.classList.remove('ciudad', 'galaxia', 'parque', 'fondo1', 'fondo2');
  document.body.classList.add(safeTheme);
  localStorage.setItem('background', safeTheme);
}

function renderHeader() {
  if (!user) return;

  const username = user.username || getCurrentUserName() || 'Usuario';
  const xpInfo = getXPProgress(user.xp || 0);

  const displayUsername = document.getElementById('displayUsername');
  const displayCoins = document.getElementById('displayCoins');
  const xpLevel = document.getElementById('xpLevel');
  const xpCurrent = document.getElementById('xpCurrent');
  const xpNeeded = document.getElementById('xpNeeded');
  const xpBarFill = document.getElementById('xpBarFill');
  const avatarDisplay = document.getElementById('avatarDisplay');

  if (displayUsername) displayUsername.textContent = username;
  if (displayCoins) displayCoins.textContent = `💰 ${Number(user.coins || 0)}`;
  if (xpLevel) xpLevel.textContent = xpInfo.level;
  if (xpCurrent) xpCurrent.textContent = xpInfo.currentLevelXP;
  if (xpNeeded) xpNeeded.textContent = xpInfo.nextLevelXP - ((xpInfo.level - 1) * 500);
  if (xpBarFill) xpBarFill.style.width = `${xpInfo.percent}%`;
  if (avatarDisplay) avatarDisplay.textContent = getAvatarEmoji(user.skin || 'default');
}

function renderProfile() {
  const container = document.getElementById('profileContent');
  if (!container || !user) return;

  const level = getLevelFromXP(user.xp || 0);
  const xpInfo = getXPProgress(user.xp || 0);

  const achievementsTotal = Object.keys(user.logros || {}).length;

  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${getAvatarEmoji(user.skin || 'default')}</div>
      <div class="profile-info">
        <h3>${user.username || getCurrentUserName() || 'Usuario'}</h3>
        <p>Nivel: ${level}</p>
        <p>XP: ${user.xp || 0} / ${xpInfo.nextLevelXP}</p>
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

function renderThemeButtons() {
  const container = document.getElementById('themesContainer');
  if (!container) return;

  const activeTheme = localStorage.getItem('background') || 'ciudad';
  container.innerHTML = THEMES.map(theme => `
    <button class="theme-option ${activeTheme === theme.id ? 'active' : ''}" data-theme="${theme.id}" title="${theme.name}">
      <div style="
        width:100%; height:100%;
        background: linear-gradient(135deg, ${theme.id === 'ciudad' ? '#1d4ed8, #0f172a' : theme.id === 'galaxia' ? '#312e81, #111827' : theme.id === 'parque' ? '#166534, #14532d' : theme.id === 'fondo1' ? '#1f2937, #0f766e' : '#7c3aed, #0f172a'});
      "></div>
    </button>
  `).join('');

  container.querySelectorAll('.theme-option').forEach(button => {
    button.addEventListener('click', () => {
      const theme = button.dataset.theme;
      setBodyTheme(theme);
      renderThemeButtons();
    });
  });
}

function renderConfig() {
  const musicText = document.getElementById('musicStatusText');
  const toggleButton = document.getElementById('toggleMusicBtnConfig');

  if (musicText) {
    musicText.textContent = `Estado: ${musicEnabled ? 'Activada' : 'Desactivada'}`;
  }

  if (toggleButton) {
    toggleButton.textContent = musicEnabled ? 'Pausar Música' : 'Activar Música';
  }
}

async function loadUserData() {
  const username = getCurrentUserName();
  if (!username) {
    window.location.href = 'auth.html';
    return;
  }

  const userRef = doc(db, 'users', username);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
    return;
  }

  user = {
    username,
    ...DEFAULT_USER,
    ...userSnap.data()
  };

  setBodyTheme(localStorage.getItem('background') || 'ciudad');
  renderHeader();
  renderProfile();
  renderConfig();
  renderThemeButtons();
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });

  const target = document.getElementById(`${sectionId}Section`);
  if (target) {
    target.classList.remove('hidden');
  }
}

function bindMenuButtons() {
  document.querySelectorAll('.menu-btn').forEach(button => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;
      if (!page) return;
      showSection(page);
      if (page === 'profile') renderProfile();
      if (page === 'config') renderConfig();
    });
  });
}

function bindLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
  });
}

function bindConfigMusic() {
  const toggleButton = document.getElementById('toggleMusicBtnConfig');
  const bgMusic = document.getElementById('bgMusic');

  if (!toggleButton || !bgMusic) return;

  toggleButton.addEventListener('click', async () => {
    try {
      const theme = localStorage.getItem('background') || 'ciudad';
      const tracks = {
        ciudad: 'ciudad.mp3',
        galaxia: 'galaxia.mp3',
        parque: 'parque.mp3',
        fondo1: 'bosque.mp3',
        fondo2: 'neon.mp3'
      };

      bgMusic.src = tracks[theme] || 'ciudad.mp3';

      if (!musicEnabled) {
        await bgMusic.play();
        musicEnabled = true;
      } else {
        bgMusic.pause();
        musicEnabled = false;
      }

      renderConfig();
    } catch (error) {
      console.warn('No se pudo controlar la música:', error);
      musicEnabled = false;
      renderConfig();
    }
  });
}

async function saveUserData() {
  if (!user) return;
  const username = getCurrentUserName();
  if (!username) return;

  const userRef = doc(db, 'users', username);
  await setDoc(userRef, user, { merge: true });
  renderHeader();
  renderProfile();
}

window.saveUserData = saveUserData;
window.showSection = showSection;
window.renderProfile = renderProfile;
window.setBodyTheme = setBodyTheme;
window.getAvatarEmoji = getAvatarEmoji;

async function initMenu() {
  bindMenuButtons();
  bindLogoutButton();
  bindConfigMusic();
  renderThemeButtons();
  await loadUserData();
}

initMenu();
