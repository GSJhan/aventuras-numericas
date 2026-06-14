export function renderSkillsTree(user, userRef, saveUser) {
  const container = document.getElementById('skillsSection');
  container.innerHTML = `
    <h2>🌳 Árbol de Habilidades</h2>
    <div style="display: flex; flex-direction: column; align-items: center;">
      <canvas id="skillsCanvas" width="500" height="500" style="max-width: 100%;"></canvas>
      <div id="skillsStats" style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%;"></div>
    </div>
  `;

  // Calcular Nivel Real
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

  // Dibujar Pentágono Base
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(76, 144, 255, 0.3)';
  ctx.lineWidth = 2;
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

  // Dibujar Área de Habilidades
  ctx.beginPath();
  ctx.fillStyle = 'rgba(76, 144, 255, 0.5)';
  ctx.strokeStyle = '#4c90ff';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (values[i] / 10) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    
    // Dibujar punto naranja
    ctx.save();
    ctx.fillStyle = '#ff9500';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dibujar Etiquetas
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Orbitron';
  ctx.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius + 40);
    const y = centerY + Math.sin(angle) * (radius + 40);
    ctx.fillText(labels[i], x, y);
    ctx.font = '12px Orbitron';
    ctx.fillText(values[i].toFixed(2), x, y + 20);
    ctx.font = 'bold 16px Orbitron';
  }

  // Tarjetas de estadísticas
  const statsContainer = document.getElementById('skillsStats');
  labels.forEach((label, i) => {
    statsContainer.innerHTML += `
      <div class="clash-item" style="padding: 10px;">
        <div style="font-weight: bold; color: #4c90ff;">${label}</div>
        <div style="font-size: 20px;">${values[i].toFixed(2)} / 10.00</div>
      </div>
    `;
  });
}
