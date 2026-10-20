import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

function buildFriendsHTML(list) {
  if (!list || !list.length) {
    return `
      <div class="friend-item empty">
        <span>No hay amigos aún</span>
        <button class="btn-small" type="button">Añadir</button>
      </div>
    `;
  }

  const currentFriends = Array.isArray(user?.friends) ? user.friends : [];

  return list.map(friend => {
    const username = friend.username || friend.name || 'Usuario';
    const isFriend = currentFriends.includes(username);

    return `
      <div class="friend-item">
        <div class="friend-main">
          <strong>${username}</strong>
          <div class="friend-xp">XP ${friend.xp || 0}</div>
        </div>
        <div class="friend-actions">
          ${isFriend ? '<button class="btn-small btn-friend" type="button">Amigos</button>' : `<button class="btn-small" type="button" onclick="window.addFriend('${username}')">Añadir</button>`}
          ${isFriend ? `<button class="btn-battle" type="button" onclick="window.challengeFriend('${username}')">Batalla</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
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
    <div class="search-panel">
      <div class="search-box">
        <input id="friendSearchInput" type="text" placeholder="Buscar amigo..." />
        <button class="btn-small" type="button" onclick="window.filterFriends()">Buscar</button>
      </div>
      <div class="friends-list">
        ${buildFriendsHTML(friends.slice(0, 8))}
      </div>
    </div>
    <div class="search-panel">
      <div class="search-box">
        <input id="friendSearchInput2" type="text" placeholder="Buscar..." />
        <button class="btn-small" type="button" onclick="window.filterFriendsSecondary()">Buscar</button>
      </div>
      <div class="friends-list">
        ${buildFriendsHTML(friends.slice(0, 8))}
      </div>
    </div>
  `;

  const bindFriendSearch = (inputId, filterFn) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', () => {
      const value = input.value.toLowerCase();
      const list = friends.filter(f => (f.username || '').toLowerCase().includes(value));
      const listContainer = input.closest('.search-panel')?.querySelector('.friends-list');
      if (listContainer) listContainer.innerHTML = buildFriendsHTML(list.slice(0, 8));
      filterFn?.(value);
    });
  };

  bindFriendSearch('friendSearchInput');
  bindFriendSearch('friendSearchInput2');
}

window.addFriend = async function (friendUsername) {
  if (!user || !friendUsername) return;
  const currentUserName = safeGetCurrentUser();
  if (!currentUserName || friendUsername === currentUserName) return;

  try {
    const targetRef = doc(db, 'users', friendUsername);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) {
      alert('Ese usuario no existe.');
      return;
    }

    const currentFriends = Array.isArray(user.friends) ? user.friends : [];
    const targetData = targetSnap.data() || {};
    const targetFriends = Array.isArray(targetData.friends) ? targetData.friends : [];

    if (currentFriends.includes(friendUsername) || targetFriends.includes(currentUserName)) {
      alert('Ya son amigos.');
      await showFriendsList();
      return;
    }

    user.friends = [...new Set([...currentFriends, friendUsername])];
    const updatedTarget = {
      ...targetData,
      friends: [...new Set([...targetFriends, currentUserName])]
    };

    await setDoc(doc(db, 'users', currentUserName), user, { merge: true });
    await setDoc(targetRef, updatedTarget, { merge: true });

    alert(`¡Ahora eres amigo de ${friendUsername}!`);
    await showFriendsList();
  } catch (error) {
    console.error('Error al añadir amigo:', error);
    alert('No se pudo añadir al amigo.');
  }
};

window.challengeFriend = function (friendUsername) {
  if (!friendUsername) return;
  showSection('battles');
  const container = document.getElementById('battlesContent');
  if (!container) return;
  container.innerHTML = `
    <div class="battle-friend-banner">
      <strong>${friendUsername}</strong>
      <p>Tu amigo ya está listo para una batalla.</p>
      <button class="btn-small btn-battle" type="button" onclick="window.startQuickBattle('${friendUsername}')">Desafiar</button>
    </div>
  `;
};

window.startQuickBattle = async function (friendUsername) {
  const currentUserName = safeGetCurrentUser();
  if (!currentUserName || !friendUsername) return;
  const duelId = `duel_${currentUserName}_${friendUsername}_${Date.now()}`;

  try {
    await setDoc(doc(db, 'duels', duelId), {
      player1: currentUserName,
      player2: friendUsername,
      player1Score: 0,
      player2Score: 0,
      bet: 10,
      status: 'pending',
      timestamp: Date.now(),
      winner: null,
      finishedAt: null
    });
    alert(`¡Batalla creada contra ${friendUsername}!`);
    showSection('battles');
    await showBattlesPanel();
  } catch (error) {
    console.error('Error creando batalla:', error);
    alert('No se pudo crear la batalla.');
  }
};

window.filterFriends = function () {
  const input = document.getElementById('friendSearchInput');
  if (!input) return;
  const value = input.value.toLowerCase();
  const container = input.closest('.search-panel')?.querySelector('.friends-list');
  if (!container) return;

  const currentList = (user?.friends || []).map(friend => ({ username: friend, xp: 0 }));
  const merged = [...currentList, ...FALLBACK_FRIENDS];
  const filtered = merged.filter(friend => (friend.username || '').toLowerCase().includes(value));
  container.innerHTML = buildFriendsHTML(filtered.slice(0, 8));
};

window.filterFriendsSecondary = function () {
  const input = document.getElementById('friendSearchInput2');
  if (!input) return;
  const value = input.value.toLowerCase();
  const container = input.closest('.search-panel')?.querySelector('.friends-list');
  if (!container) return;

  loadFriendsFromFirebase().then(friends => {
    const filtered = friends.filter(friend => (friend.username || '').toLowerCase().includes(value));
    container.innerHTML = buildFriendsHTML(filtered.slice(0, 8));
  });
};

function showSkillsPanel() {
  const statsContainer = document.getElementById('skillsStats');
  if (!statsContainer || !user) return;

  const skills = user.skills || { algebra: 0, geometry: 0, speed: 0, precision: 0, infinity: 0 };
  const skillMeta = [
    { key: 'algebra', label: 'Álgebra', value: skills.algebra || 0, max: 10, color: '#4c90ff' },
    { key: 'geometry', label: 'Geometría', value: skills.geometry || 0, max: 10, color: '#7c5cff' },
    { key: 'speed', label: 'Velocidad', value: skills.speed || 0, max: 10, color: '#4cff90' },
    { key: 'precision', label: 'Precisión', value: skills.precision || 0, max: 10, color: '#ffd166' },
    { key: 'infinity', label: 'Infinito', value: skills.infinity || 0, max: 10, color: '#ff7a7a' }
  ];

  statsContainer.innerHTML = skillMeta.map(skill => `
    <div class="skill-card">
      <div class="skill-head">
        <span>${skill.label}</span>
        <strong>${skill.value}/${skill.max}</strong>
      </div>
      <div class="skill-bar">
        <span class="skill-fill" style="width:${(skill.value/skill.max)*100}%; background:${skill.color};"></span>
      </div>
    </div>
  `).join('');

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

async function showBattlesPanel() {
  const container = document.getElementById('battlesContent');
  if (!container || !user) return;

  try {
    const currentUserName = safeGetCurrentUser();
    const querySnapshot = await getDocs(collection(db, 'duels'));
    const myBattles = [];

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data() || {};
      const isMatch = (data.player1 === currentUserName || data.player2 === currentUserName) && data.status === 'finished';
      if (isMatch) {
        myBattles.push({
          id: docSnap.id,
          ...data,
          result: data.winner === currentUserName ? 'victoria' : (data.winner && data.winner !== 'draw' ? 'derrota' : 'empate')
        });
      }
    });

    myBattles.sort((a, b) => (b.finishedAt || b.timestamp || 0) - (a.finishedAt || a.timestamp || 0));

    if (!myBattles.length) {
      container.innerHTML = `
        <div style="padding: 24px 18px; text-align:center; background: rgba(20,28,54,0.75); border-radius: 18px; border: 1px solid rgba(76,144,255,0.2); color:#dfe8ff; opacity:0.8;">
          Aún no tienes batallas finalizadas.
        </div>
      `;
      return;
    }

    container.innerHTML = myBattles.map(item => {
      const opponent = item.player1 === currentUserName ? item.player2 : item.player1;
      const statusLabel = item.result === 'victoria' ? 'Victoria' : item.result === 'derrota' ? 'Derrota' : 'Empate';
      const badgeColor = item.result === 'victoria' ? '#4cff90' : item.result === 'derrota' ? '#ff7a7a' : '#ffd166';
      const scoreText = item.player1Score != null && item.player2Score != null ? `${item.player1Score} - ${item.player2Score}` : 'Sin marcador';
      const formattedDate = item.finishedAt ? new Date(item.finishedAt).toLocaleString() : new Date(item.timestamp || Date.now()).toLocaleString();

      return `
        <div style="margin-bottom: 14px; padding: 16px; border-radius: 14px; background: rgba(12,18,35,0.8); border: 1px solid rgba(76,144,255,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <strong style="color:#fff;">${opponent}</strong>
            <span style="background:${badgeColor}; color:#091525; border-radius:999px; padding:4px 10px; font-size: 11px; font-weight:700;">${statusLabel}</span>
          </div>
          <div style="color:#dfe8ff; opacity:0.85; margin-bottom: 6px;">Marcador: ${scoreText}</div>
          <div style="color:#dfe8ff; opacity:0.75; font-size: 12px;">Apuesta: ${item.bet || 0} 💰 • ${formattedDate}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error cargando batallas:', error);
    container.innerHTML = '<div style="padding:18px; text-align:center; color:#fff;">No se pudieron cargar las batallas.</div>';
  }
}

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
window.showAddFriends = showFriendsList;
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
