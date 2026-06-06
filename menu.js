var currentUser = localStorage.getItem('currentUser');
if (!currentUser) window.location.href = 'index.html';

var users = JSON.parse(localStorage.getItem('users') || '{}');
var user = users[currentUser];

if (!user) window.location.href = 'index.html';
if (!user.logros) user.logros = { mision3: false, rach5: false, nivel10: false, experto1: false, comprador: false };
if (!user.xp) user.xp = 0;
if (!user.coins) user.coins = 0;
if (!user.skins) user.skins = ['spiderman'];
if (!user.skin) user.skin = 'spiderman';
if (!user.misionesCompletas) user.misionesCompletas = 0;

function saveUser() { localStorage.setItem('users', JSON.stringify(users)); }

function getAvatarSrc(name) {
  var jpgList = ['batman', 'kakashi'];
  if (jpgList.indexOf(name) !== -1) return name + '.jpg';
  return name + '.png';
}

document.getElementById('displayUsername').textContent = currentUser;
document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';

var initSkin = user.skin || 'spiderman';
document.getElementById('avatarDisplay').innerHTML = '<img src="' + getAvatarSrc(initSkin) + '" onerror="this.outerHTML=\'🦸\'" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>';

var savedBg = localStorage.getItem('background') || 'ciudad';
document.body.className = savedBg;
document.getElementById('backgroundSelect').value = savedBg;

var currentAudio = null;

function playMusic(bg) {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  var musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
  if (!musicEnabled) return;
  var tracks = {
    ciudad:  'ciudad.mp3',
    galaxia: 'galaxia.mp3',
    parque:  'parque.mp3',
    fondo1:  'bosque.mp3',
    fondo2:  'neon.mp3'
  };
  if (tracks[bg]) {
    currentAudio = new Audio(tracks[bg]);
    currentAudio.loop = true;
    currentAudio.volume = 0.3;
    currentAudio.play().catch(function() {});
  }
}

var musicToggle = document.getElementById('musicToggle');
musicToggle.checked = localStorage.getItem('musicEnabled') !== 'false';
musicToggle.addEventListener('change', function(e) {
  localStorage.setItem('musicEnabled', e.target.checked);
  if (e.target.checked) playMusic(document.getElementById('backgroundSelect').value);
  else if (currentAudio) { currentAudio.pause(); currentAudio = null; }
});

document.getElementById('backgroundSelect').addEventListener('change', function(e) {
  document.body.className = e.target.value;
  localStorage.setItem('background', e.target.value);
  playMusic(e.target.value);
});

playMusic(savedBg);

document.getElementById('logoutBtn').onclick = function() {
  if (currentAudio) currentAudio.pause();
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
};

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
    }
  });
}

var skins = [
  { avatar: 'spiderman', name: 'Spider-Man', price: 0   },
  { avatar: 'batman',    name: 'Batman',     price: 80  },
  { avatar: 'goku',      name: 'Goku',       price: 200 },
  { avatar: 'ironman',   name: 'Iron Man',   price: 150 },
  { avatar: 'sasuke',    name: 'Sasuke',     price: 140 },
  { avatar: 'kakashi',   name: 'Kakashi',    price: 120 },
  { avatar: 'vegeta',    name: 'Vegeta',     price: 210 },
  { avatar: 'itachi',    name: 'Itachi',     price: 220 },
  { avatar: 'zoro',      name: 'Zoro',       price: 95  },
  { avatar: 'luffy',     name: 'Luffy',      price: 110 }
];

function showAvatarEditor() {
  var editor = document.getElementById('avatarEditor');
  var html = '<div class="current-avatar"><img src="' + getAvatarSrc(user.skin) + '" onerror="this.style.display=\'none\'" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 24px rgba(76,144,255,0.7)"/></div>';
  html += '<h3 style="margin-bottom:14px;color:#aaa;font-family:Orbitron,monospace;font-size:14px;">Aspectos Disponibles</h3>';
  html += '<div class="skins-grid">';
  for (var i = 0; i < skins.length; i++) {
    var s = skins[i];
    var owned = user.skins.indexOf(s.avatar) !== -1;
    var active = user.skin === s.avatar;
    html += '<div class="skin-item ' + (active ? 'active' : '') + ' ' + (!owned ? 'locked' : '') + '" data-skin="' + s.avatar + '" data-price="' + s.price + '" style="position:relative">';
    html += '<img src="' + getAvatarSrc(s.avatar) + '" onerror="this.style.display=\'none\'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:6px;border:2px solid ' + (active ? '#4cff90' : 'rgba(76,144,255,0.3)') + '"/>';
    html += '<div class="skin-name">' + s.name + '</div>';
    if (owned) {
      html += '<small class="owned">' + (active ? '✅ Activo' : 'Equipar') + '</small>';
    } else {
      html += '<small class="price">💰 ' + s.price + '</small>';
    }
    if (!owned) html += '<div style="position:absolute;top:6px;right:6px;font-size:14px">🔒</div>';
    html += '</div>';
  }
  html += '</div>';
  editor.innerHTML = html;

  var items = editor.querySelectorAll('.skin-item');
  for (var j = 0; j < items.length; j++) {
    items[j].addEventListener('click', function() {
      var skin = this.dataset.skin;
      var price = Number(this.dataset.price);
      var owned = user.skins.indexOf(skin) !== -1;
      if (owned) {
        user.skin = skin;
        saveUser();
        document.getElementById('avatarDisplay').innerHTML = '<img src="' + getAvatarSrc(skin) + '" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>';
        showAvatarEditor();
      } else if (user.coins >= price) {
        user.coins -= price;
        user.skins.push(skin);
        user.skin = skin;
        user.logros.comprador = true;
        saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
        document.getElementById('avatarDisplay').innerHTML = '<img src="' + getAvatarSrc(skin) + '" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>';
        showAvatarEditor();
      } else {
        alert('❌ Necesitas ' + price + ' 💰 (tienes ' + user.coins + ')');
      }
    });
  }
}

var logrosData = [
  { id: 'mision3',      icon: '🏆', title: 'Primeros Pasos',  desc: 'Completa 3 problemas en modo infinito',       skin: null       },
  { id: 'mision10',     icon: '🎯', title: 'En Racha',        desc: 'Completa 10 problemas en modo infinito',      skin: null       },
  { id: 'mision50',     icon: '💫', title: 'Imparable',       desc: 'Completa 50 problemas en modo infinito',      skin: 'saitama'  },
  { id: 'rach5',        icon: '🔥', title: 'Racha x5',        desc: '5 respuestas correctas seguidas en quiz',     skin: null       },
  { id: 'rach10',       icon: '⚡', title: 'Racha x10',       desc: '10 respuestas correctas seguidas en quiz',    skin: 'itachi'   },
  { id: 'rach20',       icon: '🌪️', title: 'Racha x20',       desc: '20 respuestas correctas seguidas en quiz',    skin: 'vegeta'   },
  { id: 'nivel5',       icon: '📈', title: 'Nivel 5',         desc: 'Llega al nivel 5',                            skin: null       },
  { id: 'nivel10',      icon: '⭐', title: 'Nivel 10',        desc: 'Llega al nivel 10',                           skin: 'sasuke'   },
  { id: 'nivel20',      icon: '🌟', title: 'Nivel 20',        desc: 'Llega al nivel 20',                           skin: 'goku'     },
  { id: 'nivel50',      icon: '👑', title: 'Leyenda',         desc: 'Llega al nivel 50',                           skin: 'vegeta'   },
  { id: 'experto1',     icon: '💎', title: 'Experto',         desc: 'Responde 1 pregunta en dificultad Experto',   skin: null       },
  { id: 'experto10',    icon: '🔮', title: 'Gran Experto',    desc: 'Responde 10 preguntas en dificultad Experto', skin: 'itachi'   },
  { id: 'comprador',    icon: '🛍️', title: 'Comprador',       desc: 'Compra tu primer aspecto',                    skin: null       },
  { id: 'coleccionista',icon: '🎨', title: 'Coleccionista',   desc: 'Desbloquea 5 aspectos',                       skin: 'ironman'  },
  { id: 'millonario',   icon: '💰', title: 'Millonario',      desc: 'Acumula 500 monedas en total',                skin: null       },
  { id: 'monedas1000',  icon: '🤑', title: 'Rico Rico',       desc: 'Acumula 1000 monedas en total',               skin: 'luffy'    },
  { id: 'facil50',      icon: '😊', title: 'Calentando',      desc: 'Responde 50 preguntas en dificultad Fácil',   skin: null       },
  { id: 'normal50',     icon: '😐', title: 'Constante',       desc: 'Responde 50 preguntas en dificultad Normal',  skin: 'zoro'     },
  { id: 'dificil20',    icon: '😤', title: 'Valiente',        desc: 'Responde 20 preguntas en dificultad Difícil', skin: 'kakashi'  },
  { id: 'perfecto',     icon: '✨', title: 'Perfeccionista',  desc: 'Completa un quiz sin fallar ninguna',         skin: 'spiderman'}
];

function showLogros() {
  var list = document.getElementById('logrosList');
  var html = '';
  for (var i = 0; i < logrosData.length; i++) {
    var log = logrosData[i];
    var done = user.logros[log.id];
    html += '<div class="logro-item ' + (done ? 'achieved' : '') + '">';
    html += '<div class="icon">' + log.icon + '</div>';
    html += '<div class="info"><h3>' + log.title + '</h3><p>' + log.desc + '</p>';
    if (log.skin) html += '<p style="font-size:12px;color:#9b59ff">🎁 Recompensa: ' + log.skin + '</p>';
    html += done ? '<small style="color:#4cff90">✅ Completado</small>' : '<small style="color:#888">🔒 Sin completar</small>';
    html += '</div></div>';
  }
  list.innerHTML = html;
}

var infinityLevel = 0;
var currentInfinityProblem = null;
var infinityCount = 0;

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateInfinityProblem() {
  infinityLevel++;
  var type = rnd(0, 7);
  var q, a;
  if (type === 0) { var x=rnd(1,50),y=rnd(1,50); q=x+' + '+y; a=x+y; }
  else if (type === 1) { var x=rnd(10,80),y=rnd(1,x); q=x+' - '+y; a=x-y; }
  else if (type === 2) { var x=rnd(2,15),y=rnd(2,12); q=x+' × '+y; a=x*y; }
  else if (type === 3) { var x=rnd(2,12); q=x+'²'; a=x*x; }
  else if (type === 4) { var x=rnd(2,6),y=rnd(2,3); q=x+'^'+y; a=Math.pow(x,y); }
  else if (type === 5) { var x=rnd(1,9)*10,y=rnd(1,9)*10; q='('+x+' + '+y+') ÷ 2'; a=(x+y)/2; }
  else if (type === 6) { var x=rnd(2,9),y=rnd(2,9),z=rnd(1,5); q=x+' × '+y+' + '+z; a=x*y+z; }
  else { var x=rnd(2,9),y=rnd(2,9); q=x+' × '+y; a=x*y; }
  return { q: q, a: a, level: infinityLevel };
}

function nextProblem() {
  currentInfinityProblem = generateInfinityProblem();
  document.getElementById('infinityProblemBox').innerHTML =
    '<div class="prob-level">Problema #' + currentInfinityProblem.level + '</div>' +
    '<div class="prob-question">' + currentInfinityProblem.q + ' = ?</div>';
  document.getElementById('infinityEquation').value = '';
  document.getElementById('infinityResult').innerHTML = '';
}

document.getElementById('infinitySolveBtn').onclick = function() {
  var input = document.getElementById('infinityEquation').value.trim();
  if (!currentInfinityProblem) return;
  if (Number(input) === currentInfinityProblem.a) {
    infinityCount++;
    user.coins += 2;
    user.xp += 5;
    user.misionesCompletas = (user.misionesCompletas || 0) + 1;
    if (user.misionesCompletas >= 3) user.logros.mision3 = true;
    if (user.misionesCompletas >= 10) user.logros.mision10 = true;
    if (user.misionesCompletas >= 50) user.logros.mision50 = true;
    user.totalMonedas = (user.totalMonedas || 0) + 2;
    if (user.totalMonedas >= 500) user.logros.millonario = true;
    if (user.totalMonedas >= 1000) user.logros.monedas1000 = true;
    saveUser();
    document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
    document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
    document.getElementById('infinityResult').innerHTML = '<span class="correct">✅ ¡Correcto! +2💰 +5⭐</span>';
    setTimeout(nextProblem, 1000);
  } else {
    document.getElementById('infinityResult').innerHTML = '<span class="wrong">❌ Incorrecto. Era: <strong>' + currentInfinityProblem.a + '</strong></span>';
  }
};
 
