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
document.body.className = localStorage.getItem('background') || 'ciudad';
if (!currentUser) window.location.href = 'index.html';

var user = null;
var userRef = null;

async function saveUser() {
  await setDoc(userRef, user);
}

// ── Nivel basado en XP ──────────────────────────────────────────────────────
function calcLevel() {
  var lvl = 1, needed = 100, total = user.xp;
  while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
  return lvl;
}
function xpForLevel(lvl) { return lvl * 100; }
function xpInCurrentLevel() {
  var lvl = 1, needed = 100, total = user.xp;
  while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
  return { current: total, needed: needed };
}

// ── Audio (Web Audio API, sin archivos externos) ────────────────────────────
var audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playSound(type) {
  try {
    var ctx = getAudioCtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    }
  } catch(e) {}
}

// ── Barra de XP ─────────────────────────────────────────────────────────────
function renderXPBar() {
  var lvl = calcLevel();
  var prog = xpInCurrentLevel();
  var pct = Math.round((prog.current / prog.needed) * 100);
  document.getElementById('displayXP').innerHTML =
    '⭐ Nv.' + lvl + ' <span style="font-size:11px;opacity:0.7">(' + user.xp + ' XP)</span>';

  var bar = document.getElementById('xpBarContainer');
  if (bar) {
    bar.innerHTML =
      '<div style="font-size:11px;color:#a78bfa;margin-bottom:3px">XP: ' + prog.current + ' / ' + prog.needed + ' para nivel ' + (lvl+1) + '</div>' +
      '<div style="background:rgba(167,139,250,0.15);border-radius:20px;height:8px;overflow:hidden;border:1px solid rgba(167,139,250,0.25)">' +
        '<div style="background:linear-gradient(90deg,#9b59ff,#4c90ff);height:100%;width:' + pct + '%;border-radius:20px;transition:width 0.5s"></div>' +
      '</div>';
  }
}

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  if (!user.logros) user.logros = {};
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.totalMonedas) user.totalMonedas = 0;
  if (!user.stats) user.stats = { facil:0, normal:0, dificil:0, experto:0, quizStreak:0, quizBestStreak:0, perfectQuizzes:0 };

  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  renderXPBar();
  initGame();
}

// ── Variables de quiz ────────────────────────────────────────────────────────
var difficulty = 'facil';
var streak = 0;
var quizPoints = 0;
var quizErrors = 0;
var quizActive = false;
var QUIZ_LENGTH = 10;

// ── Generador de preguntas ───────────────────────────────────────────────────
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateQuestion() {
  var q = '', correct = 0, hint = '', steps = '';

  // ── FÁCIL: Las 4 operaciones básicas ──────────────────────────────────────
  if (difficulty === 'facil') {
    var t = rnd(0, 3);
    if (t === 0) {
      var a = rnd(10, 99), b = rnd(10, 99);
      q = a + ' + ' + b; correct = a + b;
      hint = 'Suma los dos números directamente.';
      steps = 'Alinea unidades con unidades y decenas con decenas, luego suma columna por columna.';
    } else if (t === 1) {
      var a = rnd(20, 99), b = rnd(5, a - 1);
      q = a + ' − ' + b; correct = a - b;
      hint = 'Resta el número pequeño al grande.';
      steps = 'Si el dígito de arriba es menor, "pide prestado" de la columna de la izquierda.';
    } else if (t === 2) {
      var a = rnd(3, 12), b = rnd(3, 12);
      q = a + ' × ' + b; correct = a * b;
      hint = 'Multiplica los dos factores. Recuerda las tablas.';
      steps = a + ' × ' + b + ' = ' + (a * b) + '. Puedes sumar ' + a + ' veces el número ' + b + '.';
    } else {
      var b = rnd(2, 12), a = b * rnd(2, 12);
      q = a + ' ÷ ' + b; correct = a / b;
      hint = '¿Cuántas veces cabe ' + b + ' en ' + a + '?';
      steps = a + ' ÷ ' + b + ' = ' + (a/b) + '  →  Verificación: ' + (a/b) + ' × ' + b + ' = ' + a;
    }

  // ── NORMAL: Potencias y radicación ────────────────────────────────────────
  } else if (difficulty === 'normal') {
    var t = rnd(0, 4);
    if (t === 0) {
      var a = rnd(3, 15);
      q = a + '²'; correct = a * a;
      hint = 'Multiplica ' + a + ' por sí mismo.';
      steps = a + '² = ' + a + ' × ' + a + ' = ' + correct;
    } else if (t === 1) {
      var a = rnd(2, 10);
      q = a + '³'; correct = a * a * a;
      hint = 'Multiplica ' + a + ' tres veces.';
      steps = a + '³ = ' + a + ' × ' + a + ' × ' + a + ' = ' + (a*a) + ' × ' + a + ' = ' + correct;
    } else if (t === 2) {
      var base = rnd(2, 15);
      q = '√' + (base * base); correct = base;
      hint = '¿Qué número multiplicado por sí mismo da ' + (base*base) + '?';
      steps = '√' + (base*base) + ' = ' + base + '  →  Verificación: ' + base + '² = ' + (base*base);
    } else if (t === 3) {
      var base = rnd(2, 8);
      q = '∛' + (base * base * base); correct = base;
      hint = '¿Qué número al cubo da ' + (base*base*base) + '?';
      steps = '∛' + (base*base*base) + ' = ' + base + '  →  Verificación: ' + base + '³ = ' + (base*base*base);
    } else {
      var base = rnd(2, 12), exp = rnd(2, 4);
      correct = Math.pow(base, exp);
      q = base + '^' + exp;
      hint = 'Multiplica ' + base + ' un total de ' + exp + ' veces.';
      steps = base + '^' + exp + ' = ' + Array(exp).fill(base).join(' × ') + ' = ' + correct;
    }

  // ── DIFÍCIL: Leyes de exponentes y propiedades de radicación ─────────────
  } else if (difficulty === 'dificil') {
    var t = rnd(0, 5);
    if (t === 0) {
      var a = rnd(2, 5), m = rnd(2, 4), n = rnd(2, 4);
      q = a + '^' + m + ' × ' + a + '^' + n + ' = ' + a + '^?';
      correct = m + n;
      hint = 'Ley: aᵐ × aⁿ = aᵐ⁺ⁿ  →  suma los exponentes.';
      steps = 'Como la base es igual (' + a + '), se suman los exponentes: ' + m + ' + ' + n + ' = ' + correct;
    } else if (t === 1) {
      var a = rnd(2, 5), n = rnd(1, 3), m = n + rnd(1, 3);
      q = a + '^' + m + ' ÷ ' + a + '^' + n + ' = ' + a + '^?';
      correct = m - n;
      hint = 'Ley: aᵐ ÷ aⁿ = aᵐ⁻ⁿ  →  resta los exponentes.';
      steps = 'Como la base es igual (' + a + '), se restan los exponentes: ' + m + ' − ' + n + ' = ' + correct;
    } else if (t === 2) {
      var a = rnd(2, 4), m = rnd(2, 3), n = rnd(2, 3);
      q = '(' + a + '^' + m + ')^' + n + ' = ' + a + '^?';
      correct = m * n;
      hint = 'Ley: (aᵐ)ⁿ = aᵐⁿ  →  multiplica los exponentes.';
      steps = 'Se multiplican los exponentes: ' + m + ' × ' + n + ' = ' + correct;
    } else if (t === 3) {
      var n = rnd(2, 7), m = rnd(2, 5);
      var inside = n * n * m;
      q = '√' + inside + ' = ? × √' + m;
      correct = n;
      hint = 'Propiedad: √(a²·b) = a·√b  →  saca el factor perfecto.';
      steps = '√' + inside + ' = √(' + n + '² × ' + m + ') = ' + n + '·√' + m + '  →  el coeficiente es ' + n;
    } else if (t === 4) {
      var a = rnd(2, 9);
      var tipo = rnd(0, 1);
      if (tipo === 0) { q = a + '^0'; correct = 1; hint = 'Todo número (excepto 0) elevado a 0 es 1.'; steps = a + '^0 = 1  (regla fundamental de exponentes)'; }
      else { q = a + '^1'; correct = a; hint = 'Todo número elevado a 1 es igual a sí mismo.'; steps = a + '^1 = ' + a; }
    } else {
      // Producto de potencias con distinta base misma potencia: (ab)^n = a^n · b^n
      var a = rnd(2, 4), b = rnd(2, 4), n = rnd(2, 3);
      q = '(' + a + '×' + b + ')^' + n + ' = ?';
      correct = Math.pow(a * b, n);
      hint = 'Ley: (a×b)ⁿ = aⁿ × bⁿ  →  calcula ' + (a*b) + '^' + n;
      steps = '(' + a + '×' + b + ')^' + n + ' = ' + (a*b) + '^' + n + ' = ' + correct;
    }

  // ── EXPERTO: Ecuaciones algebraicas ───────────────────────────────────────
  } else {
    var t = rnd(0, 4);
    if (t === 0) {
      // Cuadrática: suma de raíces = -b/a
      var r1 = rnd(1, 9), r2 = rnd(1, 9);
      var b2 = -(r1 + r2), c2 = r1 * r2;
      q = 'x² ' + (b2 < 0 ? '− ' + Math.abs(b2) : '+ ' + b2) + 'x ' + (c2 < 0 ? '− ' + Math.abs(c2) : '+ ' + c2) + ' = 0\n¿Suma de raíces?';
      correct = r1 + r2;
      hint = 'Suma de raíces = −b/a. El coeficiente de x cambiado de signo.';
      steps = 'Las raíces son x₁=' + r1 + ' y x₂=' + r2 + '. Suma = ' + r1 + ' + ' + r2 + ' = ' + correct + '.  (o bien: −b/a = −(' + b2 + ')/1 = ' + correct + ')';
    } else if (t === 1) {
      // Cuadrática: producto de raíces = c/a
      var r1 = rnd(1, 8), r2 = rnd(1, 8);
      var b2 = -(r1 + r2), c2 = r1 * r2;
      q = 'x² ' + (b2 < 0 ? '− ' + Math.abs(b2) : '+ ' + b2) + 'x ' + (c2 < 0 ? '− ' + Math.abs(c2) : '+ ' + c2) + ' = 0\n¿Producto de raíces?';
      correct = r1 * r2;
      hint = 'Producto de raíces = c/a. El término independiente dividido entre el coeficiente de x².';
      steps = 'Las raíces son x₁=' + r1 + ' y x₂=' + r2 + '. Producto = ' + r1 + ' × ' + r2 + ' = ' + correct + '.  (o bien: c/a = ' + c2 + '/1 = ' + correct + ')';
    } else if (t === 2) {
      // Ecuación lineal: ax + b = c
      var a = rnd(2, 9), x = rnd(1, 15), b2 = rnd(1, 20);
      var c2 = a * x + b2;
      q = a + 'x + ' + b2 + ' = ' + c2 + '\n¿x?';
      correct = x;
      hint = 'Despeja x: pasa ' + b2 + ' al otro lado y luego divide entre ' + a + '.';
      steps = a + 'x = ' + c2 + ' − ' + b2 + ' = ' + (c2-b2) + '  →  x = ' + (c2-b2) + ' ÷ ' + a + ' = ' + correct;
    } else if (t === 3) {
      // Sistema 2×2: x+y=s, x−y=d  →  ¿x?
      var x = rnd(2, 12), y = rnd(1, x);
      q = 'x + y = ' + (x + y) + '\nx − y = ' + (x - y) + '\n¿x?';
      correct = x;
      hint = 'Suma las dos ecuaciones para eliminar y, luego divide entre 2.';
      steps = 'Sumando: 2x = ' + (x+y) + ' + ' + (x-y) + ' = ' + (2*x) + '  →  x = ' + (2*x) + ' ÷ 2 = ' + correct;
    } else {
      // Ecuación cuadrática: una raíz conocida, pide la otra (regla de Vieta)
      var r1 = rnd(1, 8), r2 = rnd(1, 8);
      var b2 = -(r1 + r2), c2 = r1 * r2;
      q = 'x² ' + (b2 < 0 ? '− ' + Math.abs(b2) : '+ ' + b2) + 'x ' + (c2 < 0 ? '− ' + Math.abs(c2) : '+ ' + c2) + ' = 0\nSi x₁=' + r1 + ', ¿x₂?';
      correct = r2;
      hint = 'Usa: x₂ = (c/a) ÷ x₁  o  x₂ = (−b/a) − x₁.';
      steps = 'Suma de raíces = ' + (r1+r2) + '  →  x₂ = ' + (r1+r2) + ' − ' + r1 + ' = ' + correct;
    }
  }

  return { q: q, correct: correct, hint: hint, steps: steps };
}

// ── Lógica del juego ─────────────────────────────────────────────────────────
function initGame() {
  document.getElementById('calcBtn').onclick = function() {
    document.getElementById('calculatorSection').classList.remove('hidden');
    document.getElementById('quizSection').classList.add('hidden');
  };
  document.getElementById('quizBtn').onclick = function() {
    document.getElementById('quizSection').classList.remove('hidden');
    document.getElementById('calculatorSection').classList.add('hidden');
  };
  document.getElementById('startQuizBtn').onclick = startQuiz;

  // ── Calculadora ──────────────────────────────────────────────────────────
  document.getElementById('solveBtn').onclick = function() {
    var eq = document.getElementById('eqInput').value.replace(/\s/g, '');
    var match = eq.match(/x\^2([+-]\d+)x([+-]\d+)=0/);
    if (!match) {
      document.getElementById('calcResult').innerHTML = '<span class="wrong">❌ Formato incorrecto. Usa: x^2-3x+2=0</span>';
      return;
    }
    var b = Number(match[1]), c = Number(match[2]);
    var delta = (b * b) - (4 * c);
    var html = '<div style="line-height:2;font-size:15px">';
    html += '<p style="color:#4c90ff;font-family:Orbitron,monospace;margin-bottom:10px">📐 Resolución paso a paso</p>';
    html += '<p><strong>Ecuación:</strong> x² ' + (b>=0?'+':'')+b+'x '+(c>=0?'+':'')+c+' = 0</p>';
    html += '<p style="color:#aaa;font-size:13px">a=1, b='+b+', c='+c+'</p>';
    html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';
    html += '<p style="color:#ffd700"><strong>Fórmula: x = (−b ± √(b²−4ac)) / 2a</strong></p>';
    html += '<p><strong>Δ = b²−4ac = '+(b*b)+' − '+(4*c)+' = <span style="color:'+(delta>=0?'#4cff90':'#ff4d6d')+'">'+delta+'</span></strong></p>';
    html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';
    if (delta < 0) {
      html += '<p style="color:#ff4d6d">❌ Δ < 0 → Sin soluciones reales.</p>';
    } else if (delta === 0) {
      var x1 = (-b/2).toFixed(2);
      html += '<p style="color:#4cff90">✅ Δ = 0 → Raíz doble: x = '+x1+'</p>';
    } else {
      var sq = Math.sqrt(delta);
      var x1 = ((-b+sq)/2).toFixed(2), x2 = ((-b-sq)/2).toFixed(2);
      html += '<p>√Δ = √'+delta+' ≈ '+sq.toFixed(4)+'</p>';
      html += '<p>x₁ = <strong style="color:#4cff90">'+x1+'</strong> &nbsp;|&nbsp; x₂ = <strong style="color:#4cff90">'+x2+'</strong></p>';
    }
    html += '</div>';
    document.getElementById('calcResult').innerHTML = html;
  };
}

function startQuiz() {
  difficulty = document.getElementById('quizDifficulty').value;
  streak = 0; quizPoints = 0; quizErrors = 0; quizActive = true;
  document.getElementById('quizStats').style.display = 'block';
  document.getElementById('quizStats').innerHTML = '';
  showQuestion();
}

function endQuiz() {
  quizActive = false;
  var perfect = quizErrors === 0 && quizPoints > 0;
  if (perfect) { user.logros.perfecto = true; saveUser(); }
  var bestStreak = user.stats.quizBestStreak || 0;
  var grade = quizPoints >= QUIZ_LENGTH ? '🥇 ORO' : quizPoints >= Math.ceil(QUIZ_LENGTH*0.7) ? '🥈 PLATA' : '🥉 BRONCE';
  document.getElementById('quizGame').innerHTML =
    '<div class="result-box" style="text-align:center;padding:30px">' +
    '<div style="font-family:Orbitron,monospace;font-size:22px;color:#4c90ff;margin-bottom:16px">🏁 ¡Quiz terminado!</div>' +
    '<div style="font-size:32px;margin-bottom:10px">'+grade+'</div>' +
    '<div style="font-size:17px;margin-bottom:6px">✅ Correctas: <strong style="color:#4cff90">'+quizPoints+'</strong> / '+QUIZ_LENGTH+'</div>' +
    '<div style="font-size:17px;margin-bottom:6px">❌ Incorrectas: <strong style="color:#ff4d6d">'+quizErrors+'</strong></div>' +
    '<div style="font-size:17px;margin-bottom:16px">🔥 Mejor racha: <strong style="color:#ffd700">'+streak+'</strong></div>' +
    (perfect ? '<div style="color:#4cff90;font-size:15px;margin-bottom:10px">✨ ¡Quiz perfecto! Logro desbloqueado.</div>' : '') +
    '<button class="btn-primary" style="margin-top:8px" id="restartQuizBtn">🔄 Jugar de nuevo</button>' +
    '</div>';
  document.getElementById('restartQuizBtn').onclick = startQuiz;
  document.getElementById('quizStats').innerHTML = '';
}

function showQuestion() {
  if (!quizActive) return;
  if (quizPoints + quizErrors >= QUIZ_LENGTH) { endQuiz(); return; }

  var qObj = generateQuestion();
  var q = qObj.q, correct = qObj.correct, hint = qObj.hint, steps = qObj.steps;
  var spread = difficulty==='facil'?12 : difficulty==='normal'?6 : difficulty==='dificil'?5 : 15;
  var opts = [correct];
  var attempts = 0;
  while (opts.length < 4 && attempts < 600) {
    var delta = rnd(1, spread);
    if (rnd(0,1)) delta = -delta;
    var v = correct + delta;
    if (v >= 0 && opts.indexOf(v) === -1) opts.push(v);
    attempts++;
  }
  while (opts.length < 4) opts.push(correct + opts.length * (difficulty==='experto'?7:3));
  opts.sort(function() { return Math.random() - 0.5; });

  var qDisplay = q.replace(/\n/g, '<br>');
  var needsEq = q.indexOf('?') === -1 && q.indexOf('=') === -1;
  var prog = quizPoints + quizErrors + 1;

  var html =
    '<div class="question-box">' +
    '<div style="font-size:12px;color:#888;margin-bottom:8px;letter-spacing:1px">PREGUNTA ' + prog + ' / ' + QUIZ_LENGTH + '</div>' +
    '<div class="question-text" style="font-size:' + (q.indexOf('\n')!==-1?'20px':'30px') + '">' + qDisplay + (needsEq?' = ?':'') + '</div>' +
    '<button class="hint-btn" id="hintBtn" style="margin:10px auto;display:block;background:rgba(155,89,255,0.12);border:1px solid rgba(155,89,255,0.35);color:#9b59ff;border-radius:20px;padding:6px 18px;font-size:13px;cursor:pointer">💡 Ver pista</button>' +
    '<div id="hintBox" style="display:none;background:rgba(155,89,255,0.1);border:1px solid rgba(155,89,255,0.3);border-radius:12px;padding:12px;margin:8px 0;font-size:14px;color:#c084fc;text-align:left"></div>' +
    '<div class="options">';
  for (var i = 0; i < opts.length; i++) html += '<button class="op" data-val="' + opts[i] + '">' + opts[i] + '</button>';
  html += '</div></div>';

  document.getElementById('quizGame').innerHTML = html;

  document.getElementById('hintBtn').onclick = function() {
    var box = document.getElementById('hintBox');
    if (box.style.display === 'none') {
      box.innerHTML = '💡 <strong>Pista:</strong> ' + hint;
      box.style.display = 'block';
      this.textContent = '💡 Ocultar pista';
    } else {
      box.style.display = 'none';
      this.textContent = '💡 Ver pista';
    }
  };

  var opBtns = document.querySelectorAll('.op');
  for (var j = 0; j < opBtns.length; j++) {
    opBtns[j].addEventListener('click', function() {
      var allBtns = document.querySelectorAll('.op');
      for (var k = 0; k < allBtns.length; k++) allBtns[k].disabled = true;
      document.getElementById('hintBtn').disabled = true;

      if (Number(this.dataset.val) === correct) {
        playSound('correct');
        this.style.background = '#1a5c2a'; this.style.borderColor = '#4cff90';
        streak++; quizPoints++;
        var xpR = { facil:10, normal:25, dificil:50, experto:100 };
        var coinR = { facil:2, normal:5, dificil:10, experto:20 };
        user.xp += xpR[difficulty];
        user.coins += coinR[difficulty];
        user.totalMonedas = (user.totalMonedas||0) + coinR[difficulty];

        if (!user.stats) user.stats = {};
        user.stats[difficulty] = (user.stats[difficulty]||0) + 1;
        if (streak > (user.stats.quizBestStreak||0)) user.stats.quizBestStreak = streak;

        // Logros
        if (streak >= 5)  user.logros.rach5  = true;
        if (streak >= 10) user.logros.rach10 = true;
        if (streak >= 20) user.logros.rach20 = true;
        if (calcLevel() >= 5)  user.logros.nivel5  = true;
        if (calcLevel() >= 10) user.logros.nivel10 = true;
        if (calcLevel() >= 20) user.logros.nivel20 = true;
        if (calcLevel() >= 50) user.logros.nivel50 = true;
        if (difficulty === 'experto') { user.logros.experto1 = true; if((user.stats.experto||0)>=10) user.logros.experto10=true; }
        if ((user.stats.facil||0)  >= 50) user.logros.facil50   = true;
        if ((user.stats.normal||0) >= 50) user.logros.normal50  = true;
        if ((user.stats.dificil||0)>= 20) user.logros.dificil20 = true;
        if (user.totalMonedas >= 500)  user.logros.millonario  = true;
        if (user.totalMonedas >= 1000) user.logros.monedas1000 = true;
        if ((user.skins||[]).length >= 5) user.logros.coleccionista = true;

        saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
        renderXPBar();
        document.getElementById('quizStats').innerHTML =
          '<span class="correct">✅ ¡Correcto! +'+xpR[difficulty]+'⭐ +'+coinR[difficulty]+'💰</span>' +
          '&nbsp; Racha: '+streak+' | '+quizPoints+'/'+QUIZ_LENGTH;
        setTimeout(showQuestion, 1200);

      } else {
        playSound('wrong');
        this.style.background = '#5c1a1a'; this.style.borderColor = '#ff4444';
        streak = 0; quizErrors++;
        for (var m = 0; m < allBtns.length; m++) {
          if (Number(allBtns[m].dataset.val) === correct) { allBtns[m].style.background='#1a5c2a'; allBtns[m].style.borderColor='#4cff90'; }
        }
        // Mostrar pista y paso a paso al fallar
        var hb = document.getElementById('hintBox');
        if (hb) {
          hb.innerHTML = '💡 <strong>Pista:</strong> ' + hint + (steps ? '<br><span style="color:#aaa;font-size:12px;margin-top:4px;display:block">📝 ' + steps + '</span>' : '');
          hb.style.display = 'block';
        }
        document.getElementById('quizStats').innerHTML =
          '<span class="wrong">❌ Incorrecto.</span>' +
          '&nbsp; Racha perdida | '+quizPoints+'/'+QUIZ_LENGTH;
        setTimeout(showQuestion, 2200);
      }
    });
  }
}

loadUser();
