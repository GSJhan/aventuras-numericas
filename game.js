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

async function saveUser() { await setDoc(userRef, user); }

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
  if (!user.logros) user.logros = {};
  const defaultLogros = { 
    mision3:false, mision10:false, mision50:false,
    rach5:false, rach10:false, rach20:false, 
    nivel5:false, nivel10:false, nivel20:false, nivel50:false,
    experto1:false, experto10:false,
    comprador:false, coleccionista:false,
    millonario:false, monedas1000:false
  };
  for (let key in defaultLogros) {
    if (user.logros[key] === undefined) user.logros[key] = defaultLogros[key];
  }
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (user.streak === undefined) user.streak = 0;
  streak = user.streak;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  initGame();
}

// ─── GRAFICO ────────────────────────────────────────────────────────────────

function drawParabola(b, c, delta, rx1, rx2, vertexX, vertexY) {
  var canvas = document.getElementById('parabolaCanvas');
  if (!canvas) { console.error('Canvas no encontrado'); return; }
  var ctx = canvas.getContext('2d');

  // Asegurar dimensiones correctas
  if (canvas.width < 100) canvas.width = 640;
  if (canvas.height < 100) canvas.height = 380;

  var W = canvas.width, H = canvas.height;
  var padL = 52, padR = 28, padT = 28, padB = 40;
  var graphW = W - padL - padR, graphH = H - padT - padB;

  var spread = Math.max(5, Math.abs(rx1 || 5), Math.abs(rx2 || 5)) + 3;
  var minX = vertexX - spread, maxX = vertexX + spread;
  var yVals = [];
  for (var xi = minX; xi <= maxX; xi += 0.1) yVals.push(xi*xi + b*xi + c);
  var minY = Math.min.apply(null, yVals) - 1.5;
  var maxY = Math.max.apply(null, yVals) + 1.5;
  if (maxY - minY < 5) { minY -= 2.5; maxY += 2.5; }

  var scale = {x:1, y:1, ox:0, oy:0};

  function toSX(x) { return padL + ((x - minX) / (maxX - minX)) * graphW * scale.x + scale.ox; }
  function toSY(y) { return padT + graphH - ((y - minY) / (maxY - minY)) * graphH * scale.y + scale.oy; }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Fondo degradado
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#06080f');
    bg.addColorStop(1, '#0a0e1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var zY = Math.max(padT, Math.min(H-padB, toSY(0)));
    var zX = Math.max(padL, Math.min(W-padR, toSX(0)));

    // Cuadricula con gradiente de opacidad
    ctx.lineWidth = 1;
    for (var gx = Math.floor(minX-10); gx <= Math.ceil(maxX+10); gx++) {
      var lx = toSX(gx);
      if (lx < padL || lx > W-padR) continue;
      ctx.strokeStyle = gx === 0 ? 'rgba(76,144,255,0.5)' : 'rgba(76,144,255,0.1)';
      ctx.beginPath(); ctx.moveTo(lx, padT); ctx.lineTo(lx, H-padB); ctx.stroke();
    }
    for (var gy = Math.floor(minY-10); gy <= Math.ceil(maxY+10); gy++) {
      var ly = toSY(gy);
      if (ly < padT || ly > H-padB) continue;
      ctx.strokeStyle = gy === 0 ? 'rgba(76,144,255,0.5)' : 'rgba(76,144,255,0.1)';
      ctx.beginPath(); ctx.moveTo(padL, ly); ctx.lineTo(W-padR, ly); ctx.stroke();
    }

    // Ejes con sombra de neon
    ctx.shadowColor = '#4c90ff'; ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(140,180,255,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, zY); ctx.lineTo(W-padR, zY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zX, padT); ctx.lineTo(zX, H-padB); ctx.stroke();
    ctx.shadowBlur = 0;

    // Flechas de ejes
    ctx.fillStyle = 'rgba(140,180,255,0.7)';
    ctx.beginPath(); ctx.moveTo(W-padR+2, zY); ctx.lineTo(W-padR-8, zY-5); ctx.lineTo(W-padR-8, zY+5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(zX, padT-2); ctx.lineTo(zX-5, padT+8); ctx.lineTo(zX+5, padT+8); ctx.fill();

    // Etiquetas de ejes
    ctx.fillStyle = 'rgba(180,200,255,0.8)'; ctx.font = 'bold 13px Orbitron,monospace';
    ctx.fillText('x', W-padR+5, zY+5);
    ctx.fillText('y', zX+6, padT+4);

    // Números de la cuadricula
    ctx.font = '10px Rajdhani,sans-serif'; ctx.fillStyle = 'rgba(140,170,220,0.55)';
    for (var tx = Math.floor(minX); tx <= Math.ceil(maxX); tx++) {
      if (tx === 0) continue;
      var txp = toSX(tx);
      if (txp < padL+5 || txp > W-padR-5) continue;
      ctx.fillText(tx, txp-4, zY+14);
    }
    for (var ty = Math.floor(minY)+1; ty <= Math.ceil(maxY)-1; ty++) {
      if (ty === 0) continue;
      var typ = toSY(ty);
      if (typ < padT+5 || typ > H-padB-5) continue;
      var lbl = String(ty);
      ctx.fillText(lbl, zX - (ty < 0 ? 28 : 20), typ+4);
    }
    ctx.fillText('0', zX-16, zY+14);

    // Parábola con gradiente arcoiris
    var grad = ctx.createLinearGradient(padL, 0, W-padR, 0);
    grad.addColorStop(0, '#a855f7');
    grad.addColorStop(0.35, '#4c90ff');
    grad.addColorStop(0.65, '#06b6d4');
    grad.addColorStop(1, '#4cff90');
    ctx.strokeStyle = grad; ctx.lineWidth = 3.5;
    ctx.shadowColor = '#4c90ff'; ctx.shadowBlur = 16;
    ctx.beginPath();
    var first = true;
    for (var xp = minX - 5; xp <= maxX + 5; xp += 0.025) {
      var yp = xp*xp + b*xp + c;
      var sx = toSX(xp), sy = toSY(yp);
      if (sy < padT - 20 || sy > H - padB + 20) { first = true; continue; }
      if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke(); ctx.shadowBlur = 0;

    // Área bajo/sobre el eje x (relleno semitransparente)
    ctx.beginPath();
    first = true;
    for (var xp2 = minX; xp2 <= maxX; xp2 += 0.05) {
      var yp2 = xp2*xp2 + b*xp2 + c;
      var sx2 = toSX(xp2), sy2 = toSY(yp2);
      if (first) { ctx.moveTo(sx2, zY); ctx.lineTo(sx2, sy2); first = false; } else ctx.lineTo(sx2, sy2);
    }
    ctx.lineTo(toSX(maxX), zY);
    ctx.closePath();
    var areaGrad = ctx.createLinearGradient(0, padT, 0, H-padB);
    areaGrad.addColorStop(0, 'rgba(76,144,255,0.18)');
    areaGrad.addColorStop(1, 'rgba(76,144,255,0.03)');
    ctx.fillStyle = areaGrad; ctx.fill();

    // Vértice
    var vsx = toSX(vertexX), vsy = toSY(vertexY);
    ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.arc(vsx, vsy, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(vsx, vsy, 3, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // Etiqueta del vértice con fondo
    var vlabel = 'V('+vertexX.toFixed(2)+', '+vertexY.toFixed(2)+')';
    ctx.font = 'bold 10.5px Orbitron,monospace';
    var vlw = ctx.measureText(vlabel).width;
    var vlx = vsx + 10, vly = vsy - 12;
    if (vlx + vlw > W-padR) vlx = vsx - vlw - 10;
    if (vly < padT + 16) vly = vsy + 22;
    ctx.fillStyle = 'rgba(10,14,30,0.8)';
    ctx.beginPath(); ctx.rect(vlx-4, vly-12, vlw+8, 18); ctx.fill();
    ctx.fillStyle = '#ff4d6d'; ctx.fillText(vlabel, vlx, vly);

    // Raíces
    if (delta >= 0 && rx1 !== null) {
      var roots = Math.abs(rx1 - rx2) < 0.01 ? [rx1] : [rx1, rx2];
      var colors = ['#4cff90', '#ffd700'];
      var labels = roots.length === 1 ? ['x₀'] : ['x₁', 'x₂'];
      for (var ri = 0; ri < roots.length; ri++) {
        var rsx = toSX(roots[ri]);
        ctx.shadowColor = colors[ri]; ctx.shadowBlur = 18;
        ctx.fillStyle = colors[ri];
        ctx.beginPath(); ctx.arc(rsx, zY, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(rsx, zY, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        var rlabel = labels[ri]+'='+roots[ri].toFixed(2);
        ctx.font = 'bold 10.5px Orbitron,monospace';
        var rlw = ctx.measureText(rlabel).width;
        var rlx = rsx + 10, rly = zY - 16;
        if (rlx + rlw > W-padR) rlx = rsx - rlw - 10;
        ctx.fillStyle = 'rgba(10,14,30,0.8)';
        ctx.beginPath(); ctx.rect(rlx-4, rly-12, rlw+8, 18); ctx.fill();
        ctx.fillStyle = colors[ri]; ctx.fillText(rlabel, rlx, rly);
      }
    }

    // Fórmula en la parte inferior
    var fLabel = 'f(x) = x² ' + (b >= 0 ? '+ ' : '- ') + Math.abs(b) + 'x ' + (c >= 0 ? '+ ' : '- ') + Math.abs(c);
    ctx.font = '11px Orbitron,monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(100,140,255,0.6)';
    ctx.fillText(fLabel, W/2, H-8);
    ctx.textAlign = 'left';
  }

  draw();

  // Interactividad: rueda para zoom, arrastre para mover
  var isDragging = false, lastX = 0, lastY = 0, lastPinch = 0;
  var wrapper = document.getElementById('graphWrapper');

  wrapper.addEventListener('wheel', function(e) {
    e.preventDefault();
    scale.x = Math.max(0.2, Math.min(10, scale.x * (e.deltaY > 0 ? 0.85 : 1.18)));
    scale.y = scale.x;
    draw();
  }, { passive: false });

  wrapper.addEventListener('mousedown', function(e) { isDragging=true; lastX=e.clientX; lastY=e.clientY; wrapper.style.cursor='grabbing'; });
  window.addEventListener('mouseup', function() { isDragging=false; wrapper.style.cursor='grab'; });
  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    scale.ox += e.clientX-lastX; scale.oy += e.clientY-lastY;
    lastX=e.clientX; lastY=e.clientY; draw();
  });

  wrapper.addEventListener('touchstart', function(e) {
    if (e.touches.length===2) { lastPinch = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); }
    else { isDragging=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }
  }, { passive:true });
  wrapper.addEventListener('touchmove', function(e) {
    if (e.touches.length===2) {
      var d = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      if (lastPinch > 0) { scale.x = Math.max(0.2,Math.min(10,scale.x*(d/lastPinch))); scale.y = scale.x; draw(); }
      lastPinch = d;
    } else if (isDragging) {
      scale.ox += e.touches[0].clientX-lastX; scale.oy += e.touches[0].clientY-lastY;
      lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; draw();
    }
  }, { passive:true });
  wrapper.addEventListener('touchend', function() { isDragging=false; lastPinch=0; });

  // Botón reset
  var resetBtn = document.createElement('button');
  resetBtn.textContent = '↺ Reset';
  resetBtn.style.cssText = 'position:absolute;top:8px;right:8px;padding:4px 10px;font-size:11px;background:rgba(76,144,255,0.18);border:1px solid rgba(76,144,255,0.45);color:#4c90ff;border-radius:8px;cursor:pointer;font-family:Orbitron,monospace;z-index:10;transition:all 0.2s';
  resetBtn.onmouseenter = function() { this.style.background='rgba(76,144,255,0.35)'; };
  resetBtn.onmouseleave = function() { this.style.background='rgba(76,144,255,0.18)'; };
  resetBtn.onclick = function() { scale={x:1,y:1,ox:0,oy:0}; draw(); };
  wrapper.appendChild(resetBtn);
}

// ─── RESOLVER ECUACION ───────────────────────────────────────────────────────

function solveEquation(eq) {
  // Acepta formatos: x^2-3x+2=0, x^2+5x-6=0, x^2-9=0, x^2+4=0, x^2-4x=0
  var str = eq.replace(/\s/g,'').toLowerCase();

  // Normalizar: mover todo al lado izquierdo (quitar el =0 o =algo)
  var sides = str.split('=');
  if (sides.length !== 2) return null;
  var left = sides[0], right = sides[1];
  // Solo soportamos =0 por ahora
  if (right !== '0') return null;

  var expr = left;
  var a = 0, b = 0, c = 0;

  // Extraer términos con regex
  // Término ax^2, x^2, -x^2
  var reA = /([+-]?\d*)x\^2/g;
  var reB = /([+-]?\d*)x(?!\^)/g;
  var reC = /([+-]?\d+)(?!x)/g;

  // Reset
  var tmpExpr = expr;

  // Coeficiente a
  var mA = expr.match(/([+-]?\d*)x\^2/);
  if (mA) {
    a = mA[1] === '' || mA[1] === '+' ? 1 : mA[1] === '-' ? -1 : Number(mA[1]);
    tmpExpr = tmpExpr.replace(mA[0], '');
  } else {
    return null; // No es cuadrática
  }

  // Coeficiente b (buscar después de quitar a)
  var mB = tmpExpr.match(/([+-]?\d*)x/);
  if (mB) {
    b = mB[1] === '' || mB[1] === '+' ? 1 : mB[1] === '-' ? -1 : Number(mB[1]);
    tmpExpr = tmpExpr.replace(mB[0], '');
  }

  // Coeficiente c (lo que queda)
  var mC = tmpExpr.match(/^([+-]?\d+)$/);
  if (mC) c = Number(mC[1]);

  if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) return null;

  return { a, b, c };
}

function renderSolution(a, b, c) {
  var delta = b*b - 4*a*c;
  var vertexX = -b / (2*a);
  var vertexY = c - (b*b)/(4*a);
  var sqrtD = Math.sqrt(Math.abs(delta));
  var rx1 = delta >= 0 ? (-b + sqrtD)/(2*a) : null;
  var rx2 = delta >= 0 ? (-b - sqrtD)/(2*a) : null;

  var deltaColor = delta > 0 ? '#4cff90' : delta === 0 ? '#ffd700' : '#ff4d6d';

  var html = `
  <div style="background:rgba(6,10,22,0.9);border:1px solid rgba(76,144,255,0.25);border-radius:18px;overflow:hidden;margin-top:8px">
    
    <!-- Header con la ecuación -->
    <div style="background:linear-gradient(135deg,rgba(76,144,255,0.18),rgba(155,89,255,0.12));padding:18px 22px;border-bottom:1px solid rgba(76,144,255,0.18)">
      <p style="font-family:Orbitron,monospace;font-size:11px;color:#4c90ff;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">📐 Resolución paso a paso</p>
      <p style="font-family:Orbitron,monospace;font-size:22px;color:#e8eaff">
        ${a !== 1 ? a : ''}x² ${b >= 0 ? '+ ' : '− '}${Math.abs(b) !== 1 || b === 0 ? Math.abs(b) : ''}x ${c >= 0 ? '+ ' : '− '}${Math.abs(c)} = 0
      </p>
      <p style="font-size:12px;color:#667;margin-top:6px">a = ${a} &nbsp;|&nbsp; b = ${b} &nbsp;|&nbsp; c = ${c}</p>
    </div>

    <div style="padding:20px 22px;display:flex;flex-direction:column;gap:16px">

      <!-- Paso 1: Discriminante -->
      <div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:16px">
        <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffd700;margin-bottom:8px;font-weight:700">Paso 1 — Discriminante (Δ)</p>
        <p style="font-size:13px;color:#aaa;font-family:monospace">Δ = b² − 4ac</p>
        <p style="font-size:13px;color:#aaa;font-family:monospace">Δ = (${b})² − 4 × ${a} × (${c})</p>
        <p style="font-size:13px;color:#aaa;font-family:monospace">Δ = ${b*b} − ${4*a*c}</p>
        <p style="font-size:18px;font-weight:700;margin-top:6px">Δ = <span style="color:${deltaColor}">${delta}</span></p>
      </div>

      <!-- Paso 2: Análisis -->
      <div style="background:rgba(76,144,255,0.06);border:1px solid rgba(76,144,255,0.2);border-radius:12px;padding:16px">
        <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#4c90ff;margin-bottom:8px;font-weight:700">Paso 2 — Análisis</p>
        ${delta > 0
          ? `<p style="color:#4cff90">✅ Δ > 0 → <strong>Dos soluciones reales distintas</strong></p>`
          : delta === 0
          ? `<p style="color:#ffd700">⚡ Δ = 0 → <strong>Una solución real (raíz doble)</strong></p>`
          : `<p style="color:#ff4d6d">❌ Δ < 0 → <strong>Sin soluciones reales</strong> (raíces complejas)</p>`
        }
      </div>

      ${delta >= 0 ? `
      <!-- Paso 3: Cálculo -->
      <div style="background:rgba(76,255,144,0.06);border:1px solid rgba(76,255,144,0.2);border-radius:12px;padding:16px">
        <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#4cff90;margin-bottom:8px;font-weight:700">Paso 3 — Fórmula Cuadrática</p>
        <p style="font-size:13px;color:#aaa;font-family:monospace">x = (−b ± √Δ) / 2a</p>
        <p style="font-size:13px;color:#aaa;font-family:monospace">x = (−(${b}) ± √${delta}) / 2×${a}</p>
        ${delta > 0 ? `
        <p style="font-size:13px;color:#aaa;font-family:monospace">√${delta} ≈ ${sqrtD.toFixed(4)}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
          <div style="background:rgba(76,255,144,0.1);border-radius:8px;padding:12px;text-align:center">
            <p style="font-size:11px;color:#4cff90;margin-bottom:4px">x₁</p>
            <p style="font-size:22px;font-family:Orbitron,monospace;color:#4cff90;font-weight:700">${rx1.toFixed(3)}</p>
          </div>
          <div style="background:rgba(255,215,0,0.1);border-radius:8px;padding:12px;text-align:center">
            <p style="font-size:11px;color:#ffd700;margin-bottom:4px">x₂</p>
            <p style="font-size:22px;font-family:Orbitron,monospace;color:#ffd700;font-weight:700">${rx2.toFixed(3)}</p>
          </div>
        </div>
        <p style="font-size:11px;color:#555;margin-top:8px;font-family:monospace">
          Verificación: f(${rx1.toFixed(2)}) = ${(a*rx1*rx1+b*rx1+c).toFixed(3)} ≈ 0 ✅ &nbsp;|&nbsp; f(${rx2.toFixed(2)}) = ${(a*rx2*rx2+b*rx2+c).toFixed(3)} ≈ 0 ✅
        </p>
        ` : `
        <p style="font-size:22px;font-family:Orbitron,monospace;color:#ffd700;font-weight:700;margin-top:10px">x = ${rx1.toFixed(3)} <span style="font-size:13px;color:#aaa">(raíz doble)</span></p>
        `}
      </div>` : ''}

      <!-- Vértice -->
      <div style="background:rgba(255,77,109,0.06);border:1px solid rgba(255,77,109,0.2);border-radius:12px;padding:16px">
        <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ff4d6d;margin-bottom:8px;font-weight:700">Vértice de la parábola</p>
        <p style="font-size:13px;color:#aaa;font-family:monospace">V = (−b/2a, −Δ/4a)</p>
        <p style="font-size:18px;font-weight:700">V = (<span style="color:#ff4d6d">${vertexX.toFixed(2)}</span>, <span style="color:#ff4d6d">${vertexY.toFixed(2)}</span>)</p>
        <p style="font-size:12px;color:#666;margin-top:4px">La parábola ${a > 0 ? 'abre hacia ↑ (mínimo)' : 'abre hacia ↓ (máximo)'}</p>
      </div>

    </div>

    <!-- Gráfico -->
    <div style="padding:0 22px 22px">
      <p style="font-family:Orbitron,monospace;font-size:11px;color:#4c90ff;letter-spacing:2px;margin-bottom:10px">📊 GRÁFICA INTERACTIVA — Zoom con rueda del mouse, arrastrar para mover</p>
      <div id="graphWrapper" style="position:relative;border-radius:14px;overflow:hidden;border:1px solid rgba(76,144,255,0.28);touch-action:none;cursor:grab;user-select:none">
        <canvas id="parabolaCanvas" width="640" height="380" style="display:block;width:100%;height:auto"></canvas>
      </div>
    </div>
  </div>`;

  document.getElementById('calcResult').innerHTML = html;

  // Dibujar con delay para asegurar que el DOM ya tiene el canvas disponible
  setTimeout(function() {
    drawParabola(b, c, delta, rx1, rx2, vertexX, vertexY);
  }, 50);
}

// ─── QUIZ ────────────────────────────────────────────────────────────────────

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
    streak = 0; quizPoints = 0;
    document.getElementById('quizStats').style.display = 'block';
    showQuestion();
  };

  document.getElementById('solveBtn').onclick = function() {
    var raw = document.getElementById('eqInput').value.trim();
    if (!raw) {
      document.getElementById('calcResult').innerHTML = '<div style="color:#ff4d6d;padding:12px;background:rgba(255,77,109,0.1);border-radius:10px;border:1px solid rgba(255,77,109,0.3)">⚠️ Escribe una ecuación primero.</div>';
      return;
    }
    var parsed = solveEquation(raw);
    if (!parsed) {
      document.getElementById('calcResult').innerHTML = `
        <div style="color:#ff4d6d;padding:16px;background:rgba(255,77,109,0.08);border-radius:12px;border:1px solid rgba(255,77,109,0.25)">
          <p style="font-weight:700;margin-bottom:8px">❌ Formato no reconocido</p>
          <p style="font-size:13px;color:#aaa">Ejemplos válidos:</p>
          <p style="font-size:13px;font-family:monospace;color:#e8eaff;margin-top:6px">
            x^2-3x+2=0<br>
            x^2+5x-6=0<br>
            x^2-9=0<br>
            2x^2-4x+2=0
          </p>
        </div>`;
      return;
    }
    renderSolution(parsed.a, parsed.b, parsed.c);
  };

  // Enter para resolver
  document.getElementById('eqInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('solveBtn').click();
  });
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateQuestion() {
  var q = '', correct = 0, hint = '';
  if (difficulty === 'facil') {
    var t = rnd(0,3);
    if (t===0) { var a=rnd(1,50),b=rnd(1,50); q=a+' + '+b; correct=a+b; }
    else if (t===1) { var a=rnd(10,80),b=rnd(1,a); q=a+' - '+b; correct=a-b; }
    else if (t===2) { var a=rnd(2,12),b=rnd(2,10); q=a+' × '+b; correct=a*b; }
    else { var b=rnd(2,10),a=b*rnd(2,10); q=a+' ÷ '+b; correct=a/b; }
  } else if (difficulty === 'normal') {
    var t = rnd(0,3);
    if (t===0) { var a=rnd(2,15); q=a+'²'; correct=a*a; }
    else if (t===1) { var a=rnd(2,10); q=a+'³'; correct=a*a*a; }
    else if (t===2) { var base=rnd(2,15); q='√'+(base*base); correct=base; }
    else { var base=rnd(2,8); q='∛'+(base*base*base); correct=base; }
  } else if (difficulty === 'dificil') {
    var t = rnd(0,4);
    if (t===0) { var a=rnd(2,5),m=rnd(1,3),n=rnd(1,3); q=a+'^'+m+' × '+a+'^'+n+' = '+a+'^?'; correct=m+n; hint='Ley: aᵐ × aⁿ = aᵐ⁺ⁿ'; }
    else if (t===1) { var a=rnd(2,5),n=rnd(1,3),m=n+rnd(1,3); q=a+'^'+m+' ÷ '+a+'^'+n+' = '+a+'^?'; correct=m-n; hint='Ley: aᵐ ÷ aⁿ = aᵐ⁻ⁿ'; }
    else if (t===2) { var a=rnd(2,4),m=rnd(2,3),n=rnd(2,3); q='('+a+'^'+m+')^'+n+' = '+a+'^?'; correct=m*n; hint='Ley: (aᵐ)ⁿ = aᵐⁿ'; }
    else if (t===3) { var n=rnd(2,7),m=rnd(2,5); q='√'+(n*n*m)+' = ? × √'+m; correct=n; hint='Propiedad: √(n²·m) = n·√m'; }
    else { var a=rnd(2,12),tipo=rnd(0,1); if(tipo===0){q=a+'^0';correct=1;}else{q=a+'^1';correct=a;} hint='Leyes básicas de exponentes'; }
  } else {
    var t = rnd(0,3);
    if (t===0) { var r1=rnd(1,8),r2=rnd(1,8),b2=-(r1+r2),c2=r1*r2; q='x² '+(b2>=0?'+ '+b2:'- '+Math.abs(b2))+'x '+(c2>=0?'+ '+c2:'- '+Math.abs(c2))+' = 0\n¿Suma de raíces?'; correct=r1+r2; hint='Suma de raíces = -b/a'; }
    else if (t===1) { var r1=rnd(1,7),r2=rnd(1,7),b2=-(r1+r2),c2=r1*r2; q='x² '+(b2>=0?'+ '+b2:'- '+Math.abs(b2))+'x '+(c2>=0?'+ '+c2:'- '+Math.abs(c2))+' = 0\n¿Producto de raíces?'; correct=r1*r2; hint='Producto de raíces = c/a'; }
    else if (t===2) { var a=rnd(2,9),x=rnd(1,12),b2=rnd(1,20),c2=a*x+b2; q=a+'x + '+b2+' = '+c2+'\n¿x?'; correct=x; hint='Despeja x'; }
    else { var x=rnd(1,10),y=rnd(1,10); q='x + y = '+(x+y)+'\nx - y = '+(x-y)+'\n¿x?'; correct=x; hint='Sistema de ecuaciones'; }
  }
  return { q, correct, hint };
}

function showQuestion() {
  var qObj = generateQuestion();
  var q = qObj.q, correct = qObj.correct, hint = qObj.hint || '';
  var spread = difficulty==='facil'?8:difficulty==='normal'?5:difficulty==='dificil'?4:10;
  var opts = [correct], attempts = 0;
  while (opts.length < 4 && attempts < 400) {
    var v = correct + rnd(-spread, spread);
    if (v >= 0 && opts.indexOf(v) === -1 && v !== correct) opts.push(v);
    attempts++;
  }
  while (opts.length < 4) opts.push(correct + opts.length * (difficulty==='experto'?7:3));
  opts.sort(function() { return Math.random() - 0.5; });

  var qDisplay = q.replace(/\n/g,'<br>');
  var needsEquals = q.indexOf('?') === -1 && q.indexOf('=') === -1;
  var hintHtml = hint ? '<div style="font-size:12px;color:#9b59ff;margin-bottom:10px">💡 Pista: '+hint+'</div>' : '';
  var html = '<div class="question-box">'+hintHtml+'<div class="question-text" style="font-size:'+(q.indexOf('\n')!==-1?'22px':'34px')+'">'+qDisplay+(needsEquals?' = ?':'')+'</div><div class="options">';
  for (var i=0;i<opts.length;i++) html+='<button class="op" data-val="'+opts[i]+'">'+opts[i]+'</button>';
  html+='</div></div>';
  document.getElementById('quizGame').innerHTML = html;

  var opBtns = document.querySelectorAll('.op');
  for (var j=0;j<opBtns.length;j++) {
    opBtns[j].addEventListener('click', function() {
      var allBtns = document.querySelectorAll('.op');
      for (var k=0;k<allBtns.length;k++) allBtns[k].disabled=true;
      if (Number(this.dataset.val) === correct) {
        this.style.background='#1a5c2a'; this.style.borderColor='#4cff90';
        streak++; quizPoints++;
        user.streak = streak;
        if (streak > (user.infinityBestStreak || 0)) user.infinityBestStreak = streak;
        var xpR={facil:10,normal:25,dificil:50,experto:100};
        var coinR={facil:2,normal:5,dificil:10,experto:20};
        user.xp+=xpR[difficulty]; user.coins+=coinR[difficulty];
        if (streak>=5) user.logros.rach5=true;
        if (streak>=10) user.logros.rach10=true;
        if (streak>=20) user.logros.rach20=true;
        if (calcLevel()>=10) user.logros.nivel10=true;
        if (difficulty==='experto') user.logros.experto1=true;
        saveUser();
        document.getElementById('displayCoins').textContent='💰 '+user.coins;
        document.getElementById('displayXP').textContent='⭐ '+user.xp+' XP';
        document.getElementById('quizStats').innerHTML='<span class="correct">✅ ¡Correcto! +'+xpR[difficulty]+'⭐ +'+coinR[difficulty]+'💰</span><br>Racha: '+streak+' | Puntos: '+quizPoints+' | Nivel: '+calcLevel();
        setTimeout(showQuestion,1200);
      } else {
        this.style.background='#5c1a1a'; this.style.borderColor='#ff4444';
        streak=0;
        user.streak = 0;
        saveUser();
        for (var m=0;m<allBtns.length;m++) { if (Number(allBtns[m].dataset.val)===correct) { allBtns[m].style.background='#1a5c2a'; allBtns[m].style.borderColor='#4cff90'; } }
        document.getElementById('quizStats').innerHTML='<span class="wrong">❌ Incorrecto. Era: <strong>'+correct+'</strong></span><br>Racha perdida | Puntos: '+quizPoints;
        setTimeout(showQuestion,1500);
      }
    });
  }
}

loadUser();
