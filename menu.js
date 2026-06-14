import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAllAchievements, getAchievementStats } from './achievements.js';
import { checkAllAchievements } from './global-achievements.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

async function saveUser() {
  if (!userRef || !user) return;
  await setDoc(userRef, user);
  await checkAllAchievements(user, userRef);
}

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  
  // Inicialización de campos si no existen
  if (!user.logros) user.logros = {};
  if (!user.powers) user.powers = { double: 0, fifty: 0, light: 0 };
  if (!user.coins) user.coins = 0;
  if (!user.xp) user.xp = 0;
  if (!user.skins) user.skins = ['spiderman'];
  if (!user.skin) user.skin = 'spiderman';
  if (!user.infinityStreak) user.infinityStreak = 0;
  if (!user.infinityBestStreak) user.infinityBestStreak = 0;
  
  updateUI();
  initMenu();
}

function updateUI() {
  document.getElementById('displayUsername').textContent = user.username || currentUser;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  
  var initSkin = user.skin || 'spiderman';
  document.getElementById('avatarDisplay').innerHTML = '<img src="' + getAvatarSrc(initSkin) + '" onerror="this.src=\'./src/images/default_avatar.png\'" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>';
}

function getAvatarSrc(name) {
  var jpgList = ['batman', 'kakashi'];
  if (jpgList.indexOf(name) !== -1) return './src/images/avatars/' + name + '.jpg';
  return './src/images/avatars/' + name + '.png';
}

function initMenu() {
  // Configuración de fondo y música
  var savedBg = localStorage.getItem('background') || 'ciudad';
  document.body.className = savedBg;
  document.getElementById('backgroundSelect').value = savedBg;

  var currentAudio = null;
  function playMusic(bg) {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    var musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
    if (!musicEnabled) return;
    var tracks = { ciudad: 'ciudad.mp3', galaxia: 'galaxia.mp3', parque: 'parque.mp3', fondo1: 'bosque.mp3', fondo2: 'neon.mp3' };
    if (tracks[bg]) {
      currentAudio = new Audio(tracks[bg]);
      currentAudio.loop = true;
      currentAudio.volume = 0.3;
      currentAudio.play().catch(function() {});
    }
  }

  var musicToggle = document.getElementById('musicToggle');
  musicToggle.checked = localStorage.getItem('musicEnabled') !== 'false';
  musicToggle.onchange = (e) => {
    localStorage.setItem('musicEnabled', e.target.checked);
    if (e.target.checked) playMusic(document.getElementById('backgroundSelect').value);
    else if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  };

  document.getElementById('backgroundSelect').onchange = (e) => {
    document.body.className = e.target.value;
    localStorage.setItem('background', e.target.value);
    playMusic(e.target.value);
  };

  playMusic(savedBg);

  // Navegación
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = () => {
      const page = btn.getAttribute('data-page');
      showSection(page);
    };
  });

  document.getElementById('logoutBtn').onclick = () => {
    if (currentAudio) currentAudio.pause();
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  };

  document.getElementById('infinitySolveBtn').onclick = checkInfinity;
}

function showSection(page) {
  const sections = ['avatarSection', 'skillsSection', 'duelsSection', 'infinitoSection', 'logrosSection', 'rankingSection', 'shopSection', 'configSection'];
  const mainMenuGrid = document.getElementById('mainMenuGrid');
  
  // Ocultar todas las secciones y el menú principal
  if (mainMenuGrid) mainMenuGrid.classList.add('hidden');
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Mostrar el menú principal si la página es 'menu'
  if (page === 'menu') {
    if (mainMenuGrid) mainMenuGrid.classList.remove('hidden');
    return;
  }

  if (page === 'game') {
    window.location.href = 'game.html';
  } else if (page === 'infinito') {
    document.getElementById('infinitoSection').classList.remove('hidden');
    nextProblem();
  } else if (page === 'avatar') {
    document.getElementById('avatarSection').classList.remove('hidden');
    showAvatarEditor();
  } else if (page === 'skills') {
    document.getElementById('skillsSection').classList.remove('hidden');
    import('./skills.js').then(m => m.renderSkillsTree(user, userRef, saveUser));
  } else if (page === 'logros') {
    document.getElementById('logrosSection').classList.remove('hidden');
    showLogros();
  } else if (page === 'shop') {
    document.getElementById('shopSection').classList.remove('hidden');
    showPowers();
  } else {
    const target = document.getElementById(page + 'Section');
    if (target) target.classList.remove('hidden');
  }
  
  if (page === 'ranking') {
    document.getElementById('rankingSection').classList.remove('hidden');
    showRanking();
  } else if (page === 'duels') {
    document.getElementById('duelsSection').classList.remove('hidden');
    showDuels();
  }

  // Añadir botón de atrás dinámicamente si no existe
  const targetSection = document.getElementById(page + 'Section');
  if (targetSection && !targetSection.querySelector('.back-btn-dynamic')) {
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary back-btn-dynamic';
    backBtn.textContent = 'Atrás';
    backBtn.style.marginTop = '20px';
    backBtn.onclick = () => showSection('menu');
    targetSection.appendChild(backBtn);
  }
}

// Lógica de Ranking Global
async function showRanking() {
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '<p>Cargando ranking...</p>';
  try {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    
    let html = '<table style="width:100%; text-align:left; border-collapse:collapse; margin-top: 20px;">';
    html += '<tr style="border-bottom:2px solid #4c90ff; padding-bottom: 8px;"><th>Pos</th><th>Jugador</th><th>XP</th></tr>';
    let pos = 1;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const isMe = doc.id === currentUser;
      html += `<tr style="${isMe ? 'color:#4cff90; font-weight:bold; background: rgba(76,144,255,0.1);' : ''} border-bottom:1px solid rgba(255,255,255,0.1);">`;
      html += `<td style="padding: 10px 0;">${pos}</td><td style="padding: 10px 0;">${data.username || doc.id}</td><td style="padding: 10px 0;">${data.xp || 0}</td>`;
      html += '</tr>';
      pos++;
    });
    html += '</table>';
    
    if (querySnapshot.empty) {
      rankingList.innerHTML = '<p>No hay jugadores en el ranking aún.</p>';
    } else {
      rankingList.innerHTML = html;
    }
  } catch (e) {
    console.error("Error al cargar ranking:", e);
    rankingList.innerHTML = '<p style="color:#ff4d6d;">Error al cargar el ranking.</p>';
  }
}

// Lógica de Duelos (Oponentes)
async function showDuels() {
  const duelsContainer = document.getElementById('duelsContainer');
  duelsContainer.innerHTML = '<p>Cargando posibles oponentes...</p>';
  try {
    const q = query(collection(db, "users"), limit(20));
    const querySnapshot = await getDocs(q);
    
    let html = '<div style="display:grid; gap:15px; margin-top: 20px;">';
    let foundOpponents = false;
    querySnapshot.forEach((doc) => {
      if (doc.id !== currentUser) {
        const data = doc.data();
        foundOpponents = true;
        html += `<div style="padding:15px; background:rgba(76,144,255,0.1); border-radius:10px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">`;
        html += `  <div style="display:flex; align-items:center;">`;
        html += `    <img src="${getAvatarSrc(data.skin || 'spiderman')}" onerror="this.src='./src/images/default_avatar.png'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:10px;border:2px solid #4cff90;"/>`;
        html += `    <span>${data.username || doc.id} (XP: ${data.xp || 0})</span>`;
        html += `  </div>`;
        html += `  <button class="btn-primary" style="padding:8px 15px; font-size:13px;" onclick="alert('Función de duelo en tiempo real en desarrollo. ¡Pronto podrás desafiar a ${data.username || doc.id}!')">Desafiar</button>`;
        html += `</div>`;
      }
    });
    html += '</div>';
    
    if (!foundOpponents) {
      duelsContainer.innerHTML = '<p>No se encontraron otros jugadores para desafiar.</p>';
    } else {
      duelsContainer.innerHTML = html;
    }
  } catch (e) {
    console.error("Error al cargar duelos:", e);
    duelsContainer.innerHTML = '<p style="color:#ff4d6d;">Error al cargar la lista de jugadores.</p>';
  }
}

// Lógica de Avatar
var skins = [
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
  var html = '<div class="current-avatar"><img src="' + getAvatarSrc(user.skin) + '" onerror="this.src=\'./src/images/default_avatar.png\'" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 24px rgba(76,144,255,0.7)"/></div>';
  html += '<h3 style="margin:14px 0;color:#aaa;font-family:Orbitron,monospace;font-size:14px;">Aspectos Disponibles</h3>';
  html += '<div class="skins-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:10px;">';
  skins.forEach(s => {
    var owned = user.skins.indexOf(s.avatar) !== -1;
    var active = user.skin === s.avatar;
    html += '<div class="skin-item" onclick="selectSkin(\'' + s.avatar + '\', ' + s.price + ')" style="cursor:pointer;text-align:center;padding:10px;border-radius:10px;background:rgba(255,255,255,0.05);border:2px solid ' + (active ? '#4cff90' : 'transparent') + '">';
    html += '<img src="' + getAvatarSrc(s.avatar) + '" onerror="this.src=\'./src/images/default_avatar.png\'" style="width:50px;height:50px;border-radius:50%;object-fit:cover;margin-bottom:5px;filter:' + (owned ? 'none' : 'grayscale(1)') + '"/>';
    html += '<div style="font-size:10px">' + s.name + '</div>';
    html += '<div style="font-size:10px">' + (owned ? (active ? '✅' : 'Equipar') : '💰 ' + s.price) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  editor.innerHTML = html;
}

window.selectSkin = async (skin, price) => {
  var owned = user.skins.indexOf(skin) !== -1;
  if (owned) {
    user.skin = skin;
    await saveUser();
    updateUI();
    showAvatarEditor();
  } else if (user.coins >= price) {
    user.coins -= price;
    user.skins.push(skin);
    user.skin = skin;
    await saveUser();
    updateUI();
    showAvatarEditor();
  } else {
    alert('❌ Monedas insuficientes');
  }
};

// Lógica de Tienda
function showPowers() {
  let html = '<div class="powers-section"><h3>Poderes Disponibles</h3>';
  html += '<button class="power-btn" onclick="buyPower(\'double\', 50)">💰 Doble XP - 50 monedas (' + (user.powers.double || 0) + ')</button>';
  html += '<button class="power-btn" onclick="buyPower(\'fifty\', 40)">🌓 50/50 - 40 monedas (' + (user.powers.fifty || 0) + ')</button>';
  html += '<button class="power-btn" onclick="buyPower(\'light\', 60)">⚡ Luz - 60 monedas (' + (user.powers.light || 0) + ')</button>';
  html += '</div>';
  document.getElementById('shopGrid').innerHTML = html;
}

window.buyPower = async (type, cost) => {
  if (user.coins >= cost) {
    user.coins -= cost;
    user.powers[type]++;
    await saveUser();
    updateUI();
    showPowers();
  } else alert('❌ Monedas insuficientes');
};

// Lógica de Logros Visualmente Atractivos
async function showLogros() {
  const allAchievements = getAllAchievements();
  const stats = getAchievementStats(user.logros);
  
  let html = '<div class="logros-stats" style="text-align:center; margin-bottom:20px; font-size:1.1em; color:#e8eaff;">Desbloqueados: <strong style="color:#4cff90;">' + stats.unlocked + '</strong> / ' + stats.total + ' (<strong style="color:#4cff90;">' + stats.percentage + '%</strong>)</div>';
  html += '<div class="logros-container" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:20px; margin-top:15px;">';
  
  allAchievements.forEach(a => {
    const achieved = user.logros[a.id];
    const cardColor = achieved ? '#4cff90' : '#888';
    const cardBg = achieved ? 'rgba(76,255,144,0.1)' : 'rgba(255,255,255,0.05)';
    const cardShadow = achieved ? '0 0 15px rgba(76,255,144,0.4)' : 'none';
    const cardOpacity = achieved ? 1 : 0.6;

    html += `<div class="logro-card" style="padding:20px; border-radius:15px; background:${cardBg}; border:2px solid ${cardColor}; opacity:${cardOpacity}; transition: all 0.3s ease; box-shadow: ${cardShadow}; text-align:center; position:relative; overflow:hidden;">`;
    html += `  <div style="font-size:3em; margin-bottom:10px;">${a.icon}</div>`;
    html += `  <h3 style="color:#e8eaff; margin-bottom:5px; font-size:1.2em;">${a.title}</h3>`;
    html += `  <p style="color:#aaa; font-size:0.9em;">${a.desc}</p>`;
    if (achieved) {
      html += `  <div style="position:absolute; top:10px; right:10px; color:#4cff90; font-size:1.5em;">✅</div>`;
    } else {
      html += `  <div style="position:absolute; top:10px; right:10px; color:#888; font-size:1.5em;">🔒</div>`;
    }
    html += `</div>`;
  });
  html += '</div>';
  document.getElementById('logrosList').innerHTML = html;
}

// Lógica de Modo Infinito
var currentInfinityProblem = null;
var infinityStreak = 0;
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateProblem() {
  const type = rnd(0, 3);
  let q, a;
  if (type === 0) { let x=rnd(1,20), y=rnd(1,20); q=x+" + "+y; a=x+y; }
  else if (type === 1) { let x=rnd(10,30), y=rnd(1,10); q=x+" - "+y; a=x-y; }
  else if (type === 2) { let x=rnd(2,10), y=rnd(2,10); q=x+" × "+y; a=x*y; }
  else { let x=rnd(2,12); q="√"+(x*x); a=x; }
  return { q: q, a: a };
}

function nextProblem() {
  currentInfinityProblem = generateProblem();
  document.getElementById('infinityProblemBox').innerHTML = '<div class="prob-question" style="font-size:32px;text-align:center;margin:20px 0;">' + currentInfinityProblem.q + ' = ?</div>';
  document.getElementById('infinityEquation').value = '';
  document.getElementById('infinityResult').innerHTML = '';
}

async function checkInfinity() {
  const val = parseInt(document.getElementById('infinityEquation').value);
  if (val === currentInfinityProblem.a) {
    infinityStreak++;
    user.xp += 5; user.coins += 2;
    user.infinityStreak = infinityStreak;
    user.infinityBestStreak = Math.max(user.infinityBestStreak || 0, infinityStreak);
    document.getElementById('infinityResult').innerHTML = '<span style="color:#4cff90">✅ ¡Correcto! +2💰 +5⭐</span>';
    await saveUser();
    updateUI();
    setTimeout(nextProblem, 1000);
  } else {
    infinityStreak = 0;
    document.getElementById('infinityResult').innerHTML = '<span style="color:#ff4d6d">❌ Incorrecto</span>';
    await saveUser();
  }
}

loadUser();
