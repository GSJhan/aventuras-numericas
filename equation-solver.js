// Módulo para resolver ecuaciones con procedimiento detallado - Método de Aspa Simple

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
  steps.push(`<br><strong>Paso 3 - Calcular √Δ:</strong>`);
  steps.push(`√${discriminant} = ${Math.sqrt(discriminant).toFixed(4)}`);
  steps.push(`<br><strong>Paso 4 - Aplicar la fórmula:</strong>`);
  steps.push(`x = (-${b} ± ${Math.sqrt(discriminant).toFixed(4)}) / ${2 * a}`);
  
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
  
  return {
    error: false,
    steps: steps,
    solutions: [x1, x2],
    type: 'quadratic'
  };
}

function solveQuadraticNoX(match) {
  let a = parseFloat(match[1]) || 1;
  let c = parseFloat(match[2]);
  let b = 0;
  
  // Normalizar coeficientes
  if (match[1] === '+' || match[1] === '') a = 1;
  if (match[1] === '-') a = -1;
  
  let steps = [];
  steps.push(`<strong>Ecuación Cuadrática Incompleta: ${a}x² + ${c} = 0</strong>`);
  steps.push(`<strong>Coeficientes:</strong> a = ${a}, b = 0, c = ${c}`);
  
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
  
  return {
    error: false,
    steps: steps,
    solutions: null,
    type: 'quadratic'
  };
}

function tryAspaSolution(a, b, c) {
  // Buscar dos números que multiplicados den a*c y sumados den b
  const ac = a * c;
  
  // Generar divisores de ac
  const divisors = [];
  for (let i = 1; i <= Math.abs(ac); i++) {
    if (ac % i === 0) {
      divisors.push(i);
      divisors.push(-i);
    }
  }
  
  // Buscar pares que cumplan la condición
  for (let p1 of divisors) {
    const p2 = ac / p1;
    if (p1 + p2 === b) {
      // Encontramos los números
      const factor1Num = a;
      const factor1Const = p1;
      const factor2Num = 1;
      const factor2Const = p2 / a;
      
      // Verificar que factor2Const sea entero
      if (Number.isInteger(factor2Const)) {
        const x1 = -factor1Const / factor1Num;
        const x2 = -factor2Const / factor2Num;
        
        // Crear diagrama visual del Aspa Simple
        const diagram = createAspaDiagram(a, b, c, p1, p2, factor1Const, factor2Const);
        
        const factor1 = factor1Num === 1 ? `x + ${factor1Const}` : `${factor1Num}x + ${factor1Const}`;
        const factor2 = factor2Num === 1 ? `x + ${factor2Const}` : `${factor2Num}x + ${factor2Const}`;
        
        return {
          diagram,
          p1,
          p2,
          factor1,
          factor2,
          x1,
          x2
        };
      }
    }
  }
  
  return null;
}

function createAspaDiagram(a, b, c, p1, p2, f1c, f2c) {
  const diagram = `
    <div style="background: rgba(76,144,255,0.1); border: 2px solid rgba(76,144,255,0.3); border-radius: 8px; padding: 20px; margin: 10px 0; font-family: 'Courier New', monospace; font-size: 12px; color: #e8eaff;">
      <div style="text-align: center; margin-bottom: 15px;"><strong style="font-size: 14px;">ASPA SIMPLE</strong></div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; text-align: center; margin-bottom: 15px;">
        <div>
          <div style="color: #4cff90; font-weight: bold; margin-bottom: 8px; font-size: 13px;">${a}x²</div>
          <div style="color: #ffd700; font-weight: bold; font-size: 13px;">${c}</div>
        </div>
        <div>
          <div style="color: #4cff90; font-weight: bold; margin-bottom: 8px; font-size: 13px;">x</div>
          <div style="color: #4cff90; font-weight: bold; font-size: 13px;">x</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 15px; color: #a78bfa;">
        <div style="margin-bottom: 5px;">↙ ↖</div>
        <div><strong style="color: #4cff90;">${p1}x</strong> + <strong style="color: #4cff90;">${p2}x</strong> = <strong style="color: #ffd700;">${p1 + p2}x</strong> ✓</div>
      </div>
      
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid rgba(76,144,255,0.3);">
        <strong style="color: #4cff90; font-size: 13px;">VERIFICACIÓN DEL TÉRMINO LINEAL:</strong>
        <div style="margin-top: 10px;">
          <div style="color: #fff; font-size: 12px; margin-bottom: 5px;">x + (${f1c}) = 0 → <strong style="color: #4cff90;">x<sub style="font-size: 9px;">1</sub> = ${-f1c}</strong></div>
          <div style="color: #fff; font-size: 12px;">x + (${f2c}) = 0 → <strong style="color: #4cff90;">x<sub style="font-size: 9px;">2</sub> = ${-f2c}</strong></div>
        </div>
      </div>
    </div>
  `;
  return diagram;
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
