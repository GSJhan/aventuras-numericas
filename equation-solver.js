// Módulo para resolver ecuaciones con procedimiento detallado

export function solveEquation(equation) {
  // Limpiar espacios
  equation = equation.replace(/\s/g, '');
  
  // Intentar parsear como ecuación cuadrática (ax^2 + bx + c = 0)
  const quadraticMatch = equation.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d*)=0/i);
  if (quadraticMatch) {
    return solveQuadratic(quadraticMatch);
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
  let a = parseFloat(match[1]) || 1;
  let b = parseFloat(match[2]);
  let c = parseFloat(match[3]);
  
  // Normalizar coeficientes
  if (match[1] === '+' || match[1] === '') a = 1;
  if (match[1] === '-') a = -1;
  
  const discriminant = b * b - 4 * a * c;
  
  let steps = [];
  steps.push(`<strong>Ecuación Cuadrática: ${a}x² + ${b}x + ${c} = 0</strong>`);
  steps.push(`<strong>Coeficientes:</strong> a = ${a}, b = ${b}, c = ${c}`);
  
  steps.push(`<br><strong>Método 1: Fórmula General</strong>`);
  steps.push(`x = (-b ± √(b² - 4ac)) / 2a`);
  steps.push(`x = (-${b} ± √(${b}² - 4(${a})(${c}))) / 2(${a})`);
  steps.push(`x = (-${b} ± √(${b * b} - ${4 * a * c})) / ${2 * a}`);
  steps.push(`x = (-${b} ± √${discriminant}) / ${2 * a}`);
  
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
  
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const x1 = (-b + sqrtDiscriminant) / (2 * a);
  const x2 = (-b - sqrtDiscriminant) / (2 * a);
  
  steps.push(`x = (-${b} ± ${sqrtDiscriminant.toFixed(4)}) / ${2 * a}`);
  steps.push(`<strong style="color: #4cff90;">x₁ = ${x1.toFixed(4)}</strong>`);
  steps.push(`<strong style="color: #4cff90;">x₂ = ${x2.toFixed(4)}</strong>`);
  
  steps.push(`<br><strong>Método 2: Igualación (Factorización)</strong>`);
  steps.push(`${a}x² + ${b}x + ${c} = 0`);
  
  // Intentar factorizar
  const factorization = tryFactorize(a, b, c);
  if (factorization) {
    steps.push(`${factorization.expression}`);
    steps.push(`<strong style="color: #4cff90;">x₁ = ${factorization.x1.toFixed(4)}</strong>`);
    steps.push(`<strong style="color: #4cff90;">x₂ = ${factorization.x2.toFixed(4)}</strong>`);
  } else {
    steps.push(`La ecuación no se puede factorizar fácilmente.`);
    steps.push(`Usa la fórmula general (ver arriba).`);
  }
  
  return {
    error: false,
    steps: steps,
    solutions: [x1, x2],
    type: 'quadratic'
  };
}

function solveLinear(match) {
  let a = parseFloat(match[1]) || 1;
  let b = parseFloat(match[2]);
  
  // Normalizar coeficientes
  if (match[1] === '+' || match[1] === '') a = 1;
  if (match[1] === '-') a = -1;
  
  const x = -b / a;
  
  let steps = [];
  steps.push(`<strong>Ecuación Lineal: ${a}x + ${b} = 0</strong>`);
  steps.push(`<strong>Coeficientes:</strong> a = ${a}, b = ${b}`);
  
  steps.push(`<br><strong>Método: Despeje</strong>`);
  steps.push(`${a}x + ${b} = 0`);
  steps.push(`${a}x = -${b}`);
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

function tryFactorize(a, b, c) {
  // Buscar dos números que multiplicados den a*c y sumados den b
  const ac = a * c;
  
  for (let i = 1; i <= Math.sqrt(Math.abs(ac)); i++) {
    if (ac % i === 0) {
      const j = ac / i;
      if (i + j === b || i - j === b || -i + j === b || -i - j === b) {
        // Encontramos los números
        let p, q;
        if (i + j === b) { p = i; q = j; }
        else if (i - j === b) { p = i; q = -j; }
        else if (-i + j === b) { p = -i; q = j; }
        else { p = -i; q = -j; }
        
        const x1 = -q / a;
        const x2 = -p / a;
        
        const expression = `(${a}x + ${p})(x + ${q / a}) = 0`;
        return { expression, x1, x2 };
      }
    }
  }
  
  return null;
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
    html += `<strong style="color: #4cff90;">SOLUCIONES:</strong><br>`;
    result.solutions.forEach((sol, idx) => {
      html += `x${result.solutions.length > 1 ? (idx + 1) : ''} = <strong>${sol.toFixed(4)}</strong><br>`;
    });
    html += `</div>`;
  }
  
  html += `</div>`;
  return html;
}
