export function renderSkillsTree(user, userRef, saveUser) {
  const container = document.getElementById('skillsTree');
  if (!user.skills) user.skills = {};
  if (!user.duelsWon) user.duelsWon = 0;
  if (!user.infinityBestStreak) user.infinityBestStreak = 0;
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;

  // Calcular nivel
  let level = 1, needed = 100, total = user.xp || 0;
  while (total >= needed && level < 100) { total -= needed; level++; needed += 100; }

  // Definir las 5 categorías para el pentágono (Escala 0-10)
  const stats = [
    { 
      label: 'Álgebra', 
      value: Math.min((user.xp / 1000) * 10, 10), 
      actual: 'Avanzada',
      desc: 'Dominio de ecuaciones'
    },
    { 
      label: 'Geometría', 
      value: Math.min((user.level || level) / 10, 10), 
      actual: 'Analítica',
      desc: 'Análisis espacial'
    },
    { 
      label: 'Duelos', 
      value: Math.min((user.duelsWon || 0) / 5, 10), 
      actual: user.duelsWon || 0,
      desc: 'Victorias online'
    },
    { 
      label: 'Rapidez', 
      value: Math.min((user.infinityBestStreak || 0) / 10, 10), 
      actual: user.infinityBestStreak || 0,
      desc: 'Racha máxima'
    },
    { 
      label: 'Precisión', 
      value: Math.min(((user.xp / (user.coins || 1)) / 10), 10), 
      actual: (user.xp > 0 ? 'Alta' : 'Baja'),
      desc: 'Efectividad'
    }
  ];

  // Limpiar completamente el contenedor para evitar que se vea el diseño antiguo
  container.innerHTML = '';

  let html = `<div class="skills-main-container" style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%;">`;
  
  // Cabecera de puntos
  html += `<div style="width: 100%; text-align:center; background: rgba(76,144,255,0.1); padding: 15px; border-radius: 12px; border: 1px solid #4c90ff;">`;
  html += `<div style="font-size: 14px; color: #4c90ff; text-transform: uppercase; letter-spacing: 1px;">Estado del Jugador</div>`;
  html += `<div style="font-size: 24px; font-family: 'Orbitron', sans-serif; color: #fff; margin-top: 5px;">Nv. ${level} - Maestro Numérico</div>`;
  html += `</div>`;

  // Contenedor del Canvas
  html += `<div style="position: relative; width: 100%; max-width: 450px; aspect-ratio: 1/1; background: rgba(8,12,26,0.8); border-radius: 20px; border: 1px solid rgba(76,144,255,0.3); padding: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.5);">`;
  html += `<canvas id="radarChart" width="450" height="450" style="width: 100%; height: 100%;"></canvas>`;
  html += `</div>`;

  // Grid de detalles
  html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; width: 100%;">`;
  for (let stat of stats) {
    html += `<div style="background: rgba(76,144,255,0.05); border: 1px solid rgba(76,144,255,0.2); border-radius: 10px; padding: 12px; text-align: center;">`;
    html += `<div style="font-size: 11px; color: #4c90ff; font-weight: bold; text-transform: uppercase;">${stat.label}</div>`;
    html += `<div style="font-size: 18px; color: #fff; font-family: 'Orbitron', sans-serif; margin: 4px 0;">${stat.actual}</div>`;
    html += `<div style="font-size: 10px; color: #888;">${stat.desc}</div>`;
    html += `</div>`;
  }
  html += `</div>`;

  html += `</div>`;

  container.innerHTML = html;

  // Forzar el dibujo del pentágono
  setTimeout(() => {
    drawRadarChart('radarChart', stats);
  }, 300);
}

function drawRadarChart(canvasId, stats) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const centerX = W / 2;
  const centerY = H / 2;
  const radius = W * 0.35;
  const sides = 5;
  const angle = (Math.PI * 2) / sides;

  ctx.clearRect(0, 0, W, H);

  // 1. Dibujar el fondo del pentágono (telaraña)
  ctx.strokeStyle = 'rgba(76,144,255,0.2)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    const r = (radius / 5) * i;
    ctx.beginPath();
    for (let j = 0; j < sides; j++) {
      const x = centerX + r * Math.cos(j * angle - Math.PI / 2);
      const y = centerY + r * Math.sin(j * angle - Math.PI / 2);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 2. Dibujar líneas radiales
  for (let i = 0; i < sides; i++) {
    const x = centerX + radius * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(i * angle - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // 3. Dibujar el área de estadísticas (Pentágono relleno)
  ctx.fillStyle = 'rgba(76,144,255,0.4)';
  ctx.strokeStyle = '#4c90ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  for (let i = 0; i < sides; i++) {
    const val = Math.max(0.5, stats[i].value); // Mínimo 0.5 para que no desaparezca
    const r = (radius / 10) * val;
    const x = centerX + r * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + r * Math.sin(i * angle - Math.PI / 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Dibujar los puntos en los vértices
  ctx.fillStyle = '#ff9500';
  for (let i = 0; i < sides; i++) {
    const val = Math.max(0.5, stats[i].value);
    const r = (radius / 10) * val;
    const x = centerX + r * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + r * Math.sin(i * angle - Math.PI / 2);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 5. Dibujar etiquetas de texto
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  
  for (let i = 0; i < sides; i++) {
    const labelR = radius + 35;
    const x = centerX + labelR * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + labelR * Math.sin(i * angle - Math.PI / 2);
    
    // Sombra para el texto
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#4c90ff';
    ctx.fillText(stats[i].label, x, y);
    ctx.shadowBlur = 0;
    
    // Valor numérico pequeño
    ctx.fillStyle = '#4c90ff';
    ctx.font = '12px Rajdhani, sans-serif';
    ctx.fillText(stats[i].value.toFixed(2), x, y + 18);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
  }
}
