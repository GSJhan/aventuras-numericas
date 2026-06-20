// Módulo para resolver ecuaciones con procedimiento detallado - Método de Aspa Simple y Fórmula General

export function solveEquation(equation) {
  // Limpiar espacios
  equation = equation.replace(/\s/g, '');
  
  // Intentar parsear como ecuación cuadrática (ax^2 + bx + c = 0)
  const quadraticMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (quadraticMatch) {
    return solveQuadratic(quadraticMatch);
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
  
  return {
    error: true,
    message: 'No se pudo reconocer el formato. Usa: ax^2+bx+c=0 o ax+b=0'
  };
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
    steps.push(`${aspaSolution.factor1} = 0 → x₁ = ${aspaSolution.x1.toFixed(4)}`);
    steps.push(`${aspaSolution.factor2} = 0 → x₂ = ${aspaSolution.x2.toFixed(4)}`);
    
    return {
      error: false,
      steps: steps,
      solutions: [aspaSolution.x1, aspaSolution.x2],
      type: 'quadratic'
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
      type: 'quadratic'
    };
  }
  
  steps.push(`<br><strong>Paso 3 - Calcular √Δ:</strong>`);
  steps.push(`√${discriminant} = ${Math.sqrt(discriminant).toFixed(4)}`);
  steps.push(`<br><strong>Paso 4 - Aplicar la fórmula:</strong>`);
  steps.push(`x = (-${b} ± ${Math.sqrt(discriminant).toFixed(4)}) / ${2 * a}`);
  
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const x1 = (-b + sqrtDiscriminant) / (2 * a);
  const x2 = (-b - sqrtDiscriminant) / (2 * a);
  
  steps.push(`<strong style="color: #4cff90;">x₁ = ${x1.toFixed(4)}</strong>`);
  steps.push(`<strong style="color: #4cff90;">x₂ = ${x2.toFixed(4)}</strong>`);
  
  return {
    error: false,
    steps: steps,
    solutions: [x1, x2],
    type: 'quadratic'
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
  steps.push(`<strong style="color: #4cff90;">x₁ = ${x1.toFixed(4)}</strong>`);
  steps.push(`<strong style="color: #4cff90;">x₂ = ${x2.toFixed(4)}</strong>`);
  
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
    <div style="background: rgba(76,144,255,0.1); border: 2px solid rgba(76,144,255,0.3); border-radius: 8px; padding: 20px; margin: 10px 0; font-family: 'Courier New', monospace; font-size: 12px; color: #e8eaff;">
      <div style="text-align: center; margin-bottom: 15px;"><strong style="font-size: 14px;">ASPA SIMPLE</strong></div>
      <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 10px;">
        <div style="text-align: right;">
            <div>${m}x</div>
            <div>${n}x</div>
        </div>
        <div style="font-size: 20px;">╳</div>
        <div style="text-align: left;">
            <div>${r}</div>
            <div>${s}</div>
        </div>
        <div style="border-left: 1px solid #444; padding-left: 10px;">
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
  steps.push(`<strong style="color: #4cff90;">x = ${x.toFixed(4)}</strong>`);
  
  return {
    error: false,
    steps: steps,
    solutions: [x],
    type: 'linear'
  };
}

export function formatSolution(result) {
  if (result.error) {
    return `<div style="color: #ff4d6d; font-size: 14px; line-height: 1.6;">${result.message}</div>`;
  }
  
  let html = `<div style="font-size: 13px; line-height: 1.8; color: #e8eaff;">`;
  
  result.steps.forEach(step => {
    html += `<div style="margin: 8px 0;">${step}</div>`;
  });
  
  if (result.solutions) {
    html += `<div style="margin-top: 15px; padding: 15px; background: rgba(76,255,144,0.1); border-left: 4px solid #4cff90; border-radius: 4px;">`;
    html += `<strong style="color: #4cff90;">✓ SOLUCIONES FINALES:</strong><br>`;
    result.solutions.forEach((sol, idx) => {
      html += `x<sub style="font-size: 10px;">${idx + 1}</sub> = <strong style="color: #ffd700;">${sol.toFixed(4)}</strong><br>`;
    });
    html += `</div>`;
  }
  
  html += `</div>`;
  return html;
}
