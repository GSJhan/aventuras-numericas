export function renderSkillsTree(user, userRef, saveUser) {
  const container = document.getElementById('skillsSection');
  container.innerHTML = `
    <h2 style="font-family:'Orbitron',sans-serif; color:#4c90ff; text-align:center;">🌳 Pentágono de Habilidades</h2>
    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(16,24,52,0.6); padding: 20px; border-radius: 20px; border: 1px solid rgba(76,144,255,0.2);">
      <canvas id="skillsCanvas" width="500" height="500" style="max-width: 100%; filter: drop-shadow(0 0 10px rgba(255, 204, 128, 0.2));"></canvas>
      <div id="skillsStats" style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; width: 100%;"></div>
    </div>
  `;

  function getLevel(xp) {
    let lvl = 1, needed = 100, total = xp || 0;
    while (total >= needed) { total -= needed; lvl++; needed += 100; }
    return lvl;
  }

  const level = getLevel(user.xp);
  const stats = {
    'Álgebra': Math.min(10, (user.xp / 10000) * 10),
    'Geometría': Math.min(10, (level / 1000) * 10),
    'Duelos': Math.min(10, (user.duelsWon || 0) / 10),
    'Rapidez': Math.min(10, (user.infinityBestStreak || 0) / 20),
    'Precisión': Math.min(10, (user.xp / (user.coins || 1)) * 2)
  };

  const labels = Object.keys(stats);
  const values = Object.values(stats);
  const canvas = document.getElementById('skillsCanvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar Telaraña Base (Líneas de fondo)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let j = 1; j <= 5; j++) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const r = (radius / 5) * j;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Dibujar Ejes
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    ctx.stroke();
  }

  // Dibujar Área de Habilidades (Naranja Suave Transparente)
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 204, 128, 0.4)'; // #FFCC80 con transparencia
  ctx.strokeStyle = '#FFCC80';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (values[i] / 10) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dibujar Puntos en los Vértices
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (values[i] / 10) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Dibujar Etiquetas
  ctx.fillStyle = '#e8eaff';
  ctx.font = 'bold 16px Rajdhani';
  ctx.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius + 45);
    const y = centerY + Math.sin(angle) * (radius + 45);
    ctx.fillText(labels[i], x, y);
    ctx.fillStyle = '#FFCC80';
    ctx.fillText(values[i].toFixed(2), x, y + 20);
    ctx.fillStyle = '#e8eaff';
  }

  // Tarjetas de estadísticas
  const statsContainer = document.getElementById('skillsStats');
  labels.forEach((label, i) => {
    statsContainer.innerHTML += `
      <div class="clash-item animated fadeIn" style="padding: 12px; border: 1px solid rgba(255, 204, 128, 0.3); background: rgba(255, 204, 128, 0.05);">
        <div style="font-weight: bold; color: #FFCC80; font-size: 14px;">${label}</div>
        <div style="font-size: 18px; font-family: 'Orbitron';">${values[i].toFixed(2)}</div>
      </div>
    `;
  });
}
