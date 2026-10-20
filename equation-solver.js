// Módulo para resolver ecuaciones con procedimiento detallado - Método de Aspa Simple, Fórmula General y solución numérica general

export function solveEquation(equation) {
  equation = equation.replace(/\s/g, '');

  const quadraticMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (quadraticMatch) {
    const res = solveQuadratic(quadraticMatch);
    res.coefficients = { a: res.a, b: res.b, c: res.c };
    return res;
  }

  const quadraticNoXMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)=0/i);
  if (quadraticNoXMatch) {
    return solveQuadraticNoX(quadraticNoXMatch);
  }

  const linearMatch = equation.match(/([+-]?\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (linearMatch) {
    return solveLinear(linearMatch);
  }

  return solveGeneralEquationSync(equation);
}

export async function solveEquationAsync(equation) {
  equation = equation.replace(/\s/g, '');

  const quadraticMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (quadraticMatch) {
    const res = solveQuadratic(quadraticMatch);
    res.coefficients = { a: res.a, b: res.b, c: res.c };
    return res;
  }
  const quadraticNoXMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)=0/i);
  if (quadraticNoXMatch) {
    return solveQuadraticNoX(quadraticNoXMatch);
  }
  const linearMatch = equation.match(/([+-]?\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (linearMatch) {
    return solveLinear(linearMatch);
  }

  return await solveGeneralEquationAsync(equation);
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

  steps.push(`<br><strong style="color: #4cff90;">MÉTODO: ASPA SIMPLE (Factorización)</strong>`);

  const aspaSolution = tryAspaSolution(a, b, c);
  if (aspaSolution) {
    steps.push(aspaSolution.diagram);
    steps.push(`<strong style="color: #4cff90;">Verificación: ${aspaSolution.p1}x + ${aspaSolution.p2}x = ${aspaSolution.p1 + aspaSolution.p2}x ✓</strong>`);
    steps.push(`<br><strong>Factorización:</strong> (${aspaSolution.factor1})(${aspaSolution.factor2}) = 0`);
    steps.push(`<br><strong>Soluciones:</strong>`);
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
      for (let m = 1; m <= Math.abs(a); m++) {
        if (a % m === 0) {
          let n = a / m;
          for (let r = -Math.abs(c); r <= Math.abs(c); r++) {
            if (r !== 0 && c % r === 0) {
              let s = c / r;
              if (m * s + n * r === b) {
                const x1 = -r / m;
                const x2 = -s / n;

                const factor1 = `${m}x ${r >= 0 ? '+' : '-'} ${Math.abs(r)}`;
                const factor2 = `${n}x ${s >= 0 ? '+' : '-'} ${Math.abs(s)}`;

                const diagram = createAspaDiagram(a, b, c, n * r, m * s, r, s, m, n);

                return { diagram, p1: n * r, p2: m * s, factor1, factor2, x1, x2 };
              }
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
    <div style="background: rgba(76,144,255,0.06); border: 1px solid rgba(76,144,255,0.18); border-radius: 8px; padding: 14px; margin: 10px 0; font-family: 'Courier New', monospace; font-size: 13px;">
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
          <div style="border-top: 1px solid #4cff90; margin-top: 5px; color: #ffd700;">${p1 + p2}x</div>
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

function normalizeExpression(raw) {
  let expr = String(raw)
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'PI')
    .replace(/\^/g, '**')
    .replace(/\s+/g, '');

  expr = expr.replace(/(\d|\)|x|X|PI)(?=x|X|\()/gi, '$1*');
  expr = expr.replace(/(\d)(x|X)/gi, '$1*$2');
  expr = expr.replace(/(x|X)(\d)/gi, '$1*$2');

  return expr;
}

function compileSafeFunction(expression) {
  const expr = normalizeExpression(expression);
  const allowedPattern = /^[0-9xX\+\-\*\/\(\)\.,\^\sA-Za-z_]+$/;
  if (!allowedPattern.test(expr)) {
    throw new Error('Expresión no segura o no soportada.');
  }

  const fn = new Function(
    'x',
    `
      const { abs, sin, cos, tan, asin, acos, atan, sqrt, log, exp, min, max, pow, PI, E } = Math;
      const X = x;
      return (${expr});
    `
  );

  return fn;
}

function safeEvalExpression(fn, x) {
  try {
    const val = fn(x);
    if (!Number.isFinite(val)) return null;
    return val;
  } catch (e) {
    return null;
  }
}

function solveGeneralEquationSync(equation) {
  if (!equation || !equation.includes('=')) {
    return {
      error: true,
      message: 'Formato no reconocido. Usa una ecuación con =, por ejemplo: x^2-3x+2=0 o (x+1)/(x-2)=3.'
    };
  }

  const parts = equation.split('=');
  if (parts.length !== 2) {
    return {
      error: true,
      message: 'La ecuación general debe tener exactamente un signo igual.'
    };
  }

  const left = parts[0];
  const right = parts[1];

  const expr = `(${normalizeExpression(left)})-(${normalizeExpression(right)})`;
  const fn = compileSafeFunction(expr);

  const steps = [];
  steps.push(`<strong>Solución general (segura):</strong> Se evaluará la ecuación como f(x) = ${escapeHtml(expr)}.`);
  steps.push(`<br><strong>Nota:</strong> Este modo resuelve raíces reales numéricamente y evita valores donde hay división por cero o resultados no finitos.`);

  const solutions = [];
  const minX = -100;
  const maxX = 100;
  const step = 0.25;

  for (let x = minX; x <= maxX; x += step) {
    const aVal = safeEvalExpression(fn, x);
    const bVal = safeEvalExpression(fn, x + step);
    if (aVal === null || bVal === null) continue;

    if (Math.abs(aVal) < 1e-7) {
      if (!solutions.some(s => Math.abs(s - x) < 1e-6)) solutions.push(x);
      continue;
    }

    if (aVal === 0 || Math.sign(aVal) !== Math.sign(bVal)) {
      const root = findGeneralRoot(fn, x, x + step, 1e-9, 80);
      if (root !== null && !solutions.some(s => Math.abs(s - root) < 1e-6)) {
        solutions.push(root);
      }
    }
  }

  if (solutions.length === 0) {
    for (let x = minX; x <= maxX; x += 0.05) {
      const val = safeEvalExpression(fn, x);
      if (val === null) continue;
      if (Math.abs(val) < 1e-5) {
        const root = findGeneralRoot(fn, x - 0.05, x + 0.05, 1e-9, 80);
        if (root !== null && !solutions.some(s => Math.abs(s - root) < 1e-6)) {
          solutions.push(root);
        }
      }
    }
  }

  if (solutions.length === 0) {
    steps.push(`<br><span style="color: #ff4d6d;"><strong>No se encontraron raíces reales en el rango [-100,100].</strong></span>`);
    return { error: false, steps, solutions: null, type: 'general' };
  }

  solutions.sort((a, b) => a - b);

  steps.push(`<br><strong>Raíces reales encontradas:</strong>`);
  solutions.forEach((s, idx) => {
    steps.push(`x<sub>${idx + 1}</sub> = ${formatNumber(s)}`);
  });

  return {
    error: false,
    steps,
    solutions,
    type: 'general'
  };
}

async function solveGeneralEquationAsync(equation) {
  if (!equation || !equation.includes('=')) {
    return {
      error: true,
      message: 'Formato no reconocido. Usa una ecuación con =, por ejemplo: x^2-3x+2=0 o (x+1)/(x-2)=3.'
    };
  }

  const parts = equation.split('=');
  if (parts.length !== 2) {
    return {
      error: true,
      message: 'La ecuación general debe tener exactamente un signo igual.'
    };
  }

  const left = parts[0];
  const right = parts[1];

  const expr = `(${normalizeExpression(left)})-(${normalizeExpression(right)})`;
  const fn = compileSafeFunction(expr);

  const steps = [];
  steps.push(`<strong>Solución general (segura) — modo asíncrono:</strong> Se evaluará la ecuación como f(x) = ${escapeHtml(expr)}.`);
  steps.push(`<br><strong>Nota:</strong> El cálculo se realiza en background y no bloqueará la interfaz.`);

  const solutions = [];
  const minX = -100;
  const maxX = 100;
  const step = 0.25;

  async function yieldNow() { return new Promise(r => setTimeout(r, 0)); }

  let counter = 0;
  for (let x = minX; x <= maxX; x += step) {
    if ((counter++ & 127) === 0) await yieldNow();
    const aVal = safeEvalExpression(fn, x);
    const bVal = safeEvalExpression(fn, x + step);
    if (aVal === null || bVal === null) continue;

    if (Math.abs(aVal) < 1e-7) {
      if (!solutions.some(s => Math.abs(s - x) < 1e-6)) solutions.push(x);
      continue;
    }

    if (aVal === 0 || Math.sign(aVal) !== Math.sign(bVal)) {
      const root = await findGeneralRootAsync(fn, x, x + step, 1e-9, 80);
      if (root !== null && !solutions.some(s => Math.abs(s - root) < 1e-6)) {
        solutions.push(root);
      }
    }
  }

  if (solutions.length === 0) {
    counter = 0;
    for (let x = minX; x <= maxX; x += 0.05) {
      if ((counter++ & 127) === 0) await yieldNow();
      const val = safeEvalExpression(fn, x);
      if (val === null) continue;
      if (Math.abs(val) < 1e-5) {
        const root = await findGeneralRootAsync(fn, x - 0.05, x + 0.05, 1e-9, 80);
        if (root !== null && !solutions.some(s => Math.abs(s - root) < 1e-6)) {
          solutions.push(root);
        }
      }
    }
  }

  if (solutions.length === 0) {
    steps.push(`<br><span style="color: #ff4d6d;"><strong>No se encontraron raíces reales en el rango [-100,100].</strong></span>`);
    return { error: false, steps, solutions: null, type: 'general' };
  }

  solutions.sort((a, b) => a - b);

  steps.push(`<br><strong>Raíces reales encontradas:</strong>`);
  solutions.forEach((s, idx) => {
    steps.push(`x<sub>${idx + 1}</sub> = ${formatNumber(s)}`);
  });

  return {
    error: false,
    steps,
    solutions,
    type: 'general'
  };
}

async function findGeneralRootAsync(fn, left, right, tol = 1e-8, maxIter = 80) {
  let a = left;
  let b = right;
  let fa = safeEvalExpression(fn, a);
  let fb = safeEvalExpression(fn, b);

  if (fa === null || fb === null) return null;
  if (Math.abs(fa) < tol) return a;
  if (Math.abs(fb) < tol) return b;
  if (Math.sign(fa) === Math.sign(fb)) return null;

  let c = a;
  let fc = fa;
  for (let i = 0; i < maxIter; i++) {
    if ((i & 63) === 0) await new Promise(r => setTimeout(r, 0));
    c = (a + b) / 2;
    const fC = safeEvalExpression(fn, c);
    if (fC === null) return null;
    if (Math.abs(fC) < tol) return c;
    if (Math.sign(fa) === Math.sign(fC)) {
      a = c;
      fa = fC;
    } else {
      b = c;
      fb = fC;
    }
    if (Math.abs(b - a) < tol) return c;
  }
  return c;
}

function findGeneralRoot(fn, left, right, tol = 1e-8, maxIter = 80) {
  let a = left;
  let b = right;
  const fa = safeEvalExpression(fn, a);
  const fb = safeEvalExpression(fn, b);

  if (fa === null || fb === null) return null;
  if (Math.abs(fa) < tol) return a;
  if (Math.abs(fb) < tol) return b;
  if (Math.sign(fa) === Math.sign(fb)) return null;

  let c = a;
  let fc = fa;
  for (let i = 0; i < maxIter; i++) {
    c = (a + b) / 2;
    const fC = safeEvalExpression(fn, c);
    if (fC === null) return null;
    if (Math.abs(fC) < tol) return c;
    if (Math.sign(fa) === Math.sign(fC)) {
      a = c;
      fa = fC;
    } else {
      b = c;
      fb = fC;
    }
    if (Math.abs(b - a) < tol) return c;
  }
  return c;
}

export function formatSolution(result) {
  if (result.error) {
    return `<div style="color: #ff4d6d; font-size: 16px; line-height: 1.6; font-weight: 500;">${result.message}</div>`;
  }

  let html = `<div style="font-size: 16px; line-height: 1.8; color: #fff; text-shadow: 0 0 1px rgba(255,255,255,0.2);">`;

  result.steps.forEach(step => {
    html += `<div style="margin: 10px 0;">${step}</div>`;
  });

  if (result.solutions) {
    html += `<div style="margin-top: 20px; padding: 18px; background: linear-gradient(135deg, rgba(76,255,144,0.06), rgba(76,144,255,0.04)); border: 1px solid rgba(76,255,144,0.08); border-radius: 12px;">`;
    html += `<strong style="color: #4cff90; font-size: 18px;">✓ SOLUCIONES FINALES:</strong><br>`;
    if (result.solutions.length >= 2) {
      html += `<div style="margin-top: 8px;">x<sub>1</sub> = <strong style="color: #ffd700; font-size: 18px;">${formatNumber(result.solutions[0])}</strong></div>`;
      html += `<div style="margin-top: 4px;">x<sub>2</sub> = <strong style="color: #ffd700; font-size: 18px;">${formatNumber(result.solutions[1])}</strong></div>`;
      html += `<hr style="opacity:0.08;margin:10px 0;">`;
      html += `<div style="margin-top: 8px; font-size:16px;">Resolución final:</div>`;
      html += `<div style="margin-top:6px;">x = <strong style="color: #ffd700; font-size: 20px;">${formatNumber(result.solutions[0])}</strong></div>`;
      html += `<div style="margin-top:4px;">y = <strong style="color: #ffd700; font-size: 20px;">${formatNumber(result.solutions[1])}</strong></div>`;
    } else {
      html += `<div style="margin-top: 8px;">x = <strong style="color: #ffd700; font-size: 20px;">${formatNumber(result.solutions[0])}</strong></div>`;
    }
    html += `</div>`;
  }

  if ((result.type === 'quadratic' || result.type === 'general') && result.a !== undefined || result.type === 'general') {
    html += `<div style="margin-top: 20px; text-align: center;">`;
    html += `<strong style="color: #4c90ff; display: block; margin-bottom: 10px;">GRÁFICO DE LA PARÁBOLA / FUNCIÓN:</strong>`;
    html += `<div id="equationGraphContainer" style="display:flex; flex-direction:column; align-items:center; gap:12px; background: rgba(9,16,30,0.5); padding: 16px 16px 12px; border-radius: 14px; border: 1px solid rgba(76,144,255,0.25); box-shadow: inset 0 0 28px rgba(76,144,255,0.08);">`;
    html += `<canvas id="equationGraph" width="960" height="420" style="display:block; width:100%; max-width:100%; height:auto; border-radius:10px; background: rgba(0,0,0,0.12); touch-action:none; image-rendering:auto;"></canvas>`;
    html += `<div style="display:flex; gap:10px; justify-content:center; align-items:center; flex-wrap:wrap; width:100%;">`;
    html += `<button id="zoomOutBtn" style="background:#122034;color:#fff;border:none;padding:7px 12px;border-radius:8px;cursor:pointer;">-</button>`;
    html += `<input id="zoomRange" type="range" min="0.5" max="3" step="0.01" value="1" style="width:180px; accent-color:#4c90ff;">`;
    html += `<button id="zoomInBtn" style="background:#122034;color:#fff;border:none;padding:7px 12px;border-radius:8px;cursor:pointer;">+</button>`;
    html += `<button id="resetViewBtn" style="background:#122034;color:#fff;border:none;padding:7px 12px;border-radius:8px;cursor:pointer;">Reset</button>`;
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;

    setTimeout(() => {
      const canvas = document.getElementById('equationGraph');
      if (!canvas) return;

      let state = {
        scale: 1,
        translateX: 0,
        translateY: 0
      };

      const sols = result.solutions || [];
      const a = result.a; const b = result.b; const c = result.c;

      const redraw = () => {
        drawGraphInteractive(canvas, a, b, c, sols, state);
      };

      const zoomRange = document.getElementById('zoomRange');
      const zoomInBtn = document.getElementById('zoomInBtn');
      const zoomOutBtn = document.getElementById('zoomOutBtn');
      const resetViewBtn = document.getElementById('resetViewBtn');

      if (zoomRange) {
        zoomRange.addEventListener('input', (e) => { state.scale = parseFloat(e.target.value); redraw(); });
      }
      if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => { state.scale = Math.min(3, state.scale + 0.1); if (zoomRange) zoomRange.value = state.scale; redraw(); });
      }
      if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => { state.scale = Math.max(0.5, state.scale - 0.1); if (zoomRange) zoomRange.value = state.scale; redraw(); });
      }
      if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => { state = { scale: 1, translateX: 0, translateY: 0 }; if (zoomRange) zoomRange.value = 1; redraw(); });
      }

      canvas.addEventListener('wheel', (ev) => {
        ev.preventDefault();
        const delta = ev.deltaY > 0 ? -0.05 : 0.05;
        state.scale = Math.max(0.5, Math.min(3, state.scale + delta));
        if (zoomRange) zoomRange.value = state.scale;
        redraw();
      });

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

      const resizeObserver = new ResizeObserver(() => redraw());
      resizeObserver.observe(canvas);
      redraw();
    }, 120);
  }

  html += `</div>`;
  return html;
}

function getGraphBounds(a, b, c, solutions) {
  const seed = [10, 20, 30, 40, 50, 60, 80, 100];

  let xMax = 10;
  if (solutions && solutions.length) {
    const maxRoot = Math.max(0, ...solutions.map(v => Number.isFinite(v) ? Math.abs(v) : 0));
    xMax = Math.max(xMax, maxRoot + 10);
  }
  if (a !== undefined && b !== undefined && c !== undefined) {
    const vertexX = -b / (2 * a);
    const sampleStart = Math.max(0, vertexX - 10);
    const sampleEnd = Math.max(10, vertexX + 10);
    let yMax = 0;
    for (let x = sampleStart; x <= sampleEnd; x += 0.2) {
      const y = a * x * x + b * x + c;
      if (Number.isFinite(y)) yMax = Math.max(yMax, Math.abs(y));
    }
    xMax = Math.max(xMax, sampleEnd + 5);
    const baseY = Math.max(10, yMax + 10);
    return { xMin: 0, xMax, yMin: 0, yMax: baseY };
  }

  const fallbackY = seed.reduce((m, n) => Math.max(m, n), 10);
  return { xMin: 0, xMax, yMin: 0, yMax: fallbackY + 10 };
}

function getNiceStep(maxValue) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return 1;
  const rough = maxValue / 8;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  if (normalized < 1.5) return 1 * magnitude;
  if (normalized < 2) return 2 * magnitude;
  if (normalized < 5) return 5 * magnitude;
  return 10 * magnitude;
}

function drawGraphInteractive(canvas, a, b, c, solutions, state) {
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 960;
  const cssHeight = canvas.clientHeight || 420;
  const w = Math.max(640, Math.round(cssWidth * DPR));
  const h = Math.max(300, Math.round(cssHeight * DPR));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.clearRect(0, 0, w, h);

  const bounds = getGraphBounds(a, b, c, solutions);
  const xMin = bounds.xMin;
  const xMax = bounds.xMax;
  const yMin = bounds.yMin;
  const yMax = bounds.yMax;

  const pad = 64 * DPR;
  const plotWidth = w - pad * 2;
  const plotHeight = h - pad * 2;

  const xToCanvas = (x) => pad + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yToCanvas = (y) => h - pad - ((y - yMin) / (yMax - yMin)) * plotHeight;

  const xAxisY = yToCanvas(0);
  const yAxisX = xToCanvas(0);

  ctx.save();
  ctx.translate(state.translateX * DPR, state.translateY * DPR);
  ctx.scale(state.scale, state.scale);

  ctx.fillStyle = 'rgba(8,14,24,0.18)';
  ctx.fillRect(0, 0, w, h);

  const gridColor = 'rgba(76,144,255,0.12)';
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1 * DPR;
  const xStep = getNiceStep(xMax - xMin);
  const yStep = getNiceStep(yMax - yMin);

  for (let x = 0; x <= xMax; x += xStep) {
    const px = xToCanvas(x);
    ctx.beginPath();
    ctx.moveTo(px, pad);
    ctx.lineTo(px, h - pad);
    ctx.stroke();
  }
  for (let y = 0; y <= yMax; y += yStep) {
    const py = yToCanvas(y);
    ctx.beginPath();
    ctx.moveTo(pad, py);
    ctx.lineTo(w - pad, py);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(232,234,255,0.4)';
  ctx.lineWidth = 2 * DPR;
  ctx.beginPath();
  ctx.moveTo(pad, xAxisY);
  ctx.lineTo(w - pad, xAxisY);
  ctx.moveTo(yAxisX, pad);
  ctx.lineTo(yAxisX, h - pad);
  ctx.stroke();

  ctx.fillStyle = 'rgba(232,234,255,0.85)';
  ctx.font = `${12 * DPR}px Rajdhani`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let x = 0; x <= xMax; x += xStep) {
    const px = xToCanvas(x);
    ctx.fillText(String(x), px, xAxisY + 6 * DPR);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = 0; y <= yMax; y += yStep) {
    const py = yToCanvas(y);
    ctx.fillText(String(y), yAxisX - 8 * DPR, py);
  }

  ctx.beginPath();
  ctx.lineWidth = 3 * DPR;
  ctx.strokeStyle = '#4cff90';
  const fn = (x) => {
    if (a !== undefined && b !== undefined && c !== undefined) return a * x * x + b * x + c;
    return 0;
  };

  const steps = 1500;
  let started = false;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = fn(x);
    const px = xToCanvas(x);
    const py = yToCanvas(y);
    if (!Number.isFinite(py)) continue;
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  if (solutions && solutions.length) {
    solutions.forEach((s, idx) => {
      if (!Number.isFinite(s) || s < xMin || s > xMax) return;
      const px = xToCanvas(s);
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(px, xAxisY, 7 * DPR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `${11 * DPR}px Rajdhani`;
      ctx.textAlign = 'center';
      ctx.fillText(`x${idx + 1}`, px, xAxisY - 18 * DPR);
    });
  }

  ctx.fillStyle = 'rgba(232,234,255,0.9)';
  ctx.font = `${13 * DPR}px Orbitron`;
  ctx.textAlign = 'center';
  ctx.fillText('X', w - pad / 2, xAxisY + 22 * DPR);
  ctx.fillText('Y', yAxisX + 12 * DPR, pad / 2);
  ctx.restore();
}

function formatNumber(num) {
  if (num === null || num === undefined) return String(num);
  if (!isFinite(num)) return String(num);
  const rounded = Math.round(num);
  if (Math.abs(num - rounded) < 1e-9) return String(rounded);
  let s = Number(num).toFixed(8).replace(/\.?0+$/, '');
  return s;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; });
}
