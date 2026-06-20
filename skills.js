export function renderSkillsTree(user, userRef, saveUser) {
  const container = document.getElementById('skillsSection');
  if (!container) return;

  // Calcular estadísticas derivadas
  const algebra = Math.min(5, Math.floor((user.calcTotalSolved || 0) / 10));
  const geometry = Math.min(5, Math.floor((user.infinityProblemsSolved || 0) / 50));
  const duels = Math.min(5, Math.floor((user.duelsWon || 0) / 20));
  const speed = Math.min(5, Math.floor((user.infinityBestStreak || 0) / 50));
  const accuracy = Math.min(5, Math.floor((user.quizQuestionsAnswered || 0) / 100));

  const stats = {
    'Álgebra': algebra,
    'Geometría': geometry,
    'Duelos': duels,
    'Rapidez': speed,
    'Precisión': accuracy
  };

  let html = `<h2 style="font-family:'Orbitron',sans-serif; color:#4c90ff; text-align:center;">🌳 Pentágono de Habilidades</h2>`;
  html += `<div style="display: flex; flex-direction: column; align-items: center; background: rgba(16,24,52,0.6); padding: 20px; border-radius: 20px; border: 1px solid rgba(76,144,255,0.2);">`;
  html += `<canvas id="skillsCanvas" width="500" height="500" style="max-width: 100%; filter: drop-shadow(0 0 10px rgba(76,144,255,0.3));"></canvas>`;
  html += `<div id="skillsStats" style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; width: 100%;"></div>`;
  html += `</div>`;
  container.innerHTML = html;

  // Dibujar pentágono
  drawSkillsRadar(stats);

  // Tarjetas de estadísticas
  const statsContainer = document.getElementById('skillsStats');
  const labels = Object.keys(stats);
  const values = Object.values(stats);
  const icons = ['📐', '📏', '⚔️', '⚡', '🎯'];

  labels.forEach((label, i) => {
    const percentage = (values[i] / 5) * 100;
    statsContainer.innerHTML += `
      <div style="padding: 12px; border: 1px solid rgba(76,144,255,0.3); background: rgba(76,144,255,0.05); border-radius: 10px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">${icons[i]}</div>
        <div style="font-weight: bold; color: #4c90ff; font-size: 14px;">${label}</div>
        <div style="font-size: 18px; font-family: 'Orbitron'; color: #fff; margin: 8px 0;">${values[i]}/5</div>
        <div style="height: 6px; background: rgba(76,144,255,0.2); border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: linear-gradient(90deg, #4c90ff, #4cff90); width: ${percentage}%; transition: width 0.3s;"></div>
        </div>
      </div>
    `;
  });
}

function drawSkillsRadar(stats) {
  const canvas = document.getElementById('skillsCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;
  const labels = Object.keys(stats);
  const values = Object.values(stats);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar Telaraña Base
  ctx.strokeStyle = 'rgba(76,144,255,0.2)';
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
  ctx.strokeStyle = 'rgba(76,144,255,0.1)';
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    ctx.stroke();
  }

  // Dibujar Área de Habilidades
  ctx.beginPath();
  ctx.fillStyle = 'rgba(76,144,255,0.3)';
  ctx.strokeStyle = '#4c90ff';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (values[i] / 5) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dibujar Puntos
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (values[i] / 5) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    
    ctx.fillStyle = '#4cff90';
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
  }
}
