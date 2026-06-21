import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, onSnapshot, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
var activeBattleInvite = null;
var battleTimerInterval = null;

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
  if (!user.friends) user.friends = [];
  
  await checkAllAchievements(user, userRef);
  initMenu();
  listenForInvites();
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

function updateXPBar() {
  const level = calculateLevel(user.xp);
  const xpCurrentLevel = user.xp % 500;
  const percentage = (xpCurrentLevel / 500) * 100;

  const xpLevelEl = document.getElementById('xpLevel');
  const xpCurrentEl = document.getElementById('xpCurrent');
  const xpNeededEl = document.getElementById('xpNeeded');
  const xpBarFillEl = document.getElementById('xpBarFill');

  if (xpLevelEl) xpLevelEl.textContent = level;
  if (xpCurrentEl) xpCurrentEl.textContent = xpCurrentLevel;
  if (xpNeededEl) xpNeededEl.textContent = '500';
  if (xpBarFillEl) xpBarFillEl.style.width = percentage + '%';
}

function initMenu() {
  const level = calculateLevel(user.xp);
  const displayUsername = document.getElementById('displayUsername');
  const displayCoins = document.getElementById('displayCoins');

  if (displayUsername) displayUsername.textContent = currentUser + ` (Nivel ${level})`;
  if (displayCoins) displayCoins.textContent = '💰 ' + user.coins;

  var initSkin = user.skin || 'spiderman';
  const avatarDisplay = document.getElementById('avatarDisplay');
  if (avatarDisplay) avatarDisplay.innerHTML = `<img src="${getAvatarSrc(initSkin)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;

  var savedBg = localStorage.getItem('background') || 'ciudad';
  document.body.className = savedBg;
  updateXPBar();

  // --- NAVEGACIÓN ---
  var menuBtns = document.querySelectorAll('.menu-btn');
  menuBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      var page = this.dataset.page;
      document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
      if (page === 'game') window.location.href = 'game.html';
      else if (page === 'profile') { document.getElementById('profileSection').classList.remove('hidden'); showProfile(currentUser); }
      else if (page === 'friends') { document.getElementById('friendsSection').classList.remove('hidden'); showFriendsList(); }
      else if (page === 'battles') { document.getElementById('battlesSection').classList.remove('hidden'); showBattles(); }
      else if (page === 'skills') { document.getElementById('skillsSection').classList.remove('hidden'); showSkills(); }
      else if (page === 'ranking') { document.getElementById('rankingSection').classList.remove('hidden'); showRanking(); }
      else if (page === 'tienda') { document.getElementById('tiendaSection').classList.remove('hidden'); showTienda(); }
      else if (page === 'avatar') { document.getElementById('avatarSection').classList.remove('hidden'); showAvatarEditor(); }
      else if (page === 'logros') { document.getElementById('logrosSection').classList.remove('hidden'); showLogros(); }
      else if (page === 'config') { document.getElementById('configSection').classList.remove('hidden'); showThemes(); }
    });
  });

  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  };
}

// --- PERFIL ---
async function showProfile(username) {
  const targetRef = doc(db, 'users', username);
  const snap = await getDoc(targetRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const level = calculateLevel(data.xp || 0);
  const stats = data.stats || { facil: 0, normal: 0, dificil: 0, experto: 0, infinito: 0 };

  let html = `
    <div class="profile-header">
      <img src="${getAvatarSrc(data.skin || 'spiderman')}" class="profile-avatar">
      <div class="profile-info">
        <h3>${username}</h3>
        <p>Nivel ${level} • ${data.xp || 0} XP</p>
        <p>💰 ${data.coins || 0} monedas</p>
      </div>
    </div>
    <div class="profile-stats-grid">
      <div class="stat-item"><span>Fácil:</span> <span>${stats.facil}</span></div>
      <div class="stat-item"><span>Normal:</span> <span>${stats.normal}</span></div>
      <div class="stat-item"><span>Difícil:</span> <span>${stats.dificil}</span></div>
      <div class="stat-item"><span>Experto:</span> <span>${stats.experto}</span></div>
      <div class="stat-item"><span>Infinito:</span> <span>${stats.infinito}</span></div>
    </div>
  `;
  document.getElementById('profileContent').innerHTML = html;
}

// --- AMIGOS ---
window.showFriendsList = () => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  
  if (!user.friends || user.friends.length === 0) {
    document.getElementById('friendsContent').innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px;">No tienes amigos aún.</p>';
    return;
  }

  let html = '<div class="friends-list">';
  user.friends.forEach(f => {
    html += `
      <div class="friend-item" onclick="showProfile('${f}')">
        <span>👤 ${f}</span>
        <button class="btn-small" onclick="event.stopPropagation(); window.startBattleInvite('${f}')">⚔️ Desafiar</button>
      </div>`;
  });
  html += '</div>';
  document.getElementById('friendsContent').innerHTML = html;
};

window.showAddFriends = () => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[1].classList.add('active');

  document.getElementById('friendsContent').innerHTML = `
    <div class="search-box">
      <input type="text" id="searchUser" placeholder="Nombre del usuario...">
      <button class="btn-primary" onclick="window.searchUser()">Buscar</button>
    </div>
    <div id="searchResults"></div>
  `;
};

window.searchUser = async () => {
  const name = document.getElementById('searchUser').value.trim();
  if (!name || name === currentUser) return;

  const targetRef = doc(db, 'users', name);
  const snap = await getDoc(targetRef);
  
  if (snap.exists()) {
    const data = snap.data();
    document.getElementById('searchResults').innerHTML = `
      <div class="friend-item">
        <span>👤 ${name} (Nivel ${calculateLevel(data.xp || 0)})</span>
        <button class="btn-green" onclick="window.addFriend('${name}')">Añadir</button>
      </div>
    `;
  } else {
    document.getElementById('searchResults').innerHTML = '<p>Usuario no encontrado.</p>';
  }
};

window.addFriend = async (name) => {
  if (!user.friends) user.friends = [];
  if (user.friends.includes(name)) { alert('Ya es tu amigo'); return; }
  
  user.friends.push(name);
  await saveUser();
  alert('¡Amigo añadido!');
  window.showFriendsList();
};

// --- BATALLAS (DUELS) ---
function showBattles() {
  if (!user.friends || user.friends.length === 0) {
    document.getElementById('battleFriendsList').innerHTML = '<p>Añade amigos para batallar.</p>';
    return;
  }

  let html = '';
  user.friends.forEach(f => {
    html += `
      <div class="friend-item">
        <span>👤 ${f}</span>
        <button class="btn-primary" onclick="window.startBattleInvite('${f}')">⚔️ Desafiar</button>
      </div>`;
  });
  document.getElementById('battleFriendsList').innerHTML = html;
}

window.startBattleInvite = async (opponent) => {
  const bet = parseInt(prompt('Cantidad a apostar (mínimo 50):', '50'));
  if (isNaN(bet) || bet < 50) { alert('Mínimo 50 monedas'); return; }
  if (user.coins < bet) { alert('No tienes suficientes monedas'); return; }

  const duration = confirm('¿Batalla de 60 segundos? (Cancelar para 30s)') ? 60 : 30;

  const duelId = currentUser + '_' + opponent + '_' + Date.now();
  const duelRef = doc(db, 'duels', duelId);

  const duelData = {
    id: duelId,
    challenger: currentUser,
    opponent: opponent,
    bet: bet,
    duration: duration,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + 60000,
    p1Score: 0,
    p2Score: 0
  };

  await setDoc(duelRef, duelData);
  activeBattleInvite = duelId;
  showInviteModal(opponent, bet, 60);
};

function showInviteModal(opponent, bet, time) {
  document.getElementById('inviteOpponentName').textContent = opponent;
  document.getElementById('inviteBetAmount').textContent = bet;
  document.getElementById('inviteTimer').textContent = time;
  document.getElementById('battleInviteModal').classList.remove('hidden');
  document.getElementById('battlePendingBadge').classList.add('hidden');

  let timeLeft = time;
  if (battleTimerInterval) clearInterval(battleTimerInterval);
  battleTimerInterval = setInterval(async () => {
    timeLeft--;
    document.getElementById('inviteTimer').textContent = timeLeft;
    
    // Verificar si el oponente aceptó
    const snap = await getDoc(doc(db, 'duels', activeBattleInvite));
    if (snap.exists()) {
      const d = snap.data();
      if (d.status === 'accepted') {
        clearInterval(battleTimerInterval);
        localStorage.setItem('activeDuel', activeBattleInvite);
        window.location.href = 'game.html?mode=battle';
      } else if (d.status === 'declined') {
        clearInterval(battleTimerInterval);
        alert('El oponente rechazó el desafío.');
        window.cancelBattleInvite();
      }
    }

    if (timeLeft <= 0) {
      clearInterval(battleTimerInterval);
      window.cancelBattleInvite();
      alert('El tiempo de invitación expiró.');
    }
  }, 1000);
}

window.minimizeBattleInvite = () => {
  document.getElementById('battleInviteModal').classList.add('hidden');
  document.getElementById('battlePendingBadge').classList.remove('hidden');
};

window.restoreBattleInvite = () => {
  document.getElementById('battleInviteModal').classList.remove('hidden');
  document.getElementById('battlePendingBadge').classList.add('hidden');
};

window.cancelBattleInvite = async () => {
  if (activeBattleInvite) {
    await deleteDoc(doc(db, 'duels', activeBattleInvite));
    activeBattleInvite = null;
  }
  clearInterval(battleTimerInterval);
  document.getElementById('battleInviteModal').classList.add('hidden');
  document.getElementById('battlePendingBadge').classList.add('hidden');
};

// --- ESCUCHAR INVITACIONES ENTRANTES ---
function listenForInvites() {
  const q = query(collection(db, 'duels'), where('opponent', '==', currentUser), where('status', '==', 'pending'));
  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const d = change.doc.data();
        showReceiveInvite(d);
      }
    });
  });
}

function showReceiveInvite(duel) {
  document.getElementById('challengerName').textContent = duel.challenger;
  document.getElementById('challengerBet').textContent = duel.bet;
  document.getElementById('challengerDuration').textContent = duel.duration;
  document.getElementById('receiveInviteModal').classList.remove('hidden');

  let timeLeft = 60;
  const timer = setInterval(() => {
    timeLeft--;
    document.getElementById('receiveTimer').textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      document.getElementById('receiveInviteModal').classList.add('hidden');
    }
  }, 1000);

  document.getElementById('acceptBattleBtn').onclick = async () => {
    if (user.coins < duel.bet) { alert('No tienes suficientes monedas'); return; }
    clearInterval(timer);
    await setDoc(doc(db, 'duels', duel.id), { status: 'accepted' }, { merge: true });
    localStorage.setItem('activeDuel', duel.id);
    window.location.href = 'game.html?mode=battle';
  };

  document.getElementById('declineBattleBtn').onclick = async () => {
    clearInterval(timer);
    await setDoc(doc(db, 'duels', duel.id), { status: 'declined' }, { merge: true });
    document.getElementById('receiveInviteModal').classList.add('hidden');
  };
}

loadUser();
