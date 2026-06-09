import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  if (!user.logros) user.logros = { mision3: false, rach5: false, nivel10: false, experto1: false, comprador: false };
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.skins) user.skins = ['spiderman'];
  if (!user.skin) user.skin = 'spiderman';
  if (!user.misionesCompletas) user.misionesCompletas = 0;
  initMenu();
}

async function saveUser() {
  await setDoc(userRef, user);
}

function getAvatarSrc(name) {
  var jpgList = ['batman', 'kakashi'];
  if (jpgList.indexOf(name) !== -1) return name + '.jpg';
  return name + '.png';
}

function initMenu() {
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
      } else if (page === 'ranking') {
        document.getElementById('rankingSection').classList.remove('hidden');
        showRanking();
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

  var rankingUnsub = null;

  function showRanking() {
    var list = document.getElementById('rankingList');
    list.innerHTML = '<div style="text-align:center;padding:30px;color:#4c90ff;font-family:Orbitron,monospace;font-size:13px;letter-spacing:2px">⏳ CARGANDO...</div>';

    // Cancelar listener anterior si existe
    if (rankingUnsub) rankingUnsub();

    var q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(20));

    rankingUnsub = onSnapshot(q, function(snapshot) {
      var players = [];
      snapshot.forEach(function(docSnap) {
        var d = docSnap.data();
        players.push({
          name: docSnap.id,
          xp: d.xp || 0,
          coins: d.coins || 0,
          skin: d.skin || 'spiderman',
          level: calcLevelFrom(d.xp || 0)
        });
      });

      if (players.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#555;padding:30px">Nadie en el ranking aún. ¡Sé el primero!</p>';
        return;
      }

      var medals = ['🥇', '🥈', '🥉'];
      var podiumColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

      var html = '';

      // Podio top 3
      if (players.length >= 1) {
        html += '<div style="display:flex;justify-content:center;align-items:flex-end;gap:12px;margin-bottom:28px;padding:20px 10px 0">';

        var podiumOrder = players.length >= 3 ? [players[1], players[0], players[2]] : players.length === 2 ? [players[1], players[0]] : [players[0]];
        var podiumHeights = ['80px', '110px', '60px'];
        var podiumPos = players.length >= 3 ? [1, 0, 2] : players.length === 2 ? [1, 0] : [0];

        for (var pi = 0; pi < podiumOrder.length; pi++) {
          var p = podiumOrder[pi];
          var realPos = podiumPos[pi];
          var col = podiumColors[realPos];
          var isMe = p.name === currentUser;
          html += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px">';
          html += '<div style="font-size:24px">' + getAvatarSrc(p.skin).replace(/\.(png|jpg)$/, '') + '</div>';
          html += '<div style="font-size:' + (realPos===0?'14px':'12px') + ';font-weight:700;color:' + col + ';font-family:Orbitron,monospace;max-width:80px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' + (isMe ? ';text-shadow:0 0 10px '+col : '') + '">' + p.name + (isMe ? ' 👈' : '') + '</div>';
          html += '<div style="font-size:11px;color:#aaa">Nv.' + p.level + ' · ' + p.xp + ' XP</div>';
          html += '<div style="width:80px;height:' + podiumHeights[pi] + ';background:linear-gradient(180deg,rgba(' + (realPos===0?'255,215,0':'realPos===1?192,192,192':205+',127,50') + ',0.25),rgba(0,0,0,0.1));border:2px solid ' + col + ';border-bottom:none;border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:8px;font-size:22px">' + medals[realPos] + '</div>';
          html += '</div>';
        }
        html += '</div>';
        html += '<div style="height:3px;background:linear-gradient(90deg,transparent,rgba(76,144,255,0.5),transparent);margin-bottom:20px;border-radius:2px"></div>';
      }

      // Lista completa
      html += '<div style="display:flex;flex-direction:column;gap:8px">';
      for (var i = 0; i < players.length; i++) {
        var p = players[i];
        var isMe = p.name === currentUser;
        var medal = i < 3 ? medals[i] : '<span style="font-family:Orbitron,monospace;font-size:13px;color:#555">#' + (i+1) + '</span>';
        var barWidth = Math.max(4, Math.round((p.xp / (players[0].xp || 1)) * 100));

        html += '<div style="background:' + (isMe ? 'rgba(76,144,255,0.15)' : 'rgba(8,12,26,0.7)') + ';border:1px solid ' + (isMe ? 'rgba(76,144,255,0.6)' : 'rgba(76,144,255,0.12)') + ';border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all 0.2s" ' + (isMe ? 'id="myRankRow"' : '') + '>';
        html += '<div style="width:32px;text-align:center;flex-shrink:0">' + medal + '</div>';
        html += '<div style="font-size:28px;flex-shrink:0">🎮</div>';
        html += '<div style="flex:1;min-width:0">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">';
        html += '<span style="font-weight:700;font-size:15px;color:' + (isMe ? '#4c90ff' : '#e8eaff') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + p.name + (isMe ? ' <span style="font-size:11px;background:rgba(76,144,255,0.25);padding:2px 7px;border-radius:10px;color:#4c90ff">TÚ</span>' : '') + '</span>';
        html += '<span style="font-family:Orbitron,monospace;font-size:12px;color:#a78bfa;flex-shrink:0;margin-left:8px">Nv.' + p.level + '</span>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:8px">';
        html += '<div style="flex:1;height:6px;background:rgba(76,144,255,0.12);border-radius:3px;overflow:hidden">';
        html += '<div style="height:100%;width:' + barWidth + '%;background:linear-gradient(90deg,' + (i===0?'#ffd700':'#4c90ff') + ',' + (i===0?'#ff9500':'#9b59ff') + ');border-radius:3px;transition:width 0.8s ease"></div>';
        html += '</div>';
        html += '<span style="font-size:12px;color:#ffd700;white-space:nowrap">⭐ ' + p.xp + ' XP</span>';
        html += '<span style="font-size:12px;color:#4cff90;white-space:nowrap">💰 ' + p.coins + '</span>';
        html += '</div></div></div>';
      }
      html += '</div>';
      html += '<p style="text-align:center;font-size:11px;color:#333;margin-top:16px;font-family:Orbitron,monospace;letter-spacing:1px">🔴 EN VIVO · Se actualiza automáticamente</p>';

      list.innerHTML = html;

      // Scroll automático a tu posición si no está visible
      if (isMe) {
        var myRow = document.getElementById('myRankRow');
        if (myRow) setTimeout(function() { myRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 300);
      }
    }, function(err) {
      list.innerHTML = '<p style="color:#ff4d6d;text-align:center;padding:20px">❌ Error al cargar el ranking. Revisa tu conexión.</p>';
    });
  }

  function calcLevelFrom(xp) {
    var lvl = 1, needed = 100, total = xp;
    while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
    return lvl;
  }


    { id: 'mision3',       icon: '🏆', title: 'Primeros Pasos',  desc: 'Completa 3 problemas en modo infinito'       },
    { id: 'mision10',      icon: '🎯', title: 'En Racha',        desc: 'Completa 10 problemas en modo infinito'      },
    { id: 'mision50',      icon: '💫', title: 'Imparable',       desc: 'Completa 50 problemas en modo infinito'      },
    { id: 'rach5',         icon: '🔥', title: 'Racha x5',        desc: '5 respuestas correctas seguidas en quiz'     },
    { id: 'rach10',        icon: '⚡', title: 'Racha x10',       desc: '10 respuestas correctas seguidas en quiz'    },
    { id: 'rach20',        icon: '🌪️', title: 'Racha x20',       desc: '20 respuestas correctas seguidas en quiz'    },
    { id: 'nivel5',        icon: '📈', title: 'Nivel 5',         desc: 'Llega al nivel 5'                            },
    { id: 'nivel10',       icon: '⭐', title: 'Nivel 10',        desc: 'Llega al nivel 10'                           },
    { id: 'nivel20',       icon: '🌟', title: 'Nivel 20',        desc: 'Llega al nivel 20'                           },
    { id: 'nivel50',       icon: '👑', title: 'Leyenda',         desc: 'Llega al nivel 50'                           },
    { id: 'experto1',      icon: '💎', title: 'Experto',         desc: 'Responde 1 pregunta en dificultad Experto'   },
    { id: 'experto10',     icon: '🔮', title: 'Gran Experto',    desc: 'Responde 10 preguntas en dificultad Experto' },
    { id: 'comprador',     icon: '🛍️', title: 'Comprador',       desc: 'Compra tu primer aspecto'                    },
    { id: 'coleccionista', icon: '🎨', title: 'Coleccionista',   desc: 'Desbloquea 5 aspectos'                       },
    { id: 'millonario',    icon: '💰', title: 'Millonario',      desc: 'Acumula 500 monedas en total'                },
    { id: 'monedas1000',   icon: '🤑', title: 'Rico Rico',       desc: 'Acumula 1000 monedas en total'               },
    { id: 'facil50',       icon: '😊', title: 'Calentando',      desc: 'Responde 50 preguntas en dificultad Fácil'   },
    { id: 'normal50',      icon: '😐', title: 'Constante',       desc: 'Responde 50 preguntas en dificultad Normal'  },
    { id: 'dificil20',     icon: '😤', title: 'Valiente',        desc: 'Responde 20 preguntas en dificultad Difícil' },
    { id: 'perfecto',      icon: '✨', title: 'Perfeccionista',  desc: 'Completa un quiz sin fallar ninguna'         }
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
}

loadUser();
