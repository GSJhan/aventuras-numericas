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

function calcLevel() {
  var lvl = 1, needed = 100, total = user.xp;
  while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
  return lvl;
}

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) { window.location.href = 'index.html'; return; }
  user = snap.data();
  if (!user.logros) user.logros = { mision3: false, rach5: false, nivel10: false, experto1: false, comprador: false };
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;

  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';

  initGame();
}

var difficulty = 'facil';
var streak = 0;
var quizPoints = 0;

function initGame() {
  document.getElementById('calcBtn').onclick = function() {
    document.getElementById('calculatorSection').classList.remove('hidden');
    document.getElementById('quizSection').classList.add('hidden');
  };

  document.getElementById('quizBtn').onclick = function() {
    document.getElementById('quizSection').classList.remove('hidden');
    document.getElementById('calculatorSection').classList.add('hidden');
  };

  document.getElementById('startQuizBtn').onclick = function() {
    difficulty = document.getElementById('quizDifficulty').value;
    streak = 0;
    quizPoints = 0;
    document.getElementById('quizStats').style.display = 'block';
    showQuestion();
  };

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
    html += '<p><strong>Ecuación:</strong> x² ' + (b >= 0 ? '+' : '') + b + 'x ' + (c >= 0 ? '+' : '') + c + ' = 0</p>';
    html += '<p><strong>Δ = b² - 4ac =</strong> ' + delta + '</p>';
    if (delta < 0) {
      html += '<p class="wrong">❌ No tiene soluciones reales</p>';
    } else if (delta === 0) {
      var x1 = (-b / 2).toFixed(2);
      html += '<p class="correct">✅ Solución única: x = ' + x1 + '</p>';
    } else {
      var x1 = ((-b + Math.sqrt(delta)) / 2).toFixed(2);
      var x2 = ((-b - Math.sqrt(delta)) / 2).toFixed(2);
      html += '<p class="correct">✅ Soluciones: x₁ = ' + x1 + ', x₂ = ' + x2 + '</p>';
    }
    html += '</div>';
    document.getElementById('calcResult').innerHTML = html;
  };
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateQuestion() {
  var q = '', correct = 0, hint = '';
  if (difficulty === 'facil') {
    var t = rnd(0, 3);
    if (t === 0) { var a = rnd(1, 50), b = rnd(1, 50); q = a + ' + ' + b; correct = a + b; }
    else if (t === 1) { var a = rnd(10, 80), b = rnd(1, a); q = a + ' - ' + b; correct = a - b; }
    else if (t === 2) { var a = rnd(2, 12), b = rnd(2, 10); q = a + ' × ' + b; correct = a * b; }
    else { var b = rnd(2, 10), a = b * rnd(2, 10); q = a + ' ÷ ' + b; correct = a / b; }
  } else if (difficulty === 'normal') {
    var t = rnd(0, 3);
    if (t === 0) { var a = rnd(2, 15); q = a + '²'; correct = a * a; }
    else if (t === 1) { var a = rnd(2, 10); q = a + '³'; correct = a * a * a; }
    else if (t === 2) { var base = rnd(2, 15); q = '√' + (base * base); correct = base; }
    else { var base = rnd(2, 8); q = '∛' + (base * base * base); correct = base; }
  } else if (difficulty === 'dificil') {
    var t = rnd(0, 4);
    if (t === 0) { var a = rnd(2, 5), m = rnd(1, 3), n = rnd(1, 3); q = a + '^' + m + ' × ' + a + '^' + n; correct = m + n; hint = 'aᵐ × aⁿ = aᵐ⁺ⁿ'; }
    else if (t === 1) { var a = rnd(2, 5), n = rnd(1, 3), m = n + rnd(1, 3); q = a + '^' + m + ' ÷ ' + a + '^' + n; correct = m - n; hint = 'aᵐ ÷ aⁿ = aᵐ⁻ⁿ'; }
    else if (t === 2) { var a = rnd(2, 4), m = rnd(2, 3), n = rnd(2, 3); q = '(' + a + '^' + m + ')^' + n; correct = m * n; hint = '(aᵐ)ⁿ = aᵐⁿ'; }
    else if (t === 3) { var n = rnd(2, 7), m = rnd(2, 5); q = '√' + (n * n * m); correct = n; hint = '√(n²·m) = n·√m'; }
    else { var a = rnd(2, 12); var tipo = rnd(0, 1); if (tipo === 0) { q = a + '^0'; correct = 1; } else { q = a + '^1'; correct = a; } hint = 'Leyes de exponentes'; }
  } else {
    var t = rnd(0, 3);
    if (t === 0) { var r1 = rnd(1, 8), r2 = rnd(1, 8); var b = -(r1 + r2), c = r1 * r2; q = 'x² ' + (b >= 0 ? '+ ' + b : '- ' + Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' + c : '- ' + Math.abs(c)) + ' = 0\n¿Suma de raíces?'; correct = r1 + r2; hint = 'Suma de raíces = -b/a'; }
    else if (t === 1) { var r1 = rnd(1, 7), r2 = rnd(1, 7); var b = -(r1 + r2), c = r1 * r2; q = 'x² ' + (b >= 0 ? '+ ' + b : '- ' + Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' + c : '- ' + Math.abs(c)) + ' = 0\n¿Producto de raíces?'; correct = r1 * r2; hint = 'Producto de raíces = c/a'; }
    else if (t === 2) { var a = rnd(2, 9), x = rnd(1, 12), b = rnd(1, 20); var c = a * x + b; q = a + 'x + ' + b + ' = ' + c + '\n¿x?'; correct = x; hint = 'Despeja x'; }
    else { var x = rnd(1, 10), y = rnd(1, 10); q = 'x + y = ' + (x + y) + '\nx - y = ' + (x - y) + '\n¿x?'; correct = x; hint = 'Sistema de ecuaciones'; }
  }
  return { q: q, correct: correct, hint: hint };
}

function showQuestion() {
  var qObj = generateQuestion();
  var q = qObj.q, correct = qObj.correct, hint = qObj.hint || '';
  var spread = difficulty === 'facil' ? 8 : difficulty === 'normal' ? 5 : difficulty === 'dificil' ? 4 : 10;
  var opts = [correct], attempts = 0;
  while (opts.length < 4 && attempts < 400) {
    var v = correct + rnd(-spread, spread);
    if (v > 0 && opts.indexOf(v) === -1 && v !== correct) opts.push(v);
    attempts++;
  }
  while (opts.length < 4) opts.push(correct + opts.length * (difficulty === 'experto' ? 7 : 3));
  opts.sort(function() { return Math.random() - 0.5; });
  var qDisplay = q.replace(/\n/g, '<br>');
  var needsEquals = q.indexOf('?') === -1 && q.indexOf('=') === -1;
  var hintHtml = hint ? '<div style="font-size:12px;color:#9b59ff;margin-bottom:10px;">💡 ' + hint + '</div>' : '';
  var html = '<div class="question-box">' + hintHtml + '<div class="question-text" style="font-size:' + (q.indexOf('\n') !== -1 ? '22px' : '34px') + '">' + qDisplay + (needsEquals ? ' = ?' : '') + '</div><div class="options">';
  for (var i = 0; i < opts.length; i++) html += '<button class="op" data-val="' + opts[i] + '">' + opts[i] + '</button>';
  html += '</div></div>';
  document.getElementById('quizGame').innerHTML = html;
  var opBtns = document.querySelectorAll('.op');
  for (var j = 0; j < opBtns.length; j++) {
    opBtns[j].addEventListener('click', function() {
      var allBtns = document.querySelectorAll('.op');
      for (var k = 0; k < allBtns.length; k++) allBtns[k].disabled = true;
      if (Number(this.dataset.val) === correct) {
        this.style.background = '#1a5c2a'; this.style.borderColor = '#4cff90';
        streak++; quizPoints++;
        var xpR = { facil: 10, normal: 25, dificil: 50, experto: 100 };
        var coinR = { facil: 2, normal: 5, dificil: 10, experto: 20 };
        user.xp += xpR[difficulty]; user.coins += coinR[difficulty];
        if (quizPoints >= 3) user.logros.mision3 = true;
        if (streak >= 5) user.logros.rach5 = true;
        if (calcLevel() >= 10) user.logros.nivel10 = true;
        if (difficulty === 'experto') user.logros.experto1 = true;
        saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
        document.getElementById('quizStats').innerHTML = '<span class="correct">✅ ¡Correcto! +' + xpR[difficulty] + '⭐ +' + coinR[difficulty] + '💰</span><br>Racha: ' + streak + ' | Puntos: ' + quizPoints;
        setTimeout(showQuestion, 1200);
      } else {
        this.style.background = '#5c1a1a'; this.style.borderColor = '#ff4444';
        streak = 0;
        for (var m = 0; m < allBtns.length; m++) { if (Number(allBtns[m].dataset.val) === correct) { allBtns[m].style.background = '#1a5c2a'; allBtns[m].style.borderColor = '#4cff90'; } }
        document.getElementById('quizStats').innerHTML = '<span class="wrong">❌ Incorrecto. Era: <strong>' + correct + '</strong></span><br>Racha perdida | Puntos: ' + quizPoints;
        setTimeout(showQuestion, 1800);
      }
    });
  }
}

loadUser();
