// Módulo para resolver ecuaciones con procedimiento detallado - Método de Aspa Simple, Fórmula General y solución numérica general

export function solveEquation(equation) {
  // Limpiar espacios
  equation = equation.replace(/\s/g, '');
  
  // Intentar parsear como ecuación cuadrática (ax^2 + bx + c = 0)
  const quadraticMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (quadraticMatch) {
    const res = solveQuadratic(quadraticMatch);
    res.coefficients = { a: res.a, b: res.b, c: res.c };
    return res;
  }
  
  // Intentar parsear como ecuación cuadrática sin término x (ax^2 + c = 0)
  const quadraticNoXMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)=0/i);
  if (quadraticNoXMatch) {
    return solveQuadraticNoX(quadraticNoXMatch);
  }
  
  // Intentar parsear como ecuación lineal (ax + b = 0)
  const linearMatch = equation.match(/([+-]?\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (linearMatch) {
    return solveLinear(linearMatch);
  }

  // Si no coincide con los formatos anteriores, usar solucionador general numérico/simbólico
  return solveGeneralEquation(equation);
}

function solveQuadratic(match) {
  let a = parseFloat(match[1]);
  if (isNaN(a)) {
    a = match[1] === '-' ? -1 : 1;
  }
  let b = parseFloat(match[2]);
  if (isNaN(b)) {
    b = match[2] === '-' ? -1 : 1;
  }
  let c = parseFloat(match[3]);
  if (isNaN(c)) {
    c = 0;
  }
  
  const discriminant = b * b - 4 * a * c;
  
  let steps = [];
  steps.push(`<strong>Ecuación Cuadrática: ${a}x² + ${b}x + ${c} = 0</strong>`);
  steps.push(`<strong>Coeficientes:</strong> a = ${a}, b = ${b}, c = ${c}`);
  
  // Método de Aspa Simple
  steps.push(`<br><strong style="color: #4cff90;">MÉTODO: ASPA SIMPLE (Factorización)</strong>`);
  
  const aspaSolution = tryAspaSolution(a, b, c);
  if (aspaSolution) {
    steps.push(aspaSolution.diagram);
    steps.push(`<strong style="color: #4cff90;">Verificación: ${aspaSolution.p1}x + ${aspaSolution.p2}x = ${aspaSolution.p1 + aspaSolution.p2}x ✓</strong>`);
    steps.push(`<br><strong>Factorización:</strong> (${aspaSolution.factor1})(${aspaSolution.factor2}) = 0`);
    steps.push(`<br><strong>Soluciones:</strong>`);
    // Mostrar como x₁ y x₂ en pasos intermedios (subíndice pequeño)
    steps.push(`${aspaSolution.factor1} = 0 → x<sub>1</sub> = ${formatNumber(aspaSolution.x1)}`);
    steps.push(`${aspaSolution.factor2} = 0 → x<sub>2</sub> = ${formatNumber(aspaSolution.x2)}`);
    
    return {
      error: false,
      steps: steps,
      solutions: [aspaSolution.x1, aspaSolution.x2],
      type: 'quadratic',
      a, b, c
    };
  }
  
  // Si no se puede factorizar, usar Fórmula General
  steps.push(`<strong style="color: #ffd700;">No se puede factorizar fácilmente. Usando Fórmula General...</strong>`);
  steps.push(`<br><strong style="color: #4cff90;">MÉTODO: FÓRMULA GENERAL</strong>`);
  steps.push(`<strong>Fórmula:</strong> x = (-b ± √(b² - 4ac)) / 2a`);
  steps.push(`<br><strong>Paso 1 - Identificar coeficientes:</strong>`);
  steps.push(`a = ${a}, b = ${b}, c = ${c}`);
  steps.push(`<br><strong>Paso 2 - Calcular el discriminante (Δ = b² - 4ac):</strong>`);
  steps.push(`Δ = (${b})² - 4(${a})(${c})`);
  steps.push(`Δ = ${b * b} - ${4 * a * c}`);
  steps.push(`Δ = ${discriminant}`);
  
  if (discriminant < 0) {
    steps.push(`<span style="color: #ff4d6d;"><strong>⚠️ Discriminante negativo (${discriminant})</strong></span>`);
    steps.push(`No hay soluciones reales. Las soluciones son complejas.`);
    return {
      error: false,
      steps: steps,
      solutions: null,
      type: 'quadratic',
      a, b, c
    };
  }
  
  steps.push(`<br><strong>Paso 3 - Calcular √Δ:</strong>`);
  steps.push(`√${discriminant} = ${Math.sqrt(discriminant).toFixed(6)}`);
  steps.push(`<br><strong>Paso 4 - Aplicar la fórmula:</strong>`);
  steps.push(`x = (-${b} ± ${Math.sqrt(discriminant).toFixed(6)}) / ${2 * a}`);
  
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const x1 = (-b + sqrtDiscriminant) / (2 * a);
  const x2 = (-b - sqrtDiscriminant) / (2 * a);
  
  // Mostrar como x₁ y x₂ en pasos intermedios
  steps.push(`<strong style="color: #4cff90;">x<sub>1</sub> = ${formatNumber(x1)}</strong>`);
  steps.push(`<strong style="color: #4cff90;">x<sub>2</sub> = ${formatNumber(x2)}</strong>`);
  
  return {
    error: false,
    steps: steps,
    solutions: [x1, x2],
    type: 'quadratic',
    a, b, c
  };
}

function solveQuadraticNoX(match) {
  let a = parseFloat(match[1]);
  if (isNaN(a)) {
    a = match[1] === '-' ? -1 : 1;
  }
  let c = parseFloat(match[2]);
  let b = 0;
  
  let steps = [];
  steps.push(`<strong>Ecuación Cuadrática Incompleta: ${a}x² + ${c} = 0</strong>`);
  steps.push(`<strong>Coeficientes:</strong> a = ${a}, b = 0, c = ${c}`);
  
  const discriminant = -4 * a * c;
  if (discriminant < 0) {
      steps.push(`<br><strong style="color: #ff4d6d;">No hay soluciones reales.</strong>`);
      return { error: false, steps, solutions: null, type: 'quadratic' };
  }
  
  const x1 = Math.sqrt(discriminant) / (2 * a);
  const x2 = -x1;
  
  steps.push(`<br><strong>Solución:</strong>`);
  steps.push(`${a}x² = ${-c}`);
  steps.push(`x² = ${-c / a}`);
  steps.push(`x = ±√${-c / a}`);
  // intermedio: x₁/x₂
  steps.push(`<strong style="color: #4cff90;">x<sub>1</sub> = ${formatNumber(x1)}</strong>`);
  steps.push(`<strong style="color: #4cff90;">x<sub>2</sub> = ${formatNumber(x2)}</strong>`);
  
  return {
    error: false,
    steps: steps,
    solutions: [x1, x2],
    type: 'quadratic'
  };
}

function tryAspaSolution(a, b, c) {
  // Buscar dos números que multiplicados den a*c y sumados den b
  const ac = a * c;
  if (ac === 0) return null;
  
  const divisors = [];
  for (let i = -Math.abs(ac); i <= Math.abs(ac); i++) {
    if (i !== 0 && ac % i === 0) {
      divisors.push(i);
    }
  }
  
  for (let p1 of divisors) {
    const p2 = ac / p1;
    if (p1 + p2 === b) {
      // Intentar encontrar factores (mx + r)(nx + s) = mnx^2 + (ms + nr)x + rs
      // Aquí simplificamos para casos comunes donde m=a o m=1
      // Este es un buscador simplificado de aspa
      for (let m = 1; m <= Math.abs(a); m++) {
          if (a % m === 0) {
              let n = a / m;
              // m*n = a, r*s = c, m*s + n*r = b
              for (let r = -Math.abs(c); r <= Math.abs(c); r++) {
                  if (r !== 0 && c % r === 0) {
                      let s = c / r;
                      if (m * s + n * r === b) {
                          const x1 = -r / m;
                          const x2 = -s / n;
                          
                          const factor1 = `${m}x ${r >= 0 ? '+' : '-'} ${Math.abs(r)}`;
                          const factor2 = `${n}x ${s >= 0 ? '+' : '-'} ${Math.abs(s)}`;
                          
                          const diagram = createAspaDiagram(a, b, c, n*r, m*s, r, s, m, n);
                          
                          return { diagram, p1: n*r, p2: m*s, factor1, factor2, x1, x2 };
                      }
                  } else if (c === 0 && r === 0) {
                      // Caso c=0 no manejado aquí por simplicidad
                  }
              }
          }
      }
    }
  }
  
  return null;
}

function createAspaDiagram(a, b, c, p1, p2, r, s, m, n) {
  return `
    <div style="background: rgba(76,144,255,0.06); border: 1px solid rgba(76,144,255,0.18); border-radius: 8px; padding: 14px; margin: 10px 0; font-family: 'Courier New', monospace; font-size: 13px; color: #e8eaff;">
      <div style="text-align: center; margin-bottom: 8px;"><strong style="font-size: 13px;">ASPA SIMPLE</strong></div>
      <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 8px;">
        <div style="text-align: right;">
            <div>${m}x</div>
            <div>${n}x</div>
        </div>
        <div style="font-size: 20px;">╳</div>
        <div style="text-align: left;">
            <div>${r}</div>
            <div>${s}</div>
        </div>
        <div style="border-left: 1px solid rgba(255,255,255,0.06); padding-left: 10px;">
            <div>= ${p1}x</div>
            <div>= ${p2}x</div>
            <div style="border-top: 1px solid #4cff90; margin-top: 5px; color: #ffd700;">${p1+p2}x</div>
        </div>
      </div>
    </div>
  `;
}

function solveLinear(match) {
  let a = parseFloat(match[1]);
  if (isNaN(a)) a = match[1] === '-' ? -1 : 1;
  let b = parseFloat(match[2]);
  
  const x = -b / a;
  
  let steps = [];
  steps.push(`<strong>Ecuación Lineal: ${a}x + ${b} = 0</strong>`);
  steps.push(`<strong>Coeficientes:</strong> a = ${a}, b = ${b}`);
  
  steps.push(`<br><strong>Método: Despeje</strong>`);
  steps.push(`${a}x + ${b} = 0`);
  steps.push(`${a}x = ${-b}`);
  steps.push(`x = ${-b} / ${a}`);
  steps.push(`<strong style="color: #4cff90;">x<sub>1</sub> = ${formatNumber(x)}</strong>`);
  
  return {
    error: false,
    steps: steps,
    solutions: [x],
    type: 'linear'
  };
}

// SOLUCIONADOR GENERAL (numérico) para ecuaciones arbitrarias en x
function solveGeneralEquation(equation) {
  // Espera ecuación con '='. Convertir a f(x) = left - right
  const parts = equation.split('=');
  if (parts.length !== 2) {
    return { error: true, message: 'Formato no reconocido para solucionador general. Asegúrate de usar = en la ecuación.' };
  }
  const left = parts[0];
  const right = parts[1];
  // Preparar expresión JS: reemplazar ^ por **, funciones trigonométricas con Math si es necesario
  const expr = (`(${left}) - (${right})`).replace(/\^/g, '**');

  // Crear evaluador seguro relativo (usa Math)
  let f;
  try {
    // eslint-disable-next-line no-new-func
    f = new Function('x', 'with (Math) { return ' + expr + '; }');
    // prueba rápida
    f(0);
  } catch (e) {
    return { error: true, message: 'No pude interpretar la ecuación para el solucionador general.' };
  }

  const steps = [];
  steps.push(`<strong>Solución general (numérica):</strong> Se buscarán raíces reales de f(x) = ${escapeHtml(expr)}`);
  steps.push(`<br><strong>Nota:</strong> El solucionador numérico busca raíces reales dentro de un rango y evita puntos de discontinuidad.`);

  // Escaneo para bracketing
  const solutions = [];
  const minX = -100, maxX = 100;
  const initialSteps = 2000; // malla fina para detectar cambios de signo
  const dx = (maxX - minX) / initialSteps;

  function safeEval(x) {
    try {
      const y = f(x);
      if (!isFinite(y)) return null;
      if (Number.isNaN(y)) return null;
      return y;
    } catch (e) {
      return null;
    }
  }

  let prevX = minX;
  let prevY = safeEval(prevX);
  for (let i = 1; i <= initialSteps; i++) {
    const curX = minX + i * dx;
    const curY = safeEval(curX);
    if (curY === null || prevY === null) {
      prevX = curX; prevY = curY; continue; // salto sobre discontinuidades
    }
    // Cambio de signo -> posible raíz
    if (prevY === 0 || Math.sign(prevY) !== Math.sign(curY)) {
      const root = bisect(f, prevX, curX, 1e-9, 60);
      if (root !== null) {
        // evitar duplicados
        if (!solutions.some(s => Math.abs(s - root) < 1e-7)) {
          solutions.push(root);
        }
      }
    }
    // También detectar toques (mínimos locales cerca de cero)
    prevX = curX; prevY = curY;
  }

  if (solutions.length === 0) {
    // intentar búsqueda de mínimos donde |f| pequeño
    for (let x = -50; x <= 50; x += 0.5) {
      const y = safeEval(x);
      if (y === null) continue;
      if (Math.abs(y) < 1e-4) {
        // afinar
        const root = refineRoot(f, x, 1e-9, 40);
        if (root !== null && !solutions.some(s => Math.abs(s - root) < 1e-7)) {
          solutions.push(root);
        }
      }
    }
  }

  if (solutions.length === 0) {
    steps.push(`<br><span style="color: #ff4d6d;"><strong>No se encontraron raíces reales en el rango [-100,100].</strong></span>`);
    return { error: false, steps, solutions: null, type: 'general' };
  }

  // ordenar por valor (x1 = soluciones[0], x2 = soluciones[1])
  solutions.sort((a, b) => a - b);

  steps.push(`<br><strong>Soluciones encontradas (pasos intermedios muestran x₁/x₂):</strong>`);
  solutions.forEach((s, idx) => {
    steps.push(`x<sub>${idx+1}</sub> = ${formatNumber(s)}`);
  });

  return {
    error: false,
    steps,
    solutions,
    type: 'general'
  };
}

// Métodos numéricos auxiliares
function bisect(f, a, b, tol = 1e-9, maxIter = 60) {
  let fa, fb;
  try { fa = f(a); fb = f(b); } catch (e) { return null; }
  if (fa === null || fb === null) return null;
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (Math.sign(fa) === Math.sign(fb)) return null;
  let left = a, right = b, mid, fmid;
  for (let i = 0; i < maxIter; i++) {
    mid = (left + right) / 2;
    try { fmid = f(mid); } catch (e) { return null; }
    if (fmid === null) return null;
    if (Math.abs(fmid) < tol) return mid;
    if (Math.sign(fmid) === Math.sign(fa)) { left = mid; fa = fmid; } else { right = mid; fb = fmid; }
  }
  return mid;
}

function refineRoot(f, x0, tol = 1e-9, maxIter = 40) {
  // Newton-like with numerical derivative
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    let fx;
    try { fx = f(x); } catch (e) { return null; }
    if (!isFinite(fx)) return null;
    const h = 1e-6;
    const fpx = (f(x + h) - f(x - h)) / (2 * h);
    if (Math.abs(fpx) < 1e-12) break;
    const dx = fx / fpx;
    x = x - dx;
    if (Math.abs(dx) < tol) return x;
  }
  return null;
}

// Formatear y salida
export function formatSolution(result) {
  if (result.error) {
    return `<div style="color: #ff4d6d; font-size: 16px; line-height: 1.6; font-weight: 500;">${result.message}</div>`;
  }
  
  let html = `<div style="font-size: 16px; line-height: 1.8; color: #fff; text-shadow: 0 0 1px rgba(255,255,255,0.2);">`;
  
  result.steps.forEach(step => {
    html += `<div style="margin: 10px 0;">${step}</div>`;
  });
  
  if (result.solutions) {
    html += `<div style="margin-top: 20px; padding: 18px; background: linear-gradient(135deg, rgba(76,255,144,0.06), rgba(76,144,255,0.04)); border: 1px solid rgba(76,255,144,0.08); border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.5);">`;
    html += `<strong style="color: #4cff90; font-size: 18px;">✓ SOLUCIONES FINALES:</strong><br>`;
    // Mostrar x₁ y x₂ en la salida final (intermedio)
    if (result.solutions.length >= 2) {
      html += `<div style="margin-top: 8px;">x<sub>1</sub> = <strong style="color: #ffd700; font-size: 18px;">${formatNumber(result.solutions[0])}</strong></div>`;
      html += `<div style="margin-top: 4px;">x<sub>2</sub> = <strong style="color: #ffd700; font-size: 18px;">${formatNumber(result.solutions[1])}</strong></div>`;
      // Resolución final según tu pedido: x = x1, y = x2
      html += `<hr style="opacity:0.08;margin:10px 0;">`;
      html += `<div style="margin-top: 8px; font-size:16px;">Resolución final:</div>`;
      html += `<div style="margin-top:6px;">x = <strong style="color: #ffd700; font-size: 20px;">${formatNumber(result.solutions[0])}</strong></div>`;
      html += `<div style="margin-top:4px;">y = <strong style="color: #ffd700; font-size: 20px;">${formatNumber(result.solutions[1])}</strong></div>`;
    } else {
      html += `<div style="margin-top: 8px;">x = <strong style="color: #ffd700; font-size: 20px;">${formatNumber(result.solutions[0])}</strong></div>`;
    }
    html += `</div>`;
  }

  // Si es cuadrática o general, añadir contenedor para el gráfico interactivo
  if ((result.type === 'quadratic' || result.type === 'general') && result.a !== undefined || result.type === 'general') {
    html += `<div style="margin-top: 20px; text-align: center;">`;
    html += `<strong style="color: #4c90ff; display: block; margin-bottom: 10px;">GRÁFICO DE LA PARÁBOLA / FUNCIÓN:</strong>`;
    html += `<div id="equationGraphContainer" style="display:inline-block; background: rgba(0,0,0,0.35); padding: 12px; border-radius: 12px; border: 1px solid rgba(76,144,255,0.18);">`;
    html += `<canvas id="equationGraph" width="640" height="360" style="max-width: 100%; display: block; border-radius: 8px;"></canvas>`;
    html += `<div style="margin-top:8px; display:flex; gap:8px; justify-content:center; align-items:center;">`;
    html += `<button id="zoomOutBtn" style="background:#122034;color:#fff;border:none;padding:6px 10px;border-radius:6px;">-</button>`;
    html += `<input id="zoomRange" type="range" min="0.5" max="3" step="0.01" value="1" style="width:160px;">`;
    html += `<button id="zoomInBtn" style="background:#122034;color:#fff;border:none;padding:6px 10px;border-radius:6px;">+</button>`;
    html += `<button id="resetViewBtn" style="background:#122034;color:#fff;border:none;padding:6px 10px;border-radius:6px;">Reset</button>`;
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;

    // Inyectar script para dibujar el gráfico y habilitar zoom/pan
    setTimeout(() => {
        const canvas = document.getElementById('equationGraph');
        const container = document.getElementById('equationGraphContainer');
        if (!canvas) return;

        // Estado interactivo
        let state = {
          scale: 1,
          translateX: 0,
          translateY: 0
        };

        // Obtener soluciones y coeficientes de result
        const sols = result.solutions || [];
        const a = result.a; const b = result.b; const c = result.c;

        // función para evaluar y dibujar
        const redraw = () => {
          drawGraphInteractive(canvas, a, b, c, sols, state);
        };

        // Zoom controls
        const zoomRange = document.getElementById('zoomRange');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetViewBtn = document.getElementById('resetViewBtn');

        zoomRange.addEventListener('input', (e) => { state.scale = parseFloat(e.target.value); redraw(); });
        zoomInBtn.addEventListener('click', () => { state.scale = Math.min(3, state.scale + 0.1); zoomRange.value = state.scale; redraw(); });
        zoomOutBtn.addEventListener('click', () => { state.scale = Math.max(0.5, state.scale - 0.1); zoomRange.value = state.scale; redraw(); });
        resetViewBtn.addEventListener('click', () => { state = { scale: 1, translateX: 0, translateY: 0 }; zoomRange.value = 1; redraw(); });

        // Wheel zoom
        canvas.addEventListener('wheel', (ev) => {
          ev.preventDefault();
          const delta = ev.deltaY > 0 ? -0.05 : 0.05;
          state.scale = Math.max(0.5, Math.min(3, state.scale + delta));
          zoomRange.value = state.scale;
          redraw();
        });

        // Drag to pan
        let dragging = false;
        let last = null;
        canvas.addEventListener('pointerdown', (e) => { dragging = true; last = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove', (e) => {
          if (!dragging || !last) return;
          const dx = e.clientX - last.x; const dy = e.clientY - last.y;
          last = { x: e.clientX, y: e.clientY };
          state.translateX += dx; state.translateY += dy; redraw();
        });
        canvas.addEventListener('pointerup', (e) => { dragging = false; last = null; canvas.releasePointerCapture(e.pointerId); });
        canvas.addEventListener('pointercancel', () => { dragging = false; last = null; });

        // Initial draw
        redraw();
    }, 120);
  }
  
  html += `</div>`;
  return html;
}

// Dibuja la función/parábola en canvas con estética mejorada y respetando zoom/pan
function drawGraphInteractive(canvas, a, b, c, solutions, state) {
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * DPR;
    const h = canvas.clientHeight * DPR;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

    ctx.clearRect(0, 0, w, h);

    // transform for pan/zoom
    ctx.save();
    ctx.translate(state.translateX * DPR, state.translateY * DPR);
    ctx.scale(state.scale, state.scale);

    const margin = 50 * DPR;
    const centerX = w / 2;
    const centerY = h / 2;

    // Determine x range from solutions or default
    let minX = -10, maxX = 10;
    if (solutions && solutions.length > 0) {
        const solMin = Math.min(...solutions);
        const solMax = Math.max(...solutions);
        minX = Math.floor(solMin - 4);
        maxX = Math.ceil(solMax + 4);
    }

    const scaleX = (w - 2 * margin) / (maxX - minX);
    const rangeY = 20;
    const scaleY = (h - 2 * margin) / rangeY;

    // Grid
    ctx.strokeStyle = 'rgba(76,144,255,0.08)';
    ctx.lineWidth = 1 * DPR;
    for (let i = Math.ceil(minX); i <= Math.floor(maxX); i++) {
        const x = margin + (i - minX) * scaleX;
        ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, h - margin); ctx.stroke();
    }
    for (let i = -10; i <= 10; i++) {
        const y = centerY - i * scaleY;
        ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(w - margin, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(76, 144, 255, 0.36)';
    ctx.lineWidth = 2 * DPR;
    const axisY = margin + (-minX) * scaleX; // x=0 line
    // X axis
    ctx.beginPath(); ctx.moveTo(margin, centerY); ctx.lineTo(w - margin, centerY); ctx.stroke();
    // Y axis
    ctx.beginPath(); ctx.moveTo(axisY, margin); ctx.lineTo(axisY, h - margin); ctx.stroke();

    // Ticks & labels
    ctx.fillStyle = 'rgba(232,234,255,0.8)';
    ctx.font = `${12 * DPR}px Orbitron`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = Math.ceil(minX); i <= Math.floor(maxX); i++) {
        const x = margin + (i - minX) * scaleX;
        ctx.fillText(i.toString(), x, centerY + 6 * DPR);
    }

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (let i = -8; i <= 8; i += 2) {
        const yVal = i;
        const y = centerY - i * scaleY;
        ctx.fillText(yVal.toString(), axisY + 6 * DPR, y);
    }

    // Draw function curve
    const gradient = ctx.createLinearGradient(margin, 0, w - margin, 0);
    gradient.addColorStop(0, '#4c90ff');
    gradient.addColorStop(0.5, '#4cff90');
    gradient.addColorStop(1, '#4c90ff');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3 * DPR;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const fn = (x) => {
        if (a !== undefined && b !== undefined && c !== undefined) return a * x * x + b * x + c;
        // else rely on global function parser (not provided here) - fallback 0
        try {
          // nothing - the general case uses drawGraphInteractive only for visualization of roots
          return 0;
        } catch (e) { return 0; }
    };

    const step = (maxX - minX) / 2000; // smooth
    let started = false;
    for (let x = minX; x <= maxX; x += step) {
        const yVal = fn(x);
        const canvasX = margin + (x - minX) * scaleX;
        const canvasY = centerY - yVal * scaleY;
        if (!started) { ctx.moveTo(canvasX, canvasY); started = true; } else { ctx.lineTo(canvasX, canvasY); }
    }
    ctx.stroke();

    // Fill under curve subtle
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#4c90ff';
    ctx.beginPath();
    let firstPoint = true;
    for (let x = minX; x <= maxX; x += step) {
        const yVal = fn(x);
        const canvasX = margin + (x - minX) * scaleX;
        const canvasY = centerY - yVal * scaleY;
        if (firstPoint) { ctx.moveTo(canvasX, canvasY); firstPoint = false; } else { ctx.lineTo(canvasX, canvasY); }
    }
    ctx.lineTo(w - margin, centerY); ctx.lineTo(margin, centerY); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // Roots markers
    if (solutions && solutions.length) {
        const markerXs = solutions.map(s => margin + (s - minX) * scaleX);
        markerXs.forEach((mx, idx) => {
            ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.arc(mx, centerY, 8 * DPR, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = `${11 * DPR}px Rajdhani`; ctx.textAlign = 'center'; ctx.fillText(`x\u208${idx+1}`, mx, centerY - 18 * DPR);
        });
        // Mostrar etiqueta con valores separados (x = ..., y = ...) entre las dos raíces
        if (solutions.length >= 2) {
            const midX = (markerXs[0] + markerXs[1]) / 2;
            ctx.fillStyle = '#fff'; ctx.font = `${13 * DPR}px Rajdhani`;
            ctx.textAlign = 'center';
            ctx.fillText(`x = ${formatNumber(solutions[0])}`, midX, centerY - 32 * DPR);
            ctx.fillText(`y = ${formatNumber(solutions[1])}`, midX, centerY - 16 * DPR);
        }
    }

    // Axis labels
    ctx.fillStyle = 'rgba(232,234,255,0.9)';
    ctx.font = `${13 * DPR}px Orbitron`;
    ctx.fillText('X', w - margin - 8 * DPR, centerY + 16 * DPR);
    ctx.fillText('Y', axisY + 8 * DPR, margin + 6 * DPR);

    ctx.restore();
}

// Formatea números: no muestra decimales innecesarios (3.0000 -> 3), pero mantiene decimales significativos
function formatNumber(num) {
  if (num === null || num === undefined) return String(num);
  if (!isFinite(num)) return String(num);
  // tratar valores cercanos a entero
  const rounded = Math.round(num);
  if (Math.abs(num - rounded) < 1e-9) return String(rounded);
  // Mostrar hasta 8 decimales, quitando ceros finales
  let s = Number(num).toFixed(8).replace(/\.?0+$/, '');
  return s;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; });
}
