import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { tryAspaSolution, createAspaDiagram } from './equation-solver.js';

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
// Aplicar fondo inmediatamente
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
    // Intentar parsear la ecuación para obtener a, b, c
    const quadraticMatch = eq.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
    let a = 1, b = 0, c = 0;

    if (quadraticMatch) {
      a = parseFloat(quadraticMatch[1]) || 1;
      if (quadraticMatch[1] === '+' || quadraticMatch[1] === '') a = 1;
      if (quadraticMatch[1] === '-') a = -1;
      b = parseFloat(quadraticMatch[2]);
      c = parseFloat(quadraticMatch[3]);
    } else {
      document.getElementById('calcResult').innerHTML = '<span class="wrong">❌ Formato incorrecto. Usa: ax^2+bx+c=0</span>';
      return;
    }

    const delta = (b * b) - (4 * a * c);

    var html = '';
    html += '<div style="line-height:2;font-size:15px">';
    html += '<p style="color:#4c90ff;font-family:Orbitron,monospace;margin-bottom:10px">📐 Resolución paso a paso</p>';
    html += '<p><strong>Ecuación:</strong> ' + (a === 1 ? 'x²' : a + 'x²') + (b >= 0 ? '+' : '') + b + 'x ' + (c >= 0 ? '+' : '') + c + ' = 0</p>';
    html += '<p style="color:#aaa;font-size:13px">Forma general: ax² + bx + c = 0</p>';
    html += '<p style="color:#aaa;font-size:13px">Donde: a = ' + a + ', b = ' + b + ', c = ' + c + '</p>';
    html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';

    const aspaSolution = tryAspaSolution(a, b, c);
    if (aspaSolution) {
      html += '<p style="color:#ffd700"><strong>MÉTODO: ASPA SIMPLE (Factorización)</strong></p>';
      html += aspaSolution.diagram;
      html += '<strong style="color: #4cff90;">Verificación: ' + aspaSolution.p1 + 'x + ' + aspaSolution.p2 + 'x = ' + (aspaSolution.p1 + aspaSolution.p2) + 'x ✓</strong>';
      html += '<br><strong>Factorización:</strong> (' + aspaSolution.factor1 + ')(' + aspaSolution.factor2 + ') = 0';
      html += '<br><strong>Soluciones:</strong>';
      html += 
'<p style="color:#4cff90; font-size: 13px; margin-top: 15px;"><strong>VERIFICACIÓN DEL TÉRMINO LINEAL:</strong></p>';
      html += 
'<div>' + aspaSolution.p1 + 'x</div>';
      html += 
'<div>' + aspaSolution.p2 + 'x</div>';
      html += 
'<div>x + (' + (-aspaSolution.x1) + ') = 0 → x<sub style="font-size: 9px;">1</sub> = ' + aspaSolution.x1.toFixed(4) + '</div>';
      html += 
'<div>x + (' + (-aspaSolution.x2) + ') = 0 → x<sub style="font-size: 9px;">2</sub> = ' + aspaSolution.x2.toFixed(4) + '</div>';
      html += 
'<p style="color:#aaa;font-size:13px">Verificación: ' + aspaSolution.p1 + 'x + ' + aspaSolution.p2 + 'x = ' + (aspaSolution.p1 + aspaSolution.p2) + 'x ✓</p>';
      html += 
'<p style="color:#aaa;font-size:13px">Verificación x₁: ' + (a*Math.pow(Number(aspaSolution.x1),2) + b*Number(aspaSolution.x1) + c).toFixed(2) + ' ≈ 0 ✅ | x₂: ' + (a*Math.pow(Number(aspaSolution.x2),2) + b*Number(aspaSolution.x2) + c).toFixed(2) + ' ≈ 0 ✅</p>';
      
      // Continuar con la gráfica
    } else {
      html += '<p style="color:#ffd700"><strong>MÉTODO: FÓRMULA GENERAL</strong></p>';
      html += '<p style="color:#aaa;font-size:13px">x = (-b ± √(b² - 4ac)) / 2a</p>';
      html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';
      html += '<p><strong>Paso 1 — Calcular la Discriminante (Δ):</strong></p>';
      html += '<p style="color:#aaa;font-size:13px">Δ = b² - 4ac</p>';
      html += '<p style="color:#aaa;font-size:13px">Δ = (' + b + ')² - 4 × ' + a + ' × (' + c + ')</p>';
      html += '<p style="color:#aaa;font-size:13px">Δ = ' + (b*b) + ' - ' + (4*a*c) + '</p>';
      html += '<p>Δ = <strong style="color:' + (delta >= 0 ? '#4cff90' : '#ff4d6d') + '">' + delta + '</strong></p>';
      html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';
      
      if (delta < 0) {
        html += '<p style="color:#ff4d6d"><strong>Paso 2 — Analizar la Discriminante:</strong></p>';
        html += '<p style="color:#aaa;font-size:13px">Como Δ = ' + delta + ' es menor que 0,</p>';
        html += '<p style="color:#aaa;font-size:13px">la ecuación <strong>no tiene soluciones reales.</strong></p>';
        html += '<p style="color:#ff4d6d">❌ Sin soluciones reales</p>';
      } else if (delta === 0) {
        var x1 = (-b / (2 * a)).toFixed(2);
        html += '<p style="color:#4cff90"><strong>Paso 2 — Analizar la Discriminante:</strong></p>';
        html += '<p style="color:#aaa;font-size:13px">Como Δ = 0, la ecuación tiene <strong>una sola solución (raíz doble).</strong></p>';
        html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';
        html += '<p><strong>Paso 3 — Calcular la solución:</strong></p>';
        html += '<p style="color:#aaa;font-size:13px">x = -b / 2a</p>';
        html += '<p style="color:#aaa;font-size:13px">x = -(' + b + ') / 2×' + a + '</p>';
        html += '<p style="color:#aaa;font-size:13px">x = ' + (-b) + ' / ' + (2 * a) + '</p>';
        html += '<p>x = <strong style="color:#4cff90">' + x1 + '</strong> (raíz doble)</p>';
        html += '<p style="color:#4cff90">✅ Solución: x = ' + x1 + '</p>';
      } else {
        var sqrtDelta = Math.sqrt(delta);
        var x1 = ((-b + sqrtDelta) / (2 * a)).toFixed(2);
        var x2 = ((-b - sqrtDelta) / (2 * a)).toFixed(2);
        html += '<p style="color:#4cff90"><strong>Paso 2 — Analizar la Discriminante:</strong></p>';
        html += '<p style="color:#aaa;font-size:13px">la ecuación tiene <strong>dos soluciones reales distintas.</strong></p>';
        html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';
        html += '<p><strong>Paso 3 — Calcular √Δ:</strong></p>';
        html += '<p style="color:#aaa;font-size:13px">√' + delta + ' = ' + sqrtDelta.toFixed(4) + '</p>';
        html += '<hr style="border-color:rgba(76,144,255,0.2);margin:10px 0"/>';
        html += '<p><strong>Paso 4 — Calcular x₁ y x₂:</strong></p>';
        html += '<p>x₁ = <strong style="color:#4cff90">' + x1 + '</strong></p>';
        html += '<p>x₂ = <strong style="color:#4cff90">' + x2 + '</strong></p>';
        html += '<p style="color:#4cff90">✅ Soluciones: x₁ = ' + x1 + ' | x₂ = ' + x2 + '</p>';
        var v1 = (a*Math.pow(Number(x1),2) + b*Number(x1) + c).toFixed(2);
        var v2 = (a*Math.pow(Number(x2),2) + b*Number(x2) + c).toFixed(2);
        html += '<p style="color:#aaa;font-size:13px">Verificación x₁: ' + v1 + ' ≈ 0 ✅ | x₂: ' + v2 + ' ≈ 0 ✅</p>';
      }
    }

    // La lógica de la fórmula general ya se maneja arriba

    html += '</div>';

    var sqrtD = Math.sqrt(Math.abs(delta));
    var rx1 = delta >= 0 ? (-b + sqrtD) / (2 * a) : null;
    var rx2 = delta >= 0 ? (-b - sqrtD) / (2 * a) : null;
    var vertexX = -b / (2 * a);
    var vertexY = -(delta / (4 * a));

    var W = 380, H = 260;
    var padL = 46, padR = 24, padT = 24, padB = 36;
    var graphW = W - padL - padR;
    var graphH = H - padT - padB;

    var spread2 = Math.max(4, Math.abs(rx1 || 4), Math.abs(rx2 || 4)) + 3;
    var baseMinX = vertexX - spread2;
    var baseMaxX = vertexX + spread2;

    var yVals = [];
    for (var xi = baseMinX; xi <= baseMaxX; xi += 0.1) yVals.push(xi*xi + b*xi + c);
    var baseMinY = Math.min.apply(null, yVals) - 1;
    var baseMaxY = Math.max.apply(null, yVals) + 1;
    if (baseMaxY - baseMinY < 4) { baseMinY -= 2; baseMaxY += 2; }

    html += '<p style="color:#4c90ff;font-family:Orbitron,monospace;margin:18px 0 4px;font-size:13px">📊 Gráfica de la parábola</p>';
    html += '<div id="graphWrapper" style="position:relative;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(76,144,255,0.25);background:rgba(6,10,22,0.95);touch-action:none;cursor:grab;user-select:none">';
    html += '<canvas id="parabolaCanvas" width="' + W + '" height="' + H + '" style="display:block;width:100%;height:auto"></canvas>';
    html += '</div>';

    document.getElementById('calcResult').innerHTML = html;

    var canvas = document.getElementById('parabolaCanvas');
    var ctx = canvas.getContext('2d');
    var scale = 1, offsetX = 0, offsetY = 0;
    var isDragging = false, lastMouseX = 0, lastMouseY = 0, lastPinchDist = 0;

    function toSX(x, minX, maxX) { return padL + ((x - minX) / (maxX - minX)) * graphW * scale + offsetX; }
    function toSY(y, minY, maxY) { return padT + graphH - ((y - minY) / (maxY - minY)) * graphH * scale + offsetY; }

    function drawGraph() {
      var minX = baseMinX, maxX = baseMaxX, minY = baseMinY, maxY = baseMaxY;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(6,10,22,0.95)';
      ctx.fillRect(0, 0, W, H);
      var zY = toSY(0, minY, maxY), zX = toSX(0, minX, maxX);
      var czY = Math.max(padT, Math.min(H - padB, zY));
      var czX = Math.max(padL, Math.min(W - padR, zX));
      ctx.strokeStyle = 'rgba(76,144,255,0.1)'; ctx.lineWidth = 1;
      for (var gxi = Math.floor(minX-15); gxi <= Math.ceil(maxX+15); gxi++) {
        var lx = toSX(gxi, minX, maxX);
        if (lx > padL && lx < W-padR) { ctx.beginPath(); ctx.moveTo(lx, padT); ctx.lineTo(lx, H-padB); ctx.stroke(); }
      }
      for (var gyi = Math.floor(minY-15); gyi <= Math.ceil(maxY+15); gyi++) {
        var ly = toSY(gyi, minY, maxY);
        if (ly > padT && ly < H-padB) { ctx.beginPath(); ctx.moveTo(padL, ly); ctx.lineTo(W-padR, ly); ctx.stroke(); }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(padL, czY); ctx.lineTo(W-padR, czY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(czX, padT); ctx.lineTo(czX, H-padB); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.moveTo(W-padR, czY); ctx.lineTo(W-padR-8, czY-4); ctx.lineTo(W-padR-8, czY+4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(czX, padT); ctx.lineTo(czX-4, padT+8); ctx.lineTo(czX+4, padT+8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = 'bold 12px Orbitron,monospace';
      ctx.fillText('x', W-padR+4, czY+4); ctx.fillText('y', czX+5, padT+4);
      ctx.font = '10px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (var tx = Math.floor(minX-10); tx <= Math.ceil(maxX+10); tx++) {
        if (tx===0) continue;
        var txp = toSX(tx, minX, maxX);
        if (txp > padL+6 && txp < W-padR-6) { ctx.beginPath(); ctx.moveTo(txp, czY-4); ctx.lineTo(txp, czY+4); ctx.stroke(); ctx.fillText(tx, txp-4, czY+15); }
      }
      for (var ty = Math.floor(minY-10); ty <= Math.ceil(maxY+10); ty++) {
        if (ty===0) continue;
        var typ = toSY(ty, minY, maxY);
        if (typ > padT+6 && typ < H-padB-6) { ctx.beginPath(); ctx.moveTo(czX-4, typ); ctx.lineTo(czX+4, typ); ctx.stroke(); ctx.fillText(ty, czX-(ty<0?28:22), typ+4); }
      }
      ctx.fillText('0', czX-14, czY+14);
      var grad = ctx.createLinearGradient(padL, 0, W-padR, 0);
      grad.addColorStop(0,'#9b59ff'); grad.addColorStop(0.5,'#4c90ff'); grad.addColorStop(1,'#4cff90');
      ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.shadowColor = '#4c90ff'; ctx.shadowBlur = 10;
      ctx.beginPath();
      var first = true;
      for (var xp = minX-8; xp <= maxX+8; xp += 0.03) {
        var yp = a*xp*xp + b*xp + c;
        var sxp = toSX(xp, minX, maxX), syp = toSY(yp, minY, maxY);
        if (first) { ctx.moveTo(sxp, syp); first = false; } else ctx.lineTo(sxp, syp);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
      var vsx = toSX(vertexX, minX, maxX), vsy = toSY(vertexY, minY, maxY);
      ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 12; ctx.fillStyle = '#ff4d6d';
      ctx.beginPath(); ctx.arc(vsx, vsy, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(vsx, vsy, 3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#ff4d6d'; ctx.font = 'bold 11px Orbitron,monospace';
      var vlx = vsx+10, vly = vsy-10;
      if (vlx > W-90) vlx = vsx-88; if (vly < padT+12) vly = vsy+20;
      ctx.fillText('V('+vertexX.toFixed(2)+', '+vertexY.toFixed(2)+')', vlx, vly);
      if (delta >= 0 && rx1 !== null) {
        if (Math.abs(rx1-rx2) < 0.01) {
          var rsx = toSX(rx1, minX, maxX);
          ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(rsx, czY, 7, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rsx, czY, 3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#ffd700'; ctx.font = 'bold 11px Orbitron,monospace';
          ctx.fillText('x='+rx1.toFixed(2), rsx-12, czY-14);
        } else {
          var r1sx = toSX(rx1, minX, maxX), r2sx = toSX(rx2, minX, maxX);
          ctx.fillStyle = '#4cff90'; ctx.beginPath(); ctx.arc(r1sx, czY, 7, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r1sx, czY, 3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#4cff90'; ctx.beginPath(); ctx.arc(r2sx, czY, 7, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r2sx, czY, 3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#4cff90'; ctx.font = 'bold 11px Orbitron,monospace';
          var r1lx = r1sx+8, r1ly = czY-14; if (r1lx > W-70) r1lx = r1sx-68;
          ctx.fillText('x₁='+rx1.toFixed(2), r1lx, r1ly);
          var r2lx = r2sx+8, r2ly = czY-14; if (r2lx > W-70) r2lx = r2sx-68;
          ctx.fillText('x₂='+rx2.toFixed(2), r2lx, r2ly);
        }
      }
      ctx.fillStyle = 'rgba(76,144,255,0.45)'; ctx.font = '10px Orbitron,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('f(x) = '+(a===1?'x²':a+'x²')+(b>=0?' +':' ')+b+'x'+(c>=0?' +':' ')+c, W/2, H-7);
      ctx.textAlign = 'left';
    }

    drawGraph();
    var wrapper = document.getElementById('graphWrapper');
    wrapper.addEventListener('wheel', function(e) { e.preventDefault(); scale = Math.max(0.2, Math.min(10, scale * (e.deltaY > 0 ? 0.85 : 1.18))); drawGraph(); }, { passive: false });
    wrapper.addEventListener('mousedown', function(e) { isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY; wrapper.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', function() { isDragging = false; wrapper.style.cursor = 'grab'; });
    window.addEventListener('mousemove', function(e) { if (!isDragging) return; offsetX += e.clientX-lastMouseX; offsetY += e.clientY-lastMouseY; lastMouseX = e.clientX; lastMouseY = e.clientY; drawGraph(); });
    wrapper.addEventListener('touchstart', function(e) { if (e.touches.length===2) { lastPinchDist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); } else if (e.touches.length===1) { isDragging=true; lastMouseX=e.touches[0].clientX; lastMouseY=e.touches[0].clientY; } }, { passive: true });
    wrapper.addEventListener('touchmove', function(e) { if (e.touches.length===2) { var dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); if (lastPinchDist>0) { scale=Math.max(0.2,Math.min(10,scale*(dist/lastPinchDist))); drawGraph(); } lastPinchDist=dist; } else if (e.touches.length===1&&isDragging) { offsetX+=e.touches[0].clientX-lastMouseX; offsetY+=e.touches[0].clientY-lastMouseY; lastMouseX=e.touches[0].clientX; lastMouseY=e.touches[0].clientY; drawGraph(); } }, { passive: true });
    wrapper.addEventListener('touchend', function() { isDragging=false; lastPinchDist=0; });
    var resetBtn = document.createElement('button');
    resetBtn.textContent = '↺ Reset';
    resetBtn.style.cssText = 'position:absolute;top:8px;right:8px;padding:4px 10px;font-size:11px;background:rgba(76,144,255,0.2);border:1px solid rgba(76,144,255,0.4);color:#4c90ff;border-radius:8px;cursor:pointer;font-family:Orbitron,monospace;z-index:10';
    resetBtn.onclick = function() { scale=1; offsetX=0; offsetY=0; drawGraph(); };
    wrapper.appendChild(resetBtn);
  };
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateQuestion() {
  var q = '', correct = 0, hint = '';

  if (difficulty === 'facil') {
    // Las 4 operaciones básicas con números simples
    var t = rnd(0, 3);
    if (t === 0) {
      var a = rnd(1, 50), b = rnd(1, 50);
      q = a + ' + ' + b; correct = a + b;
    } else if (t === 1) {
      var a = rnd(10, 80), b = rnd(1, a);
      q = a + ' - ' + b; correct = a - b;
    } else if (t === 2) {
      var a = rnd(2, 12), b = rnd(2, 10);
      q = a + ' × ' + b; correct = a * b;
    } else {
      var b = rnd(2, 10), a = b * rnd(2, 10);
      q = a + ' ÷ ' + b; correct = a / b;
    }

  } else if (difficulty === 'normal') {
    // Potencias y radicación (raíces cuadradas y cúbicas exactas)
    var t = rnd(0, 3);
    if (t === 0) {
      var a = rnd(2, 15);
      q = a + '²'; correct = a * a;
    } else if (t === 1) {
      var a = rnd(2, 10);
      q = a + '³'; correct = a * a * a;
    } else if (t === 2) {
      // Raíz cuadrada exacta
      var base = rnd(2, 15);
      q = '√' + (base * base); correct = base;
    } else {
      // Raíz cúbica exacta
      var base = rnd(2, 8);
      q = '∛' + (base * base * base); correct = base;
    }

  } else if (difficulty === 'dificil') {
    // Leyes de exponentes y propiedades de radicación
    var t = rnd(0, 4);
    if (t === 0) {
      // a^m × a^n = a^(m+n)  →  pregunta el resultado numérico
      var a = rnd(2, 5), m = rnd(1, 3), n = rnd(1, 3);
      q = a + '^' + m + ' × ' + a + '^' + n + '  =  ' + a + '^?';
      correct = m + n;
      hint = 'Ley: aᵐ × aⁿ = aᵐ⁺ⁿ';
    } else if (t === 1) {
      // a^m ÷ a^n = a^(m-n)
      var a = rnd(2, 5), n = rnd(1, 3), m = n + rnd(1, 3);
      q = a + '^' + m + ' ÷ ' + a + '^' + n + '  =  ' + a + '^?';
      correct = m - n;
      hint = 'Ley: aᵐ ÷ aⁿ = aᵐ⁻ⁿ';
    } else if (t === 2) {
      // (a^m)^n = a^(m×n)
      var a = rnd(2, 4), m = rnd(2, 3), n = rnd(2, 3);
      q = '(' + a + '^' + m + ')^' + n + '  =  ' + a + '^?';
      correct = m * n;
      hint = 'Ley: (aᵐ)ⁿ = aᵐⁿ';
    } else if (t === 3) {
      // √(a²·b) simplificado: √(n²·m) = n·√m — pregunta el coeficiente
      var n = rnd(2, 7), m = rnd(2, 5);
      q = '√' + (n * n * m) + '  =  ? × √' + m;
      correct = n;
      hint = 'Propiedad: √(n²·m) = n·√m';
    } else {
      // a^0 = 1 ó a^1 = a, con distractor
      var a = rnd(2, 12);
      var tipo = rnd(0, 1);
      if (tipo === 0) { q = a + '^0'; correct = 1; }
      else { q = a + '^1'; correct = a; }
      hint = 'Leyes básicas de exponentes';
    }

  } else {
    // Experto: ecuaciones cuadráticas, lineales con fracciones, sistemas simples
    var t = rnd(0, 3);
    if (t === 0) {
      // Ecuación cuadrática factorizable: (x-r1)(x-r2)=0, pide la SUMA de raíces
      var r1 = rnd(1, 8), r2 = rnd(1, 8);
      var b = -(r1 + r2), c = r1 * r2;
      q = 'x² ' + (b >= 0 ? '+ ' + b : '- ' + Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' + c : '- ' + Math.abs(c)) + ' = 0\n¿Suma de raíces?';
      correct = r1 + r2;
      hint = 'Suma de raíces = -b/a';
    } else if (t === 1) {
      // Ecuación cuadrática: pide el PRODUCTO de raíces
      var r1 = rnd(1, 7), r2 = rnd(1, 7);
      var b = -(r1 + r2), c = r1 * r2;
      q = 'x² ' + (b >= 0 ? '+ ' + b : '- ' + Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' + c : '- ' + Math.abs(c)) + ' = 0\n¿Producto de raíces?';
      correct = r1 * r2;
      hint = 'Producto de raíces = c/a';
    } else if (t === 2) {
      // Ecuación lineal: ax + b = c  →  ¿x?
      var a = rnd(2, 9), x = rnd(1, 12), b = rnd(1, 20);
      var c = a * x + b;
      q = a + 'x + ' + b + ' = ' + c + '\n¿x?';
      correct = x;
      hint = 'Despeja x';
    } else {
      // Sistema 2×2 simple: x+y=s, x-y=d  →  pide x
      var x = rnd(1, 10), y = rnd(1, 10);
      q = 'x + y = ' + (x + y) + '\nx - y = ' + (x - y) + '\n¿x?';
      correct = x;
      hint = 'Sistema de ecuaciones';
    }
  }

  return { q: q, correct: correct, hint: hint };
}

function showQuestion() {
  var qObj = generateQuestion();
  var q = qObj.q, correct = qObj.correct, hint = qObj.hint || '';
  var spread = difficulty==='facil' ? 8 : difficulty==='normal' ? 5 : difficulty==='dificil' ? 4 : 10;
  var opts = [correct], attempts = 0;
  while (opts.length < 4 && attempts < 400) {
    var v = correct + rnd(-spread, spread);
    if (v > 0 && opts.indexOf(v) === -1 && v !== correct) opts.push(v);
    attempts++;
  }
  while (opts.length < 4) opts.push(correct + opts.length * (difficulty==='experto' ? 7 : 3));
  opts.sort(function() { return Math.random() - 0.5; });

  var qDisplay = q.replace(/\n/g, '<br>');
  var needsEquals = q.indexOf('?') === -1 && q.indexOf('=') === -1;
  var hintHtml = hint ? '<div style="font-size:12px;color:#9b59ff;margin-bottom:10px;font-family:Rajdhani,sans-serif">💡 Pista: ' + hint + '</div>' : '';
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
        var xpR = { facil:10, normal:25, dificil:50, experto:100 };
        var coinR = { facil:2, normal:5, dificil:10, experto:20 };
        user.xp += xpR[difficulty]; user.coins += coinR[difficulty];
        if (quizPoints >= 3) user.logros.mision3 = true;
        if (streak >= 5) user.logros.rach5 = true;
        if (calcLevel() >= 10) user.logros.nivel10 = true;
        if (difficulty === 'experto') user.logros.experto1 = true;
        saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
        document.getElementById('quizStats').innerHTML = '<span class="correct">✅ ¡Correcto! +' + xpR[difficulty] + '⭐ +' + coinR[difficulty] + '💰</span><br>Racha: ' + streak + ' | Puntos: ' + quizPoints + ' | Nivel: ' + calcLevel();
        setTimeout(showQuestion, 1200);
      } else {
        this.style.background = '#5c1a1a'; this.style.borderColor = '#ff4444';
        streak = 0;
        for (var m = 0; m < allBtns.length; m++) { if (Number(allBtns[m].dataset.val)===correct) { allBtns[m].style.background='#1a5c2a'; allBtns[m].style.borderColor='#4cff90'; } }
        document.getElementById('quizStats').innerHTML = '<span class="wrong">❌ Incorrecto. Era: <strong>' + correct + '</strong></span><br>Racha perdida | Puntos: ' + quizPoints;
        setTimeout(showQuestion, 1800);
      }
    });
  }
}

loadUser();
