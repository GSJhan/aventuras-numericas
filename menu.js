import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  if (!snap.exists()) {
    window.location.href = 'index.html';
    return;
  }
  user = snap.data();
  if (!user.logros) user.logros = {};
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.skins) user.skins = ['spiderman'];
  if (!user.skin) user.skin = 'spiderman';
  if (!user.misionesCompletas) user.misionesCompletas = 0;
  if (!user.totalMonedas) user.totalMonedas = 0;
  if (!user.preguntasRespondidas) user.preguntasRespondidas = 0;
  if (!user.respuestasCorrectas) user.respuestasCorrectas = 0;
  initMenu();
}

async function saveUser() {
  await setDoc(userRef, user);
  await updateRanking();
}

async function updateRanking() {
  var rankingRef = doc(db, 'ranking', currentUser);
  await setDoc(rankingRef, {
    username: currentUser,
    xp: user.xp || 0,
    coins: user.coins || 0,
    level: Math.floor((user.xp || 0) / 100) + 1,
    actualizado: new Date().toISOString()
  });
}

async function loadRanking() {
  try {
    var rankingQuery = query(collection(db, 'ranking'), orderBy('xp', 'desc'), limit(50));
    var querySnapshot = await getDocs(rankingQuery);
    var rankingList = [];
    querySnapshot.forEach(function(doc) {
      rankingList.push(doc.data());
    });
    return rankingList;
  } catch (error) {
    console.error("Error al cargar ranking:", error);
    return [];
  }
}

function getAvatarSrc(name) {
  var emojis = {
    spiderman: '🕷️',
    batman: '🦇',
    goku: '🐉',
    ironman: '🤖',
    sasuke: '🍥',
    kakashi: '📖',
    vegeta: '💪',
    itachi: '🐦‍⬛',
    zoro: '⚔️',
    luffy: '🏴‍☠️'
  };
  return emojis[name] || '🦸';
}

async function showRanking() {
  var rankingList = await loadRanking();
  var rankingHtml = '<div style="max-height:400px;overflow-y:auto">';
  rankingHtml += '<table style="width:100%;border-collapse:collapse">';
  rankingHtml += '<thead><tr style="border-bottom:2px solid #4c90ff"><th>#</th><th>Avatar</th><th>Usuario</th><th>⭐ XP</th><th>💰 Monedas</th><th>🏆 Nivel</th></tr></thead><tbody>';
  
  for (var i = 0; i < rankingList.length; i++) {
    var r = rankingList[i];
    var medal = '';
    if (i === 0) medal = '🥇';
    else if (i === 1) medal = '🥈';
    else if (i === 2) medal = '🥉';
    else medal = (i + 1) + '.';
    
    rankingHtml += '<tr style="border-bottom:1px solid rgba(76,144,255,0.2)">';
    rankingHtml += '<td style="padding:8px">' + medal + '</td>';
    rankingHtml += '<td style="padding:8px;font-size:24px">' + getAvatarSrc(r.skin || 'spiderman') + '</td>';
    rankingHtml += '<td style="padding:8px">' + (r.username === currentUser ? '<span style="color:#4cff90">✨ ' + r.username + ' ✨</span>' : r.username) + '</td>';
    rankingHtml += '<td style="padding:8px;color:#a78bfa">⭐ ' + (r.xp || 0) + '</td>';
    rankingHtml += '<td style="padding:8px;color:#ffd700">💰 ' + (r.coins || 0) + '</td>';
    rankingHtml += '<td style="padding:8px;color:#4c90ff">🏆 ' + (r.level || 1) + '</td>';
    rankingHtml += '</tr>';
  }
  
  if (rankingList.length === 0) {
    rankingHtml += '<tr><td colspan="6" style="text-align:center;padding:20px">Aún no hay jugadores en el ranking</td></tr>';
  }
  
  rankingHtml += '</tbody></table></div>';
  document.getElementById('rankingList').innerHTML = rankingHtml;
}

function initMenu() {
  document.getElementById('displayUsername').textContent = currentUser;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';

  var initSkin = user.skin || 'spiderman';
  document.getElementById('avatarDisplay').innerHTML = '<div style="font-size:96px;filter:drop-shadow(0 0 22px rgba(76,144,255,0.55));animation:levitate 3s ease-in-out infinite">' + getAvatarSrc(initSkin) + '</div>';

  var savedBg = localStorage.getItem('background') || 'ciudad';
  document.body.className = savedBg;
  var bgSelect = document.getElementById('backgroundSelect');
  if (bgSelect) bgSelect.value = savedBg;

  if (bgSelect) {
    bgSelect.addEventListener('change', function(e) {
      document.body.className = e.target.value;
      localStorage.setItem('background', e.target.value);
    });
  }

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = function() {
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    };
  }

  var menuBtns = document.querySelectorAll('.menu-btn');
  for (var i = 0; i < menuBtns.length; i++) {
    menuBtns[i].addEventListener('click', function() {
      var page = this.dataset.page;
      var sections = document.querySelectorAll('.section');
      for (var j = 0; j < sections.length; j++) sections[j].classList.add('hidden');
      if (page === 'game') {
        window.location.href = 'game.html';
      } else if (page === 'infinito') {
        document.getElementById('infinitoSection').classList.remove('hidden');
        if (!currentInfinityProblem) nextProblem();
      } else if (page === 'avatar') {
        document.getElementById('avatarSection').classList.remove('hidden');
        showAvatarEditor();
      } else if (page === 'config') {
        document.getElementById('configSection').classList.remove('hidden');
      } else if (page === 'logros') {
        document.getElementById('logrosSection').classList.remove('hidden');
        showLogros();
      } else if (page === 'ranking') {
        document.getElementById('rankingSection').classList.remove('hidden');
        showRanking();
      }
    });
  }

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
    if (!editor) return;
    var html = '<div class="current-avatar" style="font-size:80px;margin-bottom:18px">' + getAvatarSrc(user.skin) + '</div>';
    html += '<h3 style="margin-bottom:14px;color:#aaa;font-family:Orbitron,monospace;font-size:14px;">Aspectos Disponibles</h3>';
    html += '<div class="skins-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">';
    for (var i = 0; i < skins.length; i++) {
      var s = skins[i];
      var owned = user.skins.indexOf(s.avatar) !== -1;
      var active = user.skin === s.avatar;
      html += '<div class="skin-item ' + (active ? 'active' : '') + ' ' + (!owned ? 'locked' : '') + '" data-skin="' + s.avatar + '" data-price="' + s.price + '" style="background:rgba(8,12,26,0.65);border:1px solid rgba(76,144,255,0.2);border-radius:12px;padding:10px 5px;cursor:pointer;text-align:center;' + (active ? 'border-color:#4cff90;background:rgba(76,255,144,0.1);' : '') + (!owned ? 'opacity:0.5;' : '') + '">';
      html += '<div style="font-size:48px;margin-bottom:6px">' + getAvatarSrc(s.avatar) + '</div>';
      html += '<div class="skin-name" style="font-size:11px;">' + s.name + '</div>';
      if (owned) {
        html += '<small class="owned" style="color:#4cff90;font-size:11px;">' + (active ? '✅ Activo' : 'Equipar') + '</small>';
      } else {
        html += '<small class="price" style="color:#ffd700;font-size:11px;">💰 ' + s.price + '</small>';
      }
      html += '</div>';
    }
    html += '</div>';
    editor.innerHTML = html;

    var items = editor.querySelectorAll('.skin-item');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click', (function(item) {
        return function() {
          var skin = item.dataset.skin;
          var price = Number(item.dataset.price);
          var owned = user.skins.indexOf(skin) !== -1;
          if (owned) {
            user.skin = skin;
            saveUser();
            document.getElementById('avatarDisplay').innerHTML = '<div style="font-size:96px;filter:drop-shadow(0 0 22px rgba(76,144,255,0.55));animation:levitate 3s ease-in-out infinite">' + getAvatarSrc(skin) + '</div>';
            showAvatarEditor();
          } else if (user.coins >= price) {
            user.coins -= price;
            user.skins.push(skin);
            user.skin = skin;
            user.totalMonedas = (user.totalMonedas || 0) + price;
            saveUser();
            document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
            document.getElementById('avatarDisplay').innerHTML = '<div style="font-size:96px;filter:drop-shadow(0 0 22px rgba(76,144,255,0.55));animation:levitate 3s ease-in-out infinite">' + getAvatarSrc(skin) + '</div>';
            showAvatarEditor();
          } else {
            alert('❌ Necesitas ' + price + ' 💰 (tienes ' + user.coins + ')');
          }
        };
      })(items[j]));
    }
  }

  var logrosData = [
    { id: 'mision3', icon: '🏆', title: 'Primeros Pasos', desc: 'Completa 3 problemas en modo infinito' },
    { id: 'mision10', icon: '🎯', title: 'En Racha', desc: 'Completa 10 problemas en modo infinito' },
    { id: 'mision50', icon: '💫', title: 'Imparable', desc: 'Completa 50 problemas en modo infinito' },
    { id: 'rach5', icon: '🔥', title: 'Racha x5', desc: '5 respuestas correctas seguidas en quiz' },
    { id: 'rach10', icon: '⚡', title: 'Racha x10', desc: '10 respuestas correctas seguidas en quiz' },
    { id: 'rach20', icon: '🌪️', title: 'Racha x20', desc: '20 respuestas correctas seguidas en quiz' },
    { id: 'nivel5', icon: '📈', title: 'Nivel 5', desc: 'Llega al nivel 5' },
    { id: 'nivel10', icon: '⭐', title: 'Nivel 10', desc: 'Llega al nivel 10' },
    { id: 'nivel20', icon: '🌟', title: 'Nivel 20', desc: 'Llega al nivel 20' },
    { id: 'nivel50', icon: '👑', title: 'Leyenda', desc: 'Llega al nivel 50' }
  ];

  function showLogros() {
    var list = document.getElementById('logrosList');
    if (!list) return;
    var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">';
    for (var i = 0; i < logrosData.length; i++) {
      var log = logrosData[i];
      var done = user.logros[log.id];
      html += '<div class="logro-item" style="background:rgba(8,12,26,0.65);border:1px solid ' + (done ? '#4cff90' : 'rgba(76,144,255,0.15)') + ';border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;' + (done ? 'background:rgba(76,255,144,0.07);' : '') + '">';
      html += '<div class="icon" style="font-size:36px;">' + log.icon + '</div>';
      html += '<div class="info"><h3 style="font-size:15px;">' + log.title + '</h3><p style="font-size:12px;opacity:0.7;">' + log.desc + '</p>';
      html += done ? '<small style="color:#4cff90;">✅ Completado</small>' : '<small style="color:#888;">🔒 Sin completar</small>';
      html += '</div></div>';
    }
    html += '</div>';
    list.innerHTML = html;
  }

  var infinityLevel = 0;
  var currentInfinityProblem = null;
  var infinityCount = 0;

  function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateInfinityProblem() {
    infinityLevel++;
    var type = rnd(0, 7);
    var q, a;
    if (type === 0) { var x = rnd(1, 50), y = rnd(1, 50); q = x + ' + ' + y; a = x + y; }
    else if (type === 1) { var x = rnd(10, 80), y = rnd(1, x); q = x + ' - ' + y; a = x - y; }
    else if (type === 2) { var x = rnd(2, 15), y = rnd(2, 12); q = x + ' × ' + y; a = x * y; }
    else if (type === 3) { var x = rnd(2, 15); q = x + '²'; a = x * x; }
    else if (type === 4) { var x = rnd(2, 6), y = rnd(2, 3); q = x + '^' + y; a = Math.pow(x, y); }
    else if (type === 5) { var x = rnd(1, 9) * 10, y = rnd(1, 9) * 10; q = '(' + x + ' + ' + y + ') ÷ 2'; a = (x + y) / 2; }
    else if (type === 6) { var x = rnd(2, 9), y = rnd(2, 9), z = rnd(1, 5); q = x + ' × ' + y + ' + ' + z; a = x * y + z; }
    else { var x = rnd(2, 9), y = rnd(2, 9); q = x + ' × ' + y; a = x * y; }
    return { q: q, a: a, level: infinityLevel };
  }

  function nextProblem() {
    currentInfinityProblem = generateInfinityProblem();
    var problemBox = document.getElementById('infinityProblemBox');
    if (problemBox) {
      problemBox.innerHTML = '<div class="prob-level" style="font-size:12px;color:#4c90ff;margin-bottom:10px;">Problema #' + currentInfinityProblem.level + '</div>' +
        '<div class="prob-question" style="font-family:Orbitron,monospace;font-size:34px;">' + currentInfinityProblem.q + ' = ?</div>';
    }
    var inputField = document.getElementById('infinityEquation');
    if (inputField) inputField.value = '';
    var resultDiv = document.getElementById('infinityResult');
    if (resultDiv) resultDiv.innerHTML = '';
  }

  var solveBtn = document.getElementById('infinitySolveBtn');
  if (solveBtn) {
    solveBtn.onclick = function() {
      var input = document.getElementById('infinityEquation').value.trim();
      if (!currentInfinityProblem) return;
      if (Number(input) === currentInfinityProblem.a) {
        infinityCount++;
        user.coins += 2;
        user.xp += 5;
        user.misionesCompletas = (user.misionesCompletas || 0) + 1;
        user.totalMonedas = (user.totalMonedas || 0) + 2;
        if (user.misionesCompletas >= 3) user.logros.mision3 = true;
        if (user.misionesCompletas >= 10) user.logros.mision10 = true;
        if (user.misionesCompletas >= 50) user.logros.mision50 = true;
        if (user.totalMonedas >= 500) user.logros.millonario = true;
        if (user.totalMonedas >= 1000) user.logros.monedas1000 = true;
        saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
        document.getElementById('infinityResult').innerHTML = '<span style="color:#4cff90;">✅ ¡Correcto! +2💰 +5⭐</span>';
        setTimeout(nextProblem, 1000);
      } else {
        document.getElementById('infinityResult').innerHTML = '<span style="color:#ff4d6d;">❌ Incorrecto. Era: <strong>' + currentInfinityProblem.a + '</strong></span>';
      }
    };
  }
}

loadUser();
