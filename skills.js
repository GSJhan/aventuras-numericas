export function renderSkillsTree(user, userRef, saveUser) {
  const container = document.getElementById('skillsTree');
  if (!user.skills) user.skills = {};
  if (!user.skillPoints) user.skillPoints = 0;
  if (!user.duelsWon) user.duelsWon = 0;
  if (!user.infinityBestStreak) user.infinityBestStreak = 0;

  // Calcular nivel
  let level = 1, needed = 100, total = user.xp || 0;
  while (total >= needed && level < 100) { total -= needed; level++; needed += 100; }

  // Datos para el gráfico radial (pentágono)
  const stats = [
    { label: 'Duelos Ganados', value: Math.min((user.duelsWon || 0) / 5, 10), actual: user.duelsWon || 0 },
    { label: 'Racha Máxima', value: Math.min((user.infinityBestStreak || 0) / 10, 10), actual: user.infinityBestStreak || 0 },
    { label: 'Nivel', value: Math.min(level / 10, 10), actual: level },
    { label: 'XP Total', value: Math.min((user.xp || 0) / 500, 10), actual: user.xp || 0 },
    { label: 'Monedas', value: Math.min((user.coins || 0) / 200, 10), actual: user.coins || 0 }
  ];

  let html = `<div style="margin-bottom: 30px;">`;
  html += `<div style="text-align:center; background: rgba(76,144,255,0.08); padding: 20px; border-radius: 12px; border: 1px solid rgba(76,144,255,0.2); margin-bottom: 20px;">`;
  html += `<div style="font-size: 14px; color: #aaa; margin-bottom: 6px;">Puntos de Habilidad Disponibles</div>`;
  html += `<div style="font-size: 28px; font-family: 'Orbitron', monospace; color: var(--gold); font-weight: 700;">${user.skillPoints || 0}</div>`;
  html += `</div>`;

  // Canvas para el gráfico radial
  html += `<canvas id="radarChart" width="400" height="400" style="max-width:100%; margin: 0 auto; display:block; background: rgba(8,12,26,0.5); border-radius: 12px; border: 1px solid rgba(76,144,255,0.2);"></canvas>`;
  html += `</div>`;

  // Tabla de estadísticas
  html += `<div style="background: rgba(8,12,26,0.75); border: 1px solid rgba(76,144,255,0.2); border-radius: 12px; padding: 20px;">`;
  html += `<h3 style="color: var(--accent); margin-bottom: 16px; font-family: 'Orbitron', monospace;">📊 Estadísticas Detalladas</h3>`;
  html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">`;
  
  for (let stat of stats) {
    html += `<div style="background: rgba(76,144,255,0.08); border: 1px solid rgba(76,144,255,0.2); border-radius: 8px; padding: 12px;">`;
    html += `<div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">${stat.label}</div>`;
    html += `<div style="font-size: 20px; font-family: 'Orbitron', monospace; color: var(--accent); font-weight: 700;">${stat.actual}</div>`;
    html += `<div style="height: 4px; background: rgba(76,144,255,0.1); border-radius: 2px; margin-top: 8px; overflow: hidden;">`;
    html += `<div style="height: 100%; width: ${Math.min(stat.value * 10, 100)}%; background: linear-gradient(90deg, #4c90ff, #9b59ff);"></div>`;
    html += `</div>`;
    html += `</div>`;
  }
  
  html += `</div></div>`;

  container.innerHTML = html;

  // Dibujar el gráfico radial
  setTimeout(() => drawRadarChart('radarChart', stats), 100);
}

function drawRadarChart(canvasId, stats) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 120;
  const sides = stats.length;
  const angle = (Math.PI * 2) / sides;

  // Limpiar canvas
  ctx.fillStyle = 'rgba(8,12,26,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibujar grid de fondo (círculos concéntricos)
  ctx.strokeStyle = 'rgba(76,144,255,0.1)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    const r = (radius / 5) * i;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dibujar líneas radiales
  ctx.strokeStyle = 'rgba(76,144,255,0.15)';
  for (let i = 0; i < sides; i++) {
    const x = centerX + radius * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(i * angle - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // Dibujar polígono de datos
  ctx.fillStyle = 'rgba(76,144,255,0.2)';
  ctx.strokeStyle = '#4c90ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < sides; i++) {
    const value = Math.min(stats[i].value, 10);
    const r = (radius / 10) * value;
    const x = centerX + r * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + r * Math.sin(i * angle - Math.PI / 2);
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dibujar puntos en los vértices
  ctx.fillStyle = '#ff9500';
  for (let i = 0; i < sides; i++) {
    const value = Math.min(stats[i].value, 10);
    const r = (radius / 10) * value;
    const x = centerX + r * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + r * Math.sin(i * angle - Math.PI / 2);
    
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dibujar etiquetas
  ctx.fillStyle = '#e8eaff';
  ctx.font = 'bold 12px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i < sides; i++) {
    const labelRadius = radius + 40;
    const x = centerX + labelRadius * Math.cos(i * angle - Math.PI / 2);
    const y = centerY + labelRadius * Math.sin(i * angle - Math.PI / 2);
    
    // Dibujar etiqueta con fondo
    const text = stats[i].label;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    
    ctx.fillStyle = 'rgba(76,144,255,0.15)';
    ctx.fillRect(x - textWidth / 2 - 6, y - 10, textWidth + 12, 20);
    
    ctx.fillStyle = '#4c90ff';
    ctx.fillText(text, x, y);
  }

  // Dibujar leyenda de valores
  ctx.fillStyle = '#a78bfa';
  ctx.font = '11px Rajdhani, sans-serif';
  ctx.textAlign = 'left';
  
  for (let i = 0; i < sides; i++) {
    const value = Math.min(stats[i].value, 10).toFixed(2);
    ctx.fillText(`${value}/10`, 20, 30 + i * 20);
  }
}
