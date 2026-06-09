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

var currentUser = localStorage.getItem('currentUser');
if (!currentUser) window.location.href = 'index.html';

var user = null;
var userRef = null;

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  if (!user.logros) user.logros = {};
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.totalMonedas) user.totalMonedas = 0;
  if (!user.skins) user.skins = ['spiderman'];
  if (!user.skin) user.skin = 'spiderman';
  if (!user.misionesCompletas) user.misionesCompletas = 0;
  if (!user.infinityBestStreak) user.infinityBestStreak = 0;
  if (!user.stats) user.stats = {};
  initMenu();
}

async function saveUser() {
  await setDoc(userRef, user);
}

// ── Nivel / XP ───────────────────────────────────────────────────────────────
function calcLevel() {
  var lvl = 1, needed = 100, total = user.xp;
  while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
  return lvl;
}
function xpInCurrentLevel() {
  var lvl = 1, needed = 100, total = user.xp;
  while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
  return { current: total, needed: needed, level: lvl };
}
function renderXPBar(containerId) {
  var prog = xpInCurrentLevel();
  var pct = Math.round((prog.current / prog.needed) * 100);
  document.getElementById('displayXP').innerHTML = '⭐ Nv.' + prog.level + ' <span style="font-size:11px;opacity:0.7">(' + user.xp + ' XP)</span>';
  var bar = document.getElementById(containerId || 'xpBarMenu');
  if (bar) {
    bar.innerHTML =
      '<div style="font-size:11px;color:#a78bfa;margin-bottom:3px">'+prog.current+' / '+prog.needed+' XP (Nivel '+(prog.level+1)+')</div>' +
      '<div style="background:rgba(167,139,250,0.15);border-radius:20px;height:8px;overflow:hidden;border:1px solid rgba(167,139,250,0.25)">' +
        '<div style="background:linear-gradient(90deg,#9b59ff,#4c90ff);height:100%;width:'+pct+'%;border-radius:20px;transition:width 0.5s"></div>' +
      '</div>';
  }
}

// ── Audio ────────────────────────────────────────────────────────────────────
var audioCtx2 = null;
function getACtx() { if (!audioCtx2) audioCtx2 = new (window.AudioContext||window.webkitAudioContext)(); return audioCtx2; }
function playSound(type) {
  try {
    var ctx = getACtx();
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'correct') {
      osc.type='sine'; osc.frequency.setValueAtTime(523,ctx.currentTime); osc.frequency.setValueAtTime(784,ctx.currentTime+0.12);
      gain.gain.setValueAtTime(0.15,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
      osc.start(); osc.stop(ctx.currentTime+0.4);
    } else {
      osc.type='sawtooth'; osc.frequency.setValueAtTime(200,ctx.currentTime); osc.frequency.setValueAtTime(110,ctx.currentTime+0.15);
      gain.gain.setValueAtTime(0.1,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);
      osc.start(); osc.stop(ctx.currentTime+0.3);
    }
  } catch(e){}
}

function getAvatarSrc(name) {
  var jpgList = ['batman', 'kakashi'];
  return jpgList.indexOf(name) !== -1 ? name + '.jpg' : name + '.png';
}

function initMenu() {
  document.getElementById('displayUsername').textContent = currentUser;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
  renderXPBar('xpBarMenu');

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
    var tracks = { ciudad:'ciudad.mp3', galaxia:'galaxia.mp3', parque:'parque.mp3', fondo1:'bosque.mp3', fondo2:'neon.mp3' };
    if (tracks[bg]) {
      currentAudio = new Audio(tracks[bg]);
      currentAudio.loop = true; currentAudio.volume = 0.3;
      currentAudio.play().catch(function(){});
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
      if (page === 'game') { window.location.href = 'game.html'; }
      else if (page === 'infinito') { document.getElementById('infinitoSection').classList.remove('hidden'); if (!currentInfinityProblem) nextProblem(); }
      else if (page === 'avatar') { document.getElementById('avatarSection').classList.remove('hidden'); showAvatarEditor(); }
      else if (page === 'config') { document.getElementById('configSection').classList.remove('hidden'); }
      else if (page === 'logros') { document.getElementById('logrosSection').classList.remove('hidden'); showLogros(); }
    });
  }

  // ── Tienda de skins ──────────────────────────────────────────────────────
  var skins = [
    { avatar:'spiderman', name:'Spider-Man', price:0   },
    { avatar:'batman',    name:'Batman',     price:80  },
    { avatar:'goku',      name:'Goku',       price:200 },
    { avatar:'ironman',   name:'Iron Man',   price:150 },
    { avatar:'sasuke',    name:'Sasuke',     price:140 },
    { avatar:'kakashi',   name:'Kakashi',    price:120 },
    { avatar:'vegeta',    name:'Vegeta',     price:210 },
    { avatar:'itachi',    name:'Itachi',     price:220 },
    { avatar:'zoro',      name:'Zoro',       price:95  },
    { avatar:'luffy',     name:'Luffy',      price:110 }
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
      html += '<div class="skin-item '+(active?'active':'')+' '+(!owned?'locked':'')+'" data-skin="'+s.avatar+'" data-price="'+s.price+'" style="position:relative">';
      html += '<img src="'+getAvatarSrc(s.avatar)+'" onerror="this.style.display=\'none\'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:6px;border:2px solid '+(active?'#4cff90':'rgba(76,144,255,0.3)') + '"/>';
      html += '<div class="skin-name">'+s.name+'</div>';
      html += owned ? '<small class="owned">'+(active?'✅ Activo':'Equipar')+'</small>' : '<small class="price">💰 '+s.price+'</small>';
      if (!owned) html += '<div style="position:absolute;top:6px;right:6px;font-size:14px">🔒</div>';
      html += '</div>';
    }
    html += '</div>';
    editor.innerHTML = html;

    var items = editor.querySelectorAll('.skin-item');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click', function() {
        var skin = this.dataset.skin, price = Number(this.dataset.price);
        var owned = user.skins.indexOf(skin) !== -1;
        if (owned) {
          user.skin = skin; saveUser();
          document.getElementById('avatarDisplay').innerHTML = '<img src="'+getAvatarSrc(skin)+'" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>';
          showAvatarEditor();
        } else if (user.coins >= price) {
          user.coins -= price; user.skins.push(skin); user.skin = skin;
          user.logros.comprador = true;
          if (user.skins.length >= 5) user.logros.coleccionista = true;
          saveUser();
          document.getElementById('displayCoins').textContent = '💰 '+user.coins+' monedas';
          document.getElementById('avatarDisplay').innerHTML = '<img src="'+getAvatarSrc(skin)+'" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #4c90ff;box-shadow:0 0 22px rgba(76,144,255,0.55)"/>';
          showAvatarEditor();
        } else { alert('❌ Necesitas '+price+' 💰 (tienes '+user.coins+')'); }
      });
    }
  }

  // ── Logros ───────────────────────────────────────────────────────────────
  var logrosData = [
    { id:'mision3',       icon:'🏆', title:'Primeros Pasos',  desc:'Completa 3 problemas en modo infinito'       },
    { id:'mision10',      icon:'🎯', title:'En Racha',        desc:'Completa 10 problemas en modo infinito'      },
    { id:'mision50',      icon:'💫', title:'Imparable',       desc:'Completa 50 problemas en modo infinito'      },
    { id:'rach5',         icon:'🔥', title:'Racha x5',        desc:'5 respuestas correctas seguidas en quiz'     },
    { id:'rach10',        icon:'⚡', title:'Racha x10',       desc:'10 respuestas correctas seguidas en quiz'    },
    { id:'rach20',        icon:'🌪️', title:'Racha x20',       desc:'20 respuestas correctas seguidas en quiz'    },
    { id:'nivel5',        icon:'📈', title:'Nivel 5',         desc:'Llega al nivel 5'                            },
    { id:'nivel10',       icon:'⭐', title:'Nivel 10',        desc:'Llega al nivel 10'                           },
    { id:'nivel20',       icon:'🌟', title:'Nivel 20',        desc:'Llega al nivel 20'                           },
    { id:'nivel50',       icon:'👑', title:'Leyenda',         desc:'Llega al nivel 50'                           },
    { id:'experto1',      icon:'💎', title:'Experto',         desc:'Responde 1 pregunta en dificultad Experto'   },
    { id:'experto10',     icon:'🔮', title:'Gran Experto',    desc:'Responde 10 preguntas en dificultad Experto' },
    { id:'comprador',     icon:'🛍️', title:'Comprador',       desc:'Compra tu primer aspecto'                    },
    { id:'coleccionista', icon:'🎨', title:'Coleccionista',   desc:'Desbloquea 5 aspectos'                       },
    { id:'millonario',    icon:'💰', title:'Millonario',      desc:'Acumula 500 monedas en total'                },
    { id:'monedas1000',   icon:'🤑', title:'Rico Rico',       desc:'Acumula 1000 monedas en total'               },
    { id:'facil50',       icon:'😊', title:'Calentando',      desc:'Responde 50 preguntas en dificultad Fácil'   },
    { id:'normal50',      icon:'😐', title:'Constante',       desc:'Responde 50 preguntas en dificultad Normal'  },
    { id:'dificil20',     icon:'😤', title:'Valiente',        desc:'Responde 20 preguntas en dificultad Difícil' },
    { id:'perfecto',      icon:'✨', title:'Perfeccionista',  desc:'Completa un quiz sin fallar ninguna'         }
  ];

  function showLogros() {
    var list = document.getElementById('logrosList');
    var done = logrosData.filter(function(l){return user.logros[l.id];}).length;
    var html = '<p style="color:#888;font-size:13px;margin-bottom:14px">'+done+' / '+logrosData.length+' completados</p>';
    for (var i = 0; i < logrosData.length; i++) {
      var log = logrosData[i], achieved = user.logros[log.id];
      html += '<div class="logro-item '+(achieved?'achieved':'')+'">';
      html += '<div class="icon">'+log.icon+'</div>';
      html += '<div class="info"><h3>'+log.title+'</h3><p>'+log.desc+'</p>';
      html += achieved ? '<small style="color:#4cff90">✅ Completado</small>' : '<small style="color:#888">🔒 Sin completar</small>';
      html += '</div></div>';
    }
    list.innerHTML = html;
  }

  // ── Modo Infinito ────────────────────────────────────────────────────────
  var infinityLevel = 0;
  var currentInfinityProblem = null;
  var infinityCount = 0;
  var infinitySessionStreak = 0;

  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateInfinityProblem() {
    infinityLevel++;
    var type = rnd(0, 7);
    var q, a;
    if (type === 0) { var x=rnd(1,50),y=rnd(1,50); q=x+' + '+y; a=x+y; }
    else if (type === 1) { var x=rnd(10,80),y=rnd(1,x); q=x+' − '+y; a=x-y; }
    else if (type === 2) { var x=rnd(2,15),y=rnd(2,12); q=x+' × '+y; a=x*y; }
    else if (type === 3) { var x=rnd(2,12); q=x+'²'; a=x*x; }
    else if (type === 4) { var x=rnd(2,6),y=rnd(2,3); q=x+'^'+y; a=Math.pow(x,y); }
    else if (type === 5) { var x=rnd(1,9)*10,y=rnd(1,9)*10; q='('+x+' + '+y+') ÷ 2'; a=(x+y)/2; }
    else if (type === 6) { var x=rnd(2,9),y=rnd(2,9),z=rnd(1,5); q=x+' × '+y+' + '+z; a=x*y+z; }
    else { var base=rnd(2,12); q='√'+(base*base); a=base; }
    return { q: q, a: a, level: infinityLevel };
  }

  function nextProblem() {
    currentInfinityProblem = generateInfinityProblem();
    var bestStreak = user.infinityBestStreak || 0;
    document.getElementById('infinityProblemBox').innerHTML =
      '<div class="prob-level">Problema #'+currentInfinityProblem.level+'</div>' +
      '<div class="prob-question">'+currentInfinityProblem.q+' = ?</div>' +
      (bestStreak > 0 ? '<div style="font-size:12px;color:#ffd700;margin-top:8px">🏆 Mejor racha: '+bestStreak+'</div>' : '');
    document.getElementById('infinityEquation').value = '';
    document.getElementById('infinityResult').innerHTML = '';
  }

  function verifyInfinity() {
    var input = document.getElementById('infinityEquation').value.trim();
    if (!currentInfinityProblem) return;
    if (Number(input) === currentInfinityProblem.a) {
      playSound('correct');
      infinityCount++; infinitySessionStreak++;
      user.coins += 2; user.xp += 5;
      user.totalMonedas = (user.totalMonedas||0) + 2;
      user.misionesCompletas = (user.misionesCompletas||0) + 1;
      if (infinitySessionStreak > (user.infinityBestStreak||0)) {
        user.infinityBestStreak = infinitySessionStreak;
      }
      if (user.misionesCompletas >= 3)  user.logros.mision3  = true;
      if (user.misionesCompletas >= 10) user.logros.mision10 = true;
      if (user.misionesCompletas >= 50) user.logros.mision50 = true;
      if (user.totalMonedas >= 500)  user.logros.millonario  = true;
      if (user.totalMonedas >= 1000) user.logros.monedas1000 = true;
      if (calcLevel() >= 5)  user.logros.nivel5  = true;
      if (calcLevel() >= 10) user.logros.nivel10 = true;
      saveUser();
      document.getElementById('displayCoins').textContent = '💰 '+user.coins+' monedas';
      renderXPBar('xpBarMenu');
      document.getElementById('infinityResult').innerHTML = '<span class="correct">✅ ¡Correcto! +2💰 +5⭐ &nbsp; Racha: '+infinitySessionStreak+'</span>';
      setTimeout(nextProblem, 1000);
    } else {
      playSound('wrong');
      infinitySessionStreak = 0;
      document.getElementById('infinityResult').innerHTML = '<span class="wrong">❌ Incorrecto. Era: <strong>'+currentInfinityProblem.a+'</strong></span>';
    }
  }

  document.getElementById('infinitySolveBtn').onclick = verifyInfinity;

  // Enter en el input de modo infinito
  document.getElementById('infinityEquation').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') verifyInfinity();
  });
}

loadUser();
