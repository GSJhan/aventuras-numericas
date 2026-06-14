// Definición del árbol de habilidades
const skillsTree = {
  algebra: [
    { id: 'algebra1', name: 'Ecuaciones Lineales', desc: 'Resuelve ecuaciones de primer grado', points: 5, level: 1, bonus: 'XP +10%' },
    { id: 'algebra2', name: 'Sistemas de Ecuaciones', desc: 'Domina sistemas 2x2 y 3x3', points: 5, level: 2, bonus: 'Monedas +15%' },
    { id: 'algebra3', name: 'Polinomios Avanzados', desc: 'Factorización y operaciones complejas', points: 5, level: 3, bonus: 'XP +20%' },
    { id: 'algebra4', name: 'Álgebra Abstracta', desc: 'Estructuras algebraicas y grupos', points: 5, level: 4, bonus: 'Monedas +25%' },
    { id: 'algebra5', name: 'Álgebra Avanzada', desc: 'Matrices y transformaciones lineales', points: 5, level: 5, bonus: 'XP +30%' }
  ],
  geometry: [
    { id: 'geom1', name: 'Geometría Básica', desc: 'Ángulos, triángulos y polígonos', points: 5, level: 1, bonus: 'XP +10%' },
    { id: 'geom2', name: 'Trigonometría', desc: 'Seno, coseno, tangente y aplicaciones', points: 5, level: 2, bonus: 'Monedas +15%' },
    { id: 'geom3', name: 'Geometría del Espacio', desc: 'Volúmenes y superficies 3D', points: 5, level: 3, bonus: 'XP +20%' },
    { id: 'geom4', name: 'Geometría Proyectiva', desc: 'Perspectiva y transformaciones', points: 5, level: 4, bonus: 'Monedas +25%' },
    { id: 'geom5', name: 'Geometría Analítica', desc: 'Coordenadas, rectas y cónicas', points: 5, level: 5, bonus: 'XP +30%' }
  ]
};

export function renderSkillsTree(user, userRef, saveUser) {
  const container = document.getElementById('skillsTree');
  if (!user.skills) user.skills = {};
  if (!user.skillPoints) user.skillPoints = 0;

  let html = `<div style="margin-bottom: 20px; text-align: center; background: rgba(76,144,255,0.08); padding: 16px; border-radius: 12px; border: 1px solid rgba(76,144,255,0.2);">
    <div style="font-size: 14px; color: #aaa; margin-bottom: 6px;">Puntos de Habilidad Disponibles</div>
    <div style="font-size: 28px; font-family: 'Orbitron', monospace; color: var(--gold); font-weight: 700;">${user.skillPoints || 0}</div>
  </div>`;

  // Rama de Álgebra
  html += '<div class="skill-branch">';
  html += '<h3>📐 Álgebra</h3>';
  for (let skill of skillsTree.algebra) {
    const unlocked = user.skills[skill.id] || false;
    const classes = `skill-node ${unlocked ? 'unlocked' : ''}`;
    html += `<div class="${classes}" data-skill="${skill.id}" data-points="${skill.points}">`;
    html += `<div class="skill-node-title">${skill.name}</div>`;
    html += `<div class="skill-node-points">⭐ ${skill.points} puntos</div>`;
    html += `<div class="skill-node-desc">${skill.desc}</div>`;
    html += `<div class="skill-node-unlock">${unlocked ? '✅ Desbloqueado' : `🔒 Requiere ${skill.points} puntos`}</div>`;
    html += `<div style="margin-top: 8px; font-size: 11px; color: #a78bfa;">Bonificación: ${skill.bonus}</div>`;
    html += '</div>';
  }
  html += '</div>';

  // Rama de Geometría
  html += '<div class="skill-branch">';
  html += '<h3>📏 Geometría</h3>';
  for (let skill of skillsTree.geometry) {
    const unlocked = user.skills[skill.id] || false;
    const classes = `skill-node ${unlocked ? 'unlocked' : ''}`;
    html += `<div class="${classes}" data-skill="${skill.id}" data-points="${skill.points}">`;
    html += `<div class="skill-node-title">${skill.name}</div>`;
    html += `<div class="skill-node-points">⭐ ${skill.points} puntos</div>`;
    html += `<div class="skill-node-desc">${skill.desc}</div>`;
    html += `<div class="skill-node-unlock">${unlocked ? '✅ Desbloqueado' : `🔒 Requiere ${skill.points} puntos`}</div>`;
    html += `<div style="margin-top: 8px; font-size: 11px; color: #a78bfa;">Bonificación: ${skill.bonus}</div>`;
    html += '</div>';
  }
  html += '</div>';

  container.innerHTML = html;

  // Event listeners para desbloquear habilidades
  const nodes = container.querySelectorAll('.skill-node:not(.unlocked)');
  for (let node of nodes) {
    node.addEventListener('click', async function() {
      const skillId = this.dataset.skill;
      const points = parseInt(this.dataset.points);
      
      if ((user.skillPoints || 0) >= points) {
        user.skillPoints = (user.skillPoints || 0) - points;
        if (!user.skills) user.skills = {};
        user.skills[skillId] = true;
        
        // Bonificación de XP/monedas según la habilidad
        const skill = [...skillsTree.algebra, ...skillsTree.geometry].find(s => s.id === skillId);
        if (skill) {
          if (skill.bonus.includes('XP')) user.xp = (user.xp || 0) + 50;
          if (skill.bonus.includes('Monedas')) user.coins = (user.coins || 0) + 25;
        }
        
        await saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
        renderSkillsTree(user, userRef, saveUser);
      } else {
        alert('❌ Necesitas ' + points + ' puntos de habilidad (tienes ' + (user.skillPoints || 0) + ')');
      }
    });
  }
}

export function awardSkillPoints(user, amount = 1) {
  user.skillPoints = (user.skillPoints || 0) + amount;
}
