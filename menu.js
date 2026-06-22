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

// Avatares disponibles
const AVATARS = ['spiderman', 'batman', 'goku', 'ironman', 'sasuke', 'kakashi', 'vegeta', 'itachi', 'zoro', 'luffy'];
const THEMES = [
  { name: 'ciudad', label: '🏙️ Ciudad', icon: 'ciudad.jpg' },
  { name: 'galaxia', label: '🌌 Galaxia', icon: 'galaxia.jpg' },
  { name: 'parque', label: '🌳 Parque', icon: 'parque.jpg' },
  { name: 'fondo1', label: '🌲 Bosque', icon: 'bosque.jpg' },
  { name: 'fondo2', label: '🌃 Neón', icon: 'neon.jpg' }
];

// Poderes disponibles en la tienda
const POWERS = [
  { id: 'double', name: '2x Puntos', icon: '2️⃣', cost: 150, desc: 'Duplica tus puntos en la siguiente pregunta' },
  { id: 'fifty', name: '50/50', icon: '5️⃣', cost: 100, desc: 'Elimina 2 respuestas incorrectas' },
  { id: 'light', name: 'Iluminación', icon: '💡', cost: 80, desc: 'Obtén una pista' }
];

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
  if (!user.powerDoubleOwned) user.powerDoubleOwned = 0;
  if (!user.powerFiftyOwned) user.powerFiftyOwned = 0;
  if (!user.powerLightOwned) user.powerLightOwned = 0;
  
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
      else if (page === 'profile') { document.getElementById('profileSection').classList.remove('hidden'); window.showProfile(currentUser); }
      else if (page === 'friends') { document.getElementById('friendsSection').classList.remove('hidden'); window.showFriendsList(); }
      else if (page === 'battles') { document.getElementById('battlesSection').classList.remove('hidden'); window.showBattles(); }
      else if (page === 'skills') { document.getElementById('skillsSection').classList.remove('hidden'); window.showSkills(); }
      else if (page === 'ranking') { document.getElementById('rankingSection').classList.remove('hidden'); window.showRanking(); }
      else if (page === 'tienda') { document.getElementById('tiendaSection').classList.remove('hidden'); window.showTienda(); }
      else if (page === 'avatar') { document.getElementById('avatarSection').classList.remove('hidden'); window.showAvatarEditor(); }
      else if (page === 'logros') { document.getElementById('logrosSection').classList.remove('hidden'); window.showLogros(); }
      else if (page === 'config') { document.getElementById('configSection').classList.remove('hidden'); window.showThemes(); }
    });
  });

  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  };
}

// --- PERFIL ---
window.showProfile = async function(username) {
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
      <div class="stat-item"><span>Fácil:</span> <span>${Math.min(10, stats.facil)}/10</span></div>
      <div class="stat-item"><span>Normal:</span> <span>${Math.min(10, stats.normal)}/10</span></div>
      <div class="stat-item"><span>Difícil:</span> <span>${Math.min(10, stats.dificil)}/10</span></div>
      <div class="stat-item"><span>Extremo:</span> <span>${Math.min(10, stats.experto)}/10</span></div>
      <div class="stat-item"><span>Infinito:</span> <span>${Math.min(10, stats.infinito)}/10</span></div>
    </div>
  `;
  document.getElementById('profileContent').innerHTML = html;
};

// --- AMIGOS ---
window.showFriendsList = function() {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  
  if (!user.friends || user.friends.length === 0) {
    document.getElementById('friendsContent').innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px;">No tienes amigos aún.</p>';
    return;
  }

  let html = '<div class="friends-list">';
  user.friends.forEach(f => {
    html += `
      <div class="friend-item" onclick="window.showProfile('${f}')">
        <span>👤 ${f}</span>
        <button class="btn-small" onclick="event.stopPropagation(); window.startBattleInvite('${f}')">⚔️ Desafiar</button>
      </div>`;
  });
  html += '</div>';
  document.getElementById('friendsContent').innerHTML = html;
};

window.showAddFriends = function() {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[1].classList.add('active');

  document.getElementById('friendsContent').innerHTML = `
    <div class="search-box" style="display:flex; gap:10px; margin-bottom:20px;">
      <input type="text" id="searchUser" placeholder="Nombre del usuario..." style="flex:1; padding:12px; border:1px solid rgba(76,144,255,0.3); background:rgba(76,144,255,0.05); border-radius:8px; color:#fff; font-size:14px;">
      <button class="btn-primary" onclick="window.searchUser()" style="padding:12px 30px; white-space:nowrap;">Buscar</button>
    </div>
    <div id="searchResults"></div>
  `;
};

window.searchUser = async function() {
  const name = document.getElementById('searchUser').value.trim();
  if (!name || name === currentUser) {
    document.getElementById('searchResults').innerHTML = '<p style="color:#ff4d6d;">Ingresa un nombre válido.</p>';
    return;
  }

  const targetRef = doc(db, 'users', name);
  const snap = await getDoc(targetRef);
  
  if (snap.exists()) {
    const data = snap.data();
    const isAlreadyFriend = user.friends && user.friends.includes(name);
    const btnText = isAlreadyFriend ? 'Ya es amigo' : 'Añadir';
    const btnClass = isAlreadyFriend ? 'btn-gray' : 'btn-green';
    
    document.getElementById('searchResults').innerHTML = `
      <div class="friend-item">
        <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.showProfile('${name}')">
          <img src="${getAvatarSrc(data.skin || 'spiderman')}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
          <div>
            <span>👤 ${name}</span>
            <p style="font-size:12px; opacity:0.7;">Nivel ${calculateLevel(data.xp || 0)}</p>
          </div>
        </div>
        <button class="${btnClass}" onclick="window.addFriend('${name}')" ${isAlreadyFriend ? 'disabled' : ''}>${btnText}</button>
      </div>
    `;
  } else {
    document.getElementById('searchResults').innerHTML = '<p style="color:#ff4d6d;">Usuario no encontrado.</p>';
  }
};

window.addFriend = async function(name) {
  if (!user.friends) user.friends = [];
  if (user.friends.includes(name)) { alert('Ya es tu amigo'); return; }
  
  user.friends.push(name);
  await saveUser();
  alert('¡Amigo añadido!');
  window.showFriendsList();
};

// --- BATALLAS (DUELS) ---
window.showBattles = function() {
  let html = `
    <div class="friends-tabs">
      <button class="tab-btn active" onclick="window.showBattlesDesafiar()">Desafiar</button>
      <button class="tab-btn" onclick="window.showBattlesHistorial()">Historial</button>
    </div>
    <div id="battlesContentInner"></div>
  `;
  document.getElementById('battlesContent').innerHTML = html;
  window.showBattlesDesafiar();
};

window.showBattlesDesafiar = function() {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  
  if (!user.friends || user.friends.length === 0) {
    document.getElementById('battlesContentInner').innerHTML = '<p style="text-align:center; padding:20px; opacity:0.7;">Añade amigos para batallar.</p>';
    return;
  }

  let html = '';
  user.friends.forEach(f => {
    html += `
      <div class="friend-item">
        <span>👤 ${f}</span>
        <button class="btn-primary" onclick="window.startBattleInvite('${f}')">Desafiar</button>
      </div>`;
  });
  document.getElementById('battlesContentInner').innerHTML = html;
};

window.showBattlesHistorial = async function() {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn')[1].classList.add('active');
  
  try {
    const duelsRef = collection(db, 'duels');
    const q = query(duelsRef, where('status', '==', 'finished'));
    const snap = await getDocs(q);
    
    const myDuels = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.challenger === currentUser || d.opponent === currentUser)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    if (myDuels.length === 0) {
      document.getElementById('battlesContentInner').innerHTML = '<p style="text-align:center; padding:20px; opacity:0.7;">No hay batallas completadas aun.</p>';
      return;
    }
    
    let html = '<div class="battles-history">';
    myDuels.forEach(duel => {
      const isChallenger = duel.challenger === currentUser;
      const opponent = isChallenger ? duel.opponent : duel.challenger;
      const myScore = isChallenger ? duel.p1Score : duel.p2Score;
      const opScore = isChallenger ? duel.p2Score : duel.p1Score;
      const won = myScore > opScore;
      const result = won ? 'GANADA' : (myScore === opScore ? 'EMPATE' : 'PERDIDA');
      const resultColor = won ? '#4cff90' : (myScore === opScore ? '#ffd700' : '#ff4d6d');
      const date = new Date(duel.createdAt).toLocaleString('es-ES');
      
      html += `
        <div class="battle-history-item" style="background:rgba(76,144,255,0.1); border:1px solid rgba(76,144,255,0.3); padding:15px; border-radius:10px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:bold; color:#fff;">vs ${opponent}</div>
              <div style="font-size:12px; opacity:0.7;">${date}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:18px; font-weight:bold; color:${resultColor};">${result}</div>
              <div style="font-size:14px; color:#4cff90; margin-top:5px;">${myScore} - ${opScore}</div>
              <div style="font-size:12px; opacity:0.8; margin-top:5px;">${duel.bet} monedas</div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    document.getElementById('battlesContentInner').innerHTML = html;
  } catch (e) {
    console.error('Error cargando historial:', e);
    document.getElementById('battlesContentInner').innerHTML = '<p style="color:#ff4d6d;">Error al cargar el historial.</p>';
  }
};

window.startBattleInvite = async function(opponent) {
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
  user.coins -= bet;
  await saveUser();
  
  activeBattleInvite = duelId;
  window.showInviteModal(opponent, bet, 60);
};

window.showInviteModal = function(opponent, bet, time) {
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
    if (activeBattleInvite) {
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
    }

    if (timeLeft <= 0) {
      clearInterval(battleTimerInterval);
      window.cancelBattleInvite();
      alert('El tiempo de invitación expiró.');
    }
  }, 1000);
};

window.minimizeBattleInvite = function() {
  document.getElementById('battleInviteModal').classList.add('hidden');
  document.getElementById('battlePendingBadge').classList.remove('hidden');
};

window.restoreBattleInvite = function() {
  document.getElementById('battleInviteModal').classList.remove('hidden');
  document.getElementById('battlePendingBadge').classList.add('hidden');
};

window.cancelBattleInvite = async function() {
  if (activeBattleInvite) {
    const duelRef = doc(db, 'duels', activeBattleInvite);
    const snap = await getDoc(duelRef);
    if (snap.exists() && snap.data().status === 'pending') {
      await deleteDoc(duelRef);
      // Devolver monedas si no fue aceptada
      const duelData = snap.data();
      user.coins += duelData.bet;
      await saveUser();
    }
    activeBattleInvite = null;
  }
  clearInterval(battleTimerInterval);
  document.getElementById('battleInviteModal').classList.add('hidden');
  document.getElementById('battlePendingBadge').classList.add('hidden');
};

// --- ESCUCHAR INVITACIONES ENTRANTES ---
function listenForInvites() {
  try {
    const q = query(collection(db, 'duels'), where('opponent', '==', currentUser), where('status', '==', 'pending'));
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          window.showReceiveInvite(d);
        }
      });
    }, (error) => {
      console.warn("Firebase: Error en listener de invitaciones (posibles permisos):", error);
    });
  } catch (e) {
    console.error("Error al iniciar listener de invitaciones:", e);
  }
}

window.showReceiveInvite = function(duel) {
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
    user.coins -= duel.bet;
    await saveUser();
    await setDoc(doc(db, 'duels', duel.id), { status: 'accepted' }, { merge: true });
    localStorage.setItem('activeDuel', duel.id);
    window.location.href = 'game.html?mode=battle';
  };

  document.getElementById('declineBattleBtn').onclick = async () => {
    clearInterval(timer);
    await setDoc(doc(db, 'duels', duel.id), { status: 'declined' }, { merge: true });
    document.getElementById('receiveInviteModal').classList.add('hidden');
  };
};

// --- HABILIDADES ---
window.showSkills = function() {
  const algebra = Math.min(5, Math.floor((user.calcTotalSolved || 0) / 10));
  const geometry = Math.min(5, Math.floor((user.infinityProblemsSolved || 0) / 50));
  const duels = Math.min(5, Math.floor((user.duelsWon || 0) / 20));
  const speed = Math.min(5, Math.floor((user.infinityBestStreak || 0) / 50));
  const accuracy = Math.min(5, Math.floor((user.quizQuestionsAnswered || 0) / 100));

  const stats = {
    'Álgebra': algebra,
    'Geometría': geometry,
    'Duelos': duels,
    'Rapidez': speed,
    'Precisión': accuracy
  };

  let html = `<h2 style="font-family:'Orbitron',sans-serif; color:#4c90ff; text-align:center;">🌳 Pentágono de Habilidades</h2>`;
  html += `<div style="display: flex; flex-direction: column; align-items: center; background: rgba(16,24,52,0.6); padding: 20px; border-radius: 20px; border: 1px solid rgba(76,144,255,0.2);">`;
  html += `<canvas id="skillsCanvas" width="500" height="500" style="max-width: 100%; filter: drop-shadow(0 0 10px rgba(76,144,255,0.3));"></canvas>`;
  html += `<div id="skillsStats" style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; width: 100%;"></div>`;
  html += `</div>`;
  document.getElementById('skillsSection').innerHTML = html;

  drawSkillsRadar(stats);

  const statsContainer = document.getElementById('skillsStats');
  const labels = Object.keys(stats);
  const values = Object.values(stats);
  const icons = ['📐', '📏', '⚔️', '⚡', '🎯'];

  labels.forEach((label, i) => {
    const percentage = (values[i] / 5) * 100;
    statsContainer.innerHTML += `
      <div style="padding: 12px; border: 1px solid rgba(76,144,255,0.3); background: rgba(76,144,255,0.05); border-radius: 10px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">${icons[i]}</div>
        <div style="font-weight: bold; color: #4c90ff; font-size: 14px;">${label}</div>
        <div style="font-size: 18px; font-family: 'Orbitron'; color: #fff; margin: 8px 0;">${values[i]}/5</div>
        <div style="height: 6px; background: rgba(76,144,255,0.2); border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: linear-gradient(90deg, #4c90ff, #4cff90); width: ${percentage}%; transition: width 0.3s;"></div>
        </div>
      </div>
    `;
  });
};

function drawSkillsRadar(stats) {
  const canvas = document.getElementById('skillsCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;
  const labels = Object.keys(stats);
  const values = Object.values(stats);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar Telaraña Base
  ctx.strokeStyle = 'rgba(76,144,255,0.2)';
  ctx.lineWidth = 1;
  for (let j = 1; j <= 5; j++) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const r = (radius / 5) * j;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Dibujar Ejes
  ctx.strokeStyle = 'rgba(76,144,255,0.1)';
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    ctx.stroke();
  }

  // Dibujar Área de Habilidades
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,165,0,0.15)';
  ctx.strokeStyle = 'rgba(255,165,0,0.6)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (values[i] / 5) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dibujar Puntos
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (values[i] / 5) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    ctx.fillStyle = '#4cff90';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Dibujar Etiquetas
  ctx.fillStyle = '#e8eaff';
  ctx.font = 'bold 16px Rajdhani';
  ctx.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius + 45);
    const y = centerY + Math.sin(angle) * (radius + 45);
    ctx.fillText(labels[i], x, y);
  }
}

// --- RANKING ---
window.showRanking = async function() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('xp', 'desc'), limit(10));
  const snap = await getDocs(q);
  
  let html = '<div class="podium-container">';
  const users = snap.docs.map(d => ({ name: d.id, ...d.data() }));
  
  // Top 3 en podio
  if (users.length >= 1) {
    html += `<div class="podium-1st">
      <div style="font-size:40px;">🥇</div>
      <div>${users[0].name}</div>
      <div style="color:#ffd700; font-weight:bold;">${users[0].xp || 0} XP</div>
    </div>`;
  }
  if (users.length >= 2) {
    html += `<div class="podium-2nd">
      <div style="font-size:40px;">🥈</div>
      <div>${users[1].name}</div>
      <div style="color:#c0c0c0; font-weight:bold;">${users[1].xp || 0} XP</div>
    </div>`;
  }
  if (users.length >= 3) {
    html += `<div class="podium-3rd">
      <div style="font-size:40px;">🥉</div>
      <div>${users[2].name}</div>
      <div style="color:#cd7f32; font-weight:bold;">${users[2].xp || 0} XP</div>
    </div>`;
  }
  html += '</div>';
  
  // Lista completa
  html += '<div class="ranking-list">';
  users.forEach((u, i) => {
    const level = calculateLevel(u.xp || 0);
    html += `<div class="ranking-item">
      <span style="font-weight:bold; color:#4c90ff;">#${i + 1}</span>
      <span>${u.name}</span>
      <span>Nivel ${level}</span>
      <span style="color:#4cff90; font-weight:bold;">${u.xp || 0} XP</span>
    </div>`;
  });
  html += '</div>';
  
  document.getElementById('rankingSection').innerHTML = '<h2>🏅 Ranking Global</h2>' + html;
};

// --- TIENDA ---
window.showTienda = function() {
  let html = '<div class="tienda-grid">';
  
  // Poderes
  html += '<h3 style="grid-column:1/-1; color:#4c90ff; font-family:Orbitron;">⚡ Poderes Especiales</h3>';
  POWERS.forEach(power => {
    html += `
      <div class="tienda-item">
        <div style="font-size:40px;">${power.icon}</div>
        <div>${power.name}</div>
        <div style="font-size:12px; opacity:0.8;">${power.desc}</div>
        <button class="btn-primary" onclick="window.buyPower('${power.id}', ${power.cost})">
          ${power.cost} 💰
        </button>
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('tiendaSection').innerHTML = '<h2>🛍️ Tienda</h2>' + html;
};

window.buyAvatar = async function(avatar) {
  if (user.coins < 500) { alert('No tienes suficientes monedas'); return; }
  if (user.skins && user.skins.includes(avatar)) { alert('Ya lo posees'); return; }
  
  user.coins -= 500;
  if (!user.skins) user.skins = [];
  user.skins.push(avatar);
  await saveUser();
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  alert('¡Avatar comprado!');
  window.showAvatarEditor();
};

window.buyPower = async function(powerId, cost) {
  if (user.coins < cost) { alert('No tienes suficientes monedas'); return; }
  
  user.coins -= cost;
  if (powerId === 'double') user.powerDoubleOwned = (user.powerDoubleOwned || 0) + 1;
  else if (powerId === 'fifty') user.powerFiftyOwned = (user.powerFiftyOwned || 0) + 1;
  else if (powerId === 'light') user.powerLightOwned = (user.powerLightOwned || 0) + 1;
  
  await saveUser();
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  alert('¡Poder comprado!');
  window.showTienda();
};

// --- AVATAR EDITOR ---
window.showAvatarEditor = function() {
  let html = '<div class="avatar-grid">';
  AVATARS.forEach(avatar => {
    const isSelected = user.skin === avatar;
    const owned = user.skins && user.skins.includes(avatar);
    const btnText = owned ? (isSelected ? '✓ Equipado' : 'Equipar') : 'Comprar (500 💰)';
    const btnClass = owned ? (isSelected ? 'btn-gray' : 'btn-green') : 'btn-primary';
    
    html += `
      <div class="avatar-option ${isSelected ? 'selected' : ''}">
        <img src="${getAvatarSrc(avatar)}" class="avatar-choice-img">
        <div style="margin-top:10px; font-size:12px;">${avatar}</div>
        <button class="${btnClass}" onclick="${owned ? `window.selectAvatar('${avatar}')` : `window.buyAvatar('${avatar}')`}" style="width:100%; margin-top:8px; padding:8px; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px;">
          ${btnText}
        </button>
      </div>
    `;
  });
  html += '</div>';
  document.getElementById('avatarSection').innerHTML = '<h2>👤 Avatares</h2>' + html;
};

window.selectAvatar = async function(avatar) {
  if (!user.skins || !user.skins.includes(avatar)) {
    alert('Debes comprar este avatar primero');
    return;
  }
  user.skin = avatar;
  await saveUser();
  const avatarDisplay = document.getElementById('avatarDisplay');
  if (avatarDisplay) avatarDisplay.innerHTML = `<img src="${getAvatarSrc(avatar)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  window.showAvatarEditor();
};

// --- LOGROS ---
window.showLogros = function() {
  const allAchievements = getAllAchievements();
  const stats = getAchievementStats(user.logros || {});
  
  let html = `<div style="text-align:center; margin-bottom:20px; padding:15px; background:rgba(76,144,255,0.1); border-radius:10px;">
    <div style="font-size:24px; color:#4cff90; font-weight:bold;">${stats.unlocked}/${stats.total}</div>
    <div style="opacity:0.8;">Logros desbloqueados (${stats.percentage}%)</div>
    <div style="height:8px; background:rgba(76,144,255,0.2); border-radius:4px; margin-top:10px; overflow:hidden;">
      <div style="height:100%; background:linear-gradient(90deg, #4c90ff, #4cff90); width:${stats.percentage}%;"></div>
    </div>
  </div>`;
  
  html += '<div class="achievements-grid">';
  allAchievements.forEach(ach => {
    const unlocked = user.logros && user.logros[ach.id];
    html += `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <div style="font-size:32px; margin-bottom:8px;">${ach.icon}</div>
        <div style="font-weight:bold; font-size:14px;">${ach.title}</div>
        <div style="font-size:12px; opacity:0.7; margin-top:5px;">${ach.desc}</div>
      </div>
    `;
  });
  html += '</div>';
  
  document.getElementById('logrosSection').innerHTML = '<h2>🏆 Tus Logros</h2>' + html;
};

// --- TEMAS ---
window.showThemes = function() {
  const bgMusic = document.getElementById('bgMusic');
  const musicStatus = bgMusic && !bgMusic.paused ? 'Activada' : 'Desactivada';
  
  let html = `
    <div class="card">
      <h3>🎵 Música de Fondo</h3>
      <div style="margin-bottom:10px; opacity:0.8;">Estado: ${musicStatus}</div>
      <button class="btn-primary" onclick="window.toggleMusic()">
        ${bgMusic && !bgMusic.paused ? 'Desactivar' : 'Activar'} Música
      </button>
    </div>
    
    <h3 style="margin-top:20px; color:#4c90ff; font-family:'Orbitron';">🎨 Temas Visuales</h3>
    <div class="themes-grid">
  `;
  
  THEMES.forEach(theme => {
    const isActive = localStorage.getItem('background') === theme.name;
    html += `
      <div class="theme-option ${isActive ? 'active' : ''}" onclick="window.selectTheme('${theme.name}')">
        <img src="${theme.icon}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
        <div style="position:absolute; bottom:10px; left:10px; right:10px; background:rgba(0,0,0,0.7); padding:8px; border-radius:8px; text-align:center;">
          ${theme.label}
        </div>
        ${isActive ? '<div style="position:absolute; top:10px; right:10px; background:#4cff90; color:#000; padding:8px 12px; border-radius:20px; font-weight:bold;">✓</div>' : ''}
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('configSection').innerHTML = '<h2>⚙️ Ajustes</h2>' + html;
};

window.toggleMusic = async function() {
  const bgMusic = document.getElementById('bgMusic');
  if (!bgMusic) return;
  
  try {
    if (bgMusic.paused) {
      await bgMusic.play();
    } else {
      bgMusic.pause();
    }
  } catch (e) {
    console.warn('Interrupción de reproducción de música controlada:', e.name);
  } finally {
    // Actualizar la UI inmediatamente después del cambio de estado
    window.showThemes();
  }
};

window.selectTheme = function(themeName) {
  localStorage.setItem('background', themeName);
  document.body.className = themeName;
  window.showThemes();
};

loadUser();
