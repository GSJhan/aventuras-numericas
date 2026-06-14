import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAllAchievements, getAchievementStats } from './achievements.js';
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
  document.getElementById('avatarDisplay').innerHTML = '<img src="' + getAvatarSrc(initSkin) + '" onerror="this.outerHTML=\'🦸\'" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>';
}

function getAvatarSrc(name) {
  var jpgList = ['batman', 'kakashi'];
  if (jpgList.indexOf(name) !== -1) return name + '.jpg';
  return name + '.png';
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
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

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
  var html = '<div class="current-avatar"><img src="' + getAvatarSrc(user.skin) + '" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 24px rgba(76,144,255,0.7)"/></div>';
  html += '<h3 style="margin:14px 0;color:#aaa;font-family:Orbitron,monospace;font-size:14px;">Aspectos Disponibles</h3>';
  html += '<div class="skins-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:10px;">';
  skins.forEach(s => {
    var owned = user.skins.indexOf(s.avatar) !== -1;
    var active = user.skin === s.avatar;
    html += '<div class="skin-item" onclick="selectSkin(\'' + s.avatar + '\', ' + s.price + ')" style="cursor:pointer;text-align:center;padding:10px;border-radius:10px;background:rgba(255,255,255,0.05);border:2px solid ' + (active ? '#4cff90' : 'transparent') + '">';
    html += '<img src="' + getAvatarSrc(s.avatar) + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;margin-bottom:5px;filter:' + (owned ? 'none' : 'grayscale(1)') + '"/>';
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

// Lógica de Logros
async function showLogros() {
  const allAchievements = getAllAchievements();
  const stats = getAchievementStats(user.logros);
  let html = '<div class="logros-stats"><div>Desbloqueados: ' + stats.unlocked + '/' + stats.total + ' (' + stats.percentage + '%)</div></div>';
  html += '<div class="logros-container" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:15px;">';
  allAchievements.forEach(a => {
    const achieved = user.logros[a.id];
    html += '<div class="logro-card" style="padding:15px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid ' + (achieved ? '#4cff90' : '#444') + ';opacity:' + (achieved ? 1 : 0.6) + '">';
    html += '<div>' + a.icon + ' ' + a.title + '</div>';
    html += '<small>' + a.desc + '</small>';
    html += '</div>';
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
