import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAllAchievements } from './achievements.js';

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
  friends: [],
  friendRequests: [],
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

const FALLBACK_FRIENDS = [
  { username: 'Marta', xp: 1200 },
  { username: 'Lucas', xp: 950 },
  { username: 'Nina', xp: 1450 },
  { username: 'Dani', xp: 880 },
  { username: 'Ari', xp: 1700 }
];

let user = null;
let musicEnabled = false;
let stopBattleListeners = [];
let visibleInviteId = null;

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
  const themeData = [
    { id: 'ciudad', name: 'Ciudad', image: 'ciudad.jpg' },
    { id: 'galaxia', name: 'Galaxia', image: 'galaxia.jpg' },
    { id: 'parque', name: 'Parque', image: 'parque.jpg' },
    { id: 'fondo1', name: 'Bosque', image: 'bosque.jpg' },
    { id: 'fondo2', name: 'Neón', image: 'neon.jpg' }
  ];

  container.innerHTML = themeData.map(theme => `
    <button class="theme-option ${activeTheme === theme.id ? 'active' : ''}" data-theme="${theme.id}" title="${theme.name}">
      <div class="theme-thumb" style="background-image: url('${theme.image}');"></div>
      <span>${theme.name}</span>
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function setFriendsTab(activeTab) {
  document.querySelectorAll('.friends-tabs .tab-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === activeTab);
  });
}

function buildFriendsHTML(list, mode = 'list') {
  if (!list || !list.length) {
    return `<div class="friend-item empty"><span>${mode === 'list' ? 'Aún no tienes amigos.' : 'No se encontraron usuarios.'}</span></div>`;
  }

  return list.map(friend => {
    const username = friend.username || friend.name || 'Usuario';
    const safeUsername = escapeHtml(username);
    const xp = Number(friend.xp || 0);
    const action = mode === 'list'
      ? `<button class="btn-battle" type="button" onclick="window.challengeFriend('${safeUsername}')">Desafiar</button>`
      : `<button class="btn-small" type="button" onclick="window.addFriend('${safeUsername}')">Añadir</button>`;

    return `
      <div class="friend-item">
        <div class="friend-main">
          <strong>${safeUsername}</strong>
          <div class="friend-xp">XP ${xp}</div>
        </div>
        <div class="friend-actions">${action}</div>
      </div>
    `;
  }).join('');
}

async function loadFriendsFromFirebase() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnap.forEach(docSnap => {
      if (docSnap.id !== safeGetCurrentUser()) users.push({ username: docSnap.id, ...docSnap.data() });
    });
    return users;
  } catch (error) {
    console.warn('No se pudieron cargar los usuarios desde Firebase:', error);
    return [];
  }
}

function renderFriendsPanel(title, inputId, list, mode) {
  const container = document.getElementById('friendsContent');
  if (!container) return;
  setFriendsTab(mode === 'list' ? 'list' : 'add');
  container.innerHTML = `
    <div class="friends-panel">
      <div class="friends-panel-title">${title}</div>
      ${mode === 'add' ? `<div class="search-box">
        <input id="${inputId}" type="search" placeholder="Buscar por nombre..." autocomplete="off" />
        <button class="btn-small" type="button" onclick="window.filterFriends()">Buscar</button>
      </div>` : ''}
      <div id="${mode === 'add' ? 'allUsersList' : 'myFriendsList'}" class="friends-list">
        ${buildFriendsHTML(list, mode)}
      </div>
    </div>
  `;
  if (mode === 'add') {
    const input = document.getElementById(inputId);
    input?.addEventListener('input', () => window.filterFriends());
  }
}

async function showFriendsList() {
  const allUsers = await loadFriendsFromFirebase();
  const friendNames = new Set(Array.isArray(user?.friends) ? user.friends : []);
  const friends = allUsers.filter(friend => friendNames.has(friend.username));
  renderFriendsPanel('Tus amigos', 'friendSearchInput', friends, 'list');
}

async function showAddFriends() {
  const allUsers = await loadFriendsFromFirebase();
  const friendNames = new Set(Array.isArray(user?.friends) ? user.friends : []);
  const candidates = allUsers.filter(friend => !friendNames.has(friend.username));
  renderFriendsPanel('Añadir un amigo', 'friendSearchInput', candidates, 'add');
}

window.addFriend = async function (friendUsername) {
  if (!user || !friendUsername) return;
  const currentUserName = safeGetCurrentUser();
  if (!currentUserName || friendUsername === currentUserName) return;

  try {
    const targetRef = doc(db, 'users', friendUsername);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) { alert('Ese usuario no existe.'); return; }

    const currentFriends = Array.isArray(user.friends) ? user.friends : [];
    const targetData = targetSnap.data() || {};
    const targetFriends = Array.isArray(targetData.friends) ? targetData.friends : [];
    if (currentFriends.includes(friendUsername)) { alert('Ya son amigos.'); return; }

    user.friends = [...new Set([...currentFriends, friendUsername])];
    await setDoc(doc(db, 'users', currentUserName), user, { merge: true });
    await setDoc(targetRef, { ...targetData, friends: [...new Set([...targetFriends, currentUserName])] }, { merge: true });
    alert(`¡${friendUsername} se agregó a tus amigos!`);
    await showFriendsList();
  } catch (error) {
    console.error('Error al añadir amigo:', error);
    alert('No se pudo añadir al amigo.');
  }
};

window.challengeFriend = function (friendUsername) {
  const container = document.getElementById('friendsContent');
  if (!container || !friendUsername) return;
  document.getElementById('challengeComposer')?.remove();
  const composer = document.createElement('div');
  composer.id = 'challengeComposer';
  composer.className = 'challenge-composer';
  composer.innerHTML = `
    <div><strong>Desafiar a ${escapeHtml(friendUsername)}</strong><p>Elige la cantidad de monedas de la apuesta.</p></div>
    <div class="challenge-form">
      <input id="challengeBetInput" type="number" min="10" step="1" value="10" aria-label="Cantidad de monedas" />
      <button class="btn-battle" type="button" onclick="window.startQuickBattle('${escapeHtml(friendUsername)}')">Enviar desafío</button>
      <button class="btn-small" type="button" onclick="document.getElementById('challengeComposer')?.remove()">Cancelar</button>
    </div>
  `;
  container.prepend(composer);
  document.getElementById('challengeBetInput')?.focus();
};

window.startQuickBattle = async function (friendUsername) {
  const currentUserName = safeGetCurrentUser();
  const bet = Number(document.getElementById('challengeBetInput')?.value);
  if (!currentUserName || !friendUsername) return;
  if (!Number.isInteger(bet) || bet < 10) { alert('La apuesta mínima es de 10 monedas.'); return; }
  if (Number(user?.coins || 0) < bet) { alert('No tienes suficientes monedas para esa apuesta.'); return; }

  const duelId = `duel_${currentUserName}_${friendUsername}_${Date.now()}`;
  try {
    await setDoc(doc(db, 'duels', duelId), {
      challenger: currentUserName,
      opponent: friendUsername,
      challengerSkin: user.skin || 'spiderman',
      player1: currentUserName,
      player2: friendUsername,
      p1Score: 0,
      p2Score: 0,
      p1Correct: 0,
      p2Correct: 0,
      p1Wrong: 0,
      p2Wrong: 0,
      player1Score: 0,
      player2Score: 0,
      bet,
      duration: 60,
      status: 'pending',
      timestamp: Date.now(),
      winner: null,
      finishedAt: null
    });
    alert(`¡Desafío enviado por ${bet} monedas!`);
    document.getElementById('challengeComposer')?.remove();
    showSection('battles');
  } catch (error) {
    console.error('Error creando batalla:', error);
    alert('No se pudo crear el desafío.');
  }
};

window.filterFriends = async function () {
  const input = document.getElementById('friendSearchInput');
  const container = document.getElementById('allUsersList');
  if (!input || !container) return;
  const value = input.value.trim().toLowerCase();
  const allUsers = await loadFriendsFromFirebase();
  const friendNames = new Set(Array.isArray(user?.friends) ? user.friends : []);
  const filtered = allUsers.filter(friend => !friendNames.has(friend.username) && friend.username.toLowerCase().includes(value));
  container.innerHTML = buildFriendsHTML(filtered, 'add');
};

window.filterFriendsSecondary = window.filterFriends;

function showSkillsPanel() {
  const statsContainer = document.getElementById('skillsStats');
  if (!statsContainer || !user) return;

  const skills = user.skills || {};
  const skillValue = key => Math.max(0, Math.min(10, Number(skills[key]) || 0));
  const skillMeta = [
    { key: 'algebra', icon: '∑', label: 'Álgebra', desc: 'Ecuaciones y operaciones', value: skillValue('algebra'), max: 10, color: '#4c90ff' },
    { key: 'geometry', icon: '△', label: 'Geometría', desc: 'Formas, áreas y medidas', value: skillValue('geometry'), max: 10, color: '#9b7cff' },
    { key: 'speed', icon: 'ϟ', label: 'Velocidad', desc: 'Respuestas rápidas', value: skillValue('speed'), max: 10, color: '#4cff90' },
    { key: 'precision', icon: '◎', label: 'Precisión', desc: 'Respuestas correctas', value: skillValue('precision'), max: 10, color: '#ffd166' },
    { key: 'infinity', icon: '∞', label: 'Infinito', desc: 'Rachas sin límite', value: skillValue('infinity'), max: 10, color: '#ff7a7a' }
  ];

  statsContainer.innerHTML = skillMeta.map(skill => `
    <div class="skill-card" style="--skill-color:${skill.color}">
      <div class="skill-card-top">
        <span class="skill-icon">${skill.icon}</span>
        <div class="skill-card-name"><strong>${skill.label}</strong><small>${skill.desc}</small></div>
        <strong class="skill-value">${skill.value}/${skill.max}</strong>
      </div>
      <div class="skill-bar">
        <span class="skill-fill" style="width:${(skill.value/skill.max)*100}%; background:${skill.color};"></span>
      </div>
    </div>
  `).join('');
  const total = skillMeta.reduce((sum, skill) => sum + skill.value, 0);
  const totalNode = document.getElementById('skillsTotal');
  if (totalNode) totalNode.textContent = `${total} / 50`;

  const canvas = document.getElementById('skillsRadar');
  if (!canvas) return;

  if (typeof Chart !== 'undefined') {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (canvas.__chart) canvas.__chart.destroy();
      canvas.__chart = new Chart(canvas, {
        type: 'radar',
        data: {
          labels: ['Álgebra', 'Geometría', 'Velocidad', 'Precisión', 'Infinito'],
          datasets: [{
            label: 'Habilidades',
            data: skillMeta.map(skill => Number(skill.value) || 0),
            backgroundColor: 'rgba(76,144,255,0.25)',
            borderColor: '#4c90ff',
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#4c90ff',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              suggestedMin: 0,
              suggestedMax: 10,
              pointLabels: { color: '#e8eaff', font: { family: 'Rajdhani' } },
              grid: { color: 'rgba(255,255,255,0.1)' },
              angleLines: { color: 'rgba(255,255,255,0.08)' }
            }
          },
          plugins: {
            legend: { labels: { color: '#e8eaff' } }
          }
        }
      });
    }
  }
}

function renderAchievementStatsPanel(achievements, unlockedMap) {
  const unlockedCount = achievements.filter(a => unlockedMap[a.id] === true).length;
  const percent = Math.round((unlockedCount / achievements.length) * 100);

  return `
    <div style="margin-bottom: 18px; padding: 16px; background: rgba(20,28,54,0.75); border: 1px solid rgba(76,144,255,0.25); border-radius: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
        <strong style="color:#fff;">Progreso</strong>
        <span style="color:#4c90ff; font-weight:700;">${unlockedCount}/${achievements.length}</span>
      </div>
      <div style="height:12px; border-radius: 999px; overflow:hidden; background: rgba(255,255,255,0.08);">
        <div style="width:${percent}%; height:100%; background: linear-gradient(90deg, #4c90ff, #4cff90); border-radius: 999px;"></div>
      </div>
      <div style="margin-top: 8px; color:#dfe8ff; opacity:0.85;">${percent}% completado</div>
    </div>
  `;
}

function renderAchievementsPanel() {
  const list = document.getElementById('logrosList');
  if (!list || !user) return;

  const achievements = getAllAchievements();
  const unlockedMap = user.logros || {};

  const grouped = {};
  achievements.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const cardsHtml = Object.entries(grouped).map(([category, items]) => {
    const itemsHtml = items.map(item => {
      const unlocked = unlockedMap[item.id] === true;
      return `
        <div style="padding: 12px 14px; border: 1px solid rgba(76,144,255,0.2); background: ${unlocked ? 'rgba(76,144,255,0.12)' : 'rgba(15,23,42,0.8)'}; border-radius: 12px; opacity: ${unlocked ? 1 : 0.72};">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <span style="font-size:26px;">${item.icon}</span>
            <div style="flex:1;">
              <div style="font-weight:700; color:${unlocked ? '#fff' : '#d9e3ff'};">${item.title}</div>
              <div style="font-size:12px; color:#b9c8ee;">${item.desc}</div>
            </div>
            <span style="font-size: 18px;">${unlocked ? '✅' : '🔒'}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 18px;">
        <h3 style="margin: 0 0 12px; color:#4c90ff; text-transform:uppercase; letter-spacing:1px; font-size:13px;">${category}</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');

  list.innerHTML = `
    <div style="padding: 18px; border-radius: 20px; background: rgba(10,17,33,0.7); border: 1px solid rgba(76,144,255,0.2);">
      ${renderAchievementStatsPanel(achievements, unlockedMap)}
      ${cardsHtml}
    </div>
  `;
}

async function showRankingPanel() {
  const podium = document.getElementById('rankingPodium');
  const list = document.getElementById('rankingList');
  if (!podium || !list) return;

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const ranking = [];
    usersSnap.forEach(docSnap => {
      const data = docSnap.data() || {};
      ranking.push({
        username: docSnap.id,
        xp: Number(data.xp || 0),
        coins: Number(data.coins || 0)
      });
    });

    const currentUserName = user?.username || safeGetCurrentUser() || 'Tú';
    const currentIndex = ranking.findIndex(entry => entry.username === currentUserName);
    if (currentIndex === -1) {
      ranking.push({ username: currentUserName, xp: Number(user?.xp || 0), coins: Number(user?.coins || 0) });
    }

    const sorted = ranking.sort((a, b) => b.xp - a.xp || b.coins - a.coins);
    const topThree = sorted.slice(0, 3);

    podium.innerHTML = `
      <div class="podium-item silver">#2<br>${topThree[1]?.username || '—'}</div>
      <div class="podium-item gold">#1<br>${topThree[0]?.username || '—'}</div>
      <div class="podium-item bronze">#3<br>${topThree[2]?.username || '—'}</div>
    `;

    list.innerHTML = sorted.map((entry, index) => `
      <div class="rank-row ${entry.username === currentUserName ? 'me' : ''}">
        <span>#${index + 1} ${entry.username}</span>
        <span>${entry.xp} XP</span>
      </div>
    `).slice(0, 10).join('');
  } catch (error) {
    console.error('Error cargando ranking:', error);
    podium.innerHTML = '<div class="podium-item gold">#1<br>Sin datos</div>';
    list.innerHTML = '<div class="rank-row"><span>Ranking no disponible</span></div>';
  }
}

function renderBattleInvite(item) {
  const modal = document.getElementById('receiveInviteModal');
  if (!modal || !item) return;
  visibleInviteId = item.id;
  document.getElementById('challengerName').textContent = item.challenger || item.player1 || 'Jugador';
  document.getElementById('challengerBet').textContent = Number(item.bet || 0);
  document.getElementById('challengerDuration').textContent = Number(item.duration || 60);
  modal.classList.remove('hidden');
  const accept = document.getElementById('acceptBattleBtn');
  const decline = document.getElementById('declineBattleBtn');
  if (accept) accept.onclick = () => window.acceptBattle(item.id);
  if (decline) decline.onclick = () => window.declineBattle(item.id);
}

function hideBattleInvite() {
  document.getElementById('receiveInviteModal')?.classList.add('hidden');
  visibleInviteId = null;
}

function startBattleRealtimeListeners() {
  stopBattleListeners.forEach(stop => stop());
  stopBattleListeners = [];
  const currentUserName = safeGetCurrentUser();
  if (!currentUserName) return;

  const incomingQuery = query(collection(db, 'duels'), where('opponent', '==', currentUserName));
  stopBattleListeners.push(onSnapshot(incomingQuery, snapshot => {
    const pending = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() || {};
      if (data.status === 'pending') pending.push({ id: docSnap.id, ...data });
    });
    pending.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (pending[0]) renderBattleInvite(pending[0]);
    else hideBattleInvite();
  }, error => console.warn('No se pudieron escuchar invitaciones:', error)));

  const outgoingQuery = query(collection(db, 'duels'), where('challenger', '==', currentUserName));
  stopBattleListeners.push(onSnapshot(outgoingQuery, snapshot => {
    snapshot.forEach(docSnap => {
      const data = docSnap.data() || {};
      if (data.status === 'active' && !window.location.pathname.endsWith('game.html')) {
        window.openBattle(docSnap.id);
      }
    });
  }, error => console.warn('No se pudo sincronizar la aceptación:', error)));
}

async function showBattlesPanel() {
  const container = document.getElementById('battlesContent');
  if (!container || !user) return;
  const currentUserName = safeGetCurrentUser();
  try {
    const snapshot = await getDocs(collection(db, 'duels'));
    const pendingOutgoing = [], active = [], finished = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() || {};
      const challenger = data.challenger || data.player1;
      const opponent = data.opponent || data.player2;
      const item = { id: docSnap.id, ...data, challenger, opponent };
      if (data.status === 'pending' && challenger === currentUserName) pendingOutgoing.push(item);
      else if (data.status === 'active' && (challenger === currentUserName || opponent === currentUserName)) active.push(item);
      else if (data.status === 'finished' && (challenger === currentUserName || opponent === currentUserName)) finished.push(item);
    });
    finished.sort((a, b) => (b.finishedAt || b.timestamp || 0) - (a.finishedAt || a.timestamp || 0));

    const outgoingHtml = pendingOutgoing.map(item => `<div class="battle-status-card">Esperando respuesta de <strong>${escapeHtml(item.opponent)}</strong> · Apuesta: ${Number(item.bet || 0)} 💰</div>`).join('');
    const activeHtml = active.map(item => {
      const opponent = item.challenger === currentUserName ? item.opponent : item.challenger;
      return `<div class="battle-status-card"><div>Batalla activa contra <strong>${escapeHtml(opponent)}</strong> · Apuesta: ${Number(item.bet || 0)} 💰</div><button class="btn-battle" onclick="window.openBattle('${item.id}')">Continuar batalla</button></div>`;
    }).join('');
    const historyHtml = finished.length ? finished.map(item => {
      const opponent = item.challenger === currentUserName ? item.opponent : item.challenger;
      const myScore = item.challenger === currentUserName ? Number(item.p1Score ?? item.player1Score ?? 0) : Number(item.p2Score ?? item.player2Score ?? 0);
      const opponentScore = item.challenger === currentUserName ? Number(item.p2Score ?? item.player2Score ?? 0) : Number(item.p1Score ?? item.player1Score ?? 0);
      const result = item.winner === currentUserName ? 'Victoria' : item.winner === 'draw' ? 'Empate' : item.winner ? 'Derrota' : (myScore === opponentScore ? 'Empate' : myScore > opponentScore ? 'Victoria' : 'Derrota');
      const color = result === 'Victoria' ? '#4cff90' : result === 'Derrota' ? '#ff7a7a' : '#ffd166';
      return `<div class="battle-history-card"><div><strong>${escapeHtml(opponent)}</strong><span class="battle-result" style="color:${color}">${result}</span></div><div>Marcador: ${myScore} - ${opponentScore}</div><small>Apuesta: ${Number(item.bet || 0)} 💰 · ${new Date(item.finishedAt || item.timestamp).toLocaleString()}</small></div>`;
    }).join('') : '<div class="battle-empty">Aún no tienes batallas finalizadas.</div>';

    container.innerHTML = `<div class="battle-history">
      ${outgoingHtml ? `<h3>Desafíos enviados</h3>${outgoingHtml}` : ''}
      ${activeHtml ? `<h3>Batallas activas</h3>${activeHtml}` : ''}
      <h3>Historial de batallas</h3>${historyHtml}
    </div>`;
  } catch (error) {
    console.error('Error cargando batallas:', error);
    container.innerHTML = '<div class="battle-empty">No se pudieron cargar las batallas.</div>';
  }
}

window.acceptBattle = async function (duelId) {
  try {
    hideBattleInvite();
    await setDoc(doc(db, 'duels', duelId), {
      status: 'active',
      opponentSkin: user?.skin || 'spiderman',
      startTime: Date.now() + 5000,
      preparationDuration: 5,
      duration: 60
    }, { merge: true });
    localStorage.setItem('activeDuel', duelId);
    window.location.href = 'game.html?mode=battle';
  } catch (error) { console.error(error); alert('No se pudo aceptar la batalla.'); }
};
window.openBattle = function (duelId) {
  localStorage.setItem('activeDuel', duelId);
  window.location.href = 'game.html?mode=battle';
};
window.declineBattle = async function (duelId) {
  try { hideBattleInvite(); await setDoc(doc(db, 'duels', duelId), { status: 'declined', finishedAt: Date.now() }, { merge: true }); await showBattlesPanel(); }
  catch (error) { console.error(error); alert('No se pudo rechazar la batalla.'); }
};

window.showTienda = function () {
  if (!user) return;
  ensurePowerState();

  const container = document.getElementById('tiendaPoderes');
  if (!container) return;

  container.innerHTML = [
    { id: 'double', name: 'Doble', icon: '✖️', desc: 'Duplica tus puntos.', cost: 35 },
    { id: 'fifty', name: '50%', icon: '🎯', desc: 'Reduce la cuenta a la mitad.', cost: 45 },
    { id: 'light', name: 'Luz', icon: '⚡', desc: 'Poder de ayuda rápida.', cost: 30 }
  ].map(power => {
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
    const btnClass = owned ? (selected ? 'avatar-btn equiped' : 'avatar-btn equip') : 'avatar-btn buy';

    return `
      <div class="avatar-option ${selected ? 'selected' : ''}">
        <img src="${getAvatarSrc(avatar.id)}" class="avatar-choice-img" onerror="this.src='spiderman.png'" alt="${avatar.name}">
        <div class="avatar-name">${avatar.name}</div>
        <button class="${btnClass}" onclick="${owned ? `window.selectAvatar('${avatar.id}')` : `window.buyAvatar('${avatar.id}')`}">
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
  user.friends = Array.isArray(user.friends) ? user.friends : [];
  user.friendRequests = Array.isArray(user.friendRequests) ? user.friendRequests : [];
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

    if (!Array.isArray(user.skins) || user.skins.length === 0) user.skins = ['spiderman'];
    if (!Array.isArray(user.friends)) user.friends = [];
    if (!Array.isArray(user.friendRequests)) user.friendRequests = [];
    if (!user.skin) user.skin = 'spiderman';

    startBattleRealtimeListeners();
    setBodyTheme(localStorage.getItem('background') || 'ciudad');
    renderHeader();
    renderProfile();
    showSkillsPanel();
    showRankingPanel();
    renderAchievementsPanel();
    showBattlesPanel();
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
  if (sectionName === 'logros') renderAchievementsPanel();
  if (sectionName === 'avatar') window.showAvatarEditor();
  if (sectionName === 'friends') showFriendsList();
  if (sectionName === 'battles') showBattlesPanel();
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
window.showLogros = renderAchievementsPanel;
window.showBattlesPanel = showBattlesPanel;
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
  await loadCurrentUserData();
  showSection('profile');
}

initMenu();

export { loadCurrentUserData, saveUser, getAvatarSrc, getAvatarEmoji, user };
