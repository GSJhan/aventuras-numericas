// ========== DATOS DEL USUARIO ==========
let currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
  window.location.href = 'index.html';
}

let userData = JSON.parse(localStorage.getItem('user_' + currentUser));

function saveUser() {
  localStorage.setItem('user_' + currentUser, JSON.stringify(userData));
}

function updateDisplay() {
  const level = Math.floor(userData.xp / 100) + 1;
  document.getElementById('displayUsername').textContent = userData.username;
  document.getElementById('displayCoins').textContent = userData.coins;
  document.getElementById('displayXP').textContent = userData.xp;
  document.getElementById('displayLevel').textContent = level;
  document.getElementById('avatarDisplay').textContent = getAvatarEmoji(userData.skin);
}

function getAvatarEmoji(skinId) {
  const skins = {
    'spiderman': '🕷️',
    'batman': '🦇',
    'goku': '🐉',
    'ironman': '🤖',
    'sasuke': '🍥',
    'kakashi': '📖',
    'vegeta': '💪',
    'zoro': '⚔️',
    'luffy': '🏴‍☠️'
  };
  return skins[skinId] || '🕷️';
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ========== NAVEGACIÓN ==========
function showSection(sectionId) {
  const sections = ['gameSection', 'quizSection', 'calculatorSection', 'infinitoSection', 'tiendaSection', 'rankingSection', 'logrosSection', 'configSection'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  if (sectionId) {
    document.getElementById(sectionId).classList.remove('hidden');
  }
}

// Botones del menú
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (page === 'game') showSection('gameSection');
    else if (page === 'infinito') { showSection('infinitoSection'); newInfinityProblem(); }
    else if (page === 'tienda') { showSection('tiendaSection'); loadShop(); }
    else if (page === 'ranking') { showSection('rankingSection'); loadRanking(); }
    else if (page === 'logros') { showSection('logrosSection'); loadAchievements(); }
    else if (page === 'config') showSection('configSection');
  });
});

// Botones de regreso
document.getElementById('backFromQuiz').onclick = () => showSection('gameSection');
document.getElementById('backFromCalc').onclick = () => showSection('gameSection');
document.getElementById('backFromInfinito').onclick = () => showSection('gameSection');
document.getElementById('backFromTienda').onclick = () => showSection('gameSection');
document.getElementById('backFromRanking').onclick = () => showSection('gameSection');
document.getElementById('backFromLogros').onclick = () => showSection('gameSection');
document.getElementById('backFromConfig').onclick = () => showSection('gameSection');

document.getElementById('goToQuiz').onclick = () => showSection('quizSection');
document.getElementById('goToCalculator').onclick = () => showSection('calculatorSection');

// Logout
document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
};

// Tema
document.getElementById('themeSelect').onchange = (e) => {
  document.body.className = e.target.value;
  localStorage.setItem('theme', e.target.value);
};
const savedTheme = localStorage.getItem('theme') || 'default';
document.body.className = savedTheme;
document.getElementById('themeSelect').value = savedTheme;

// ========== MODO QUIZ ==========
let currentDifficulty = 'facil';
let currentQuestion = null;

function generateQuizQuestion() {
  let text, answer;
  const type = random(0, 2);
  
  if (currentDifficulty === 'facil') {
    if (type === 0) {
      text = `${random(1, 20)} + ${random(1, 20)}`;
      answer = eval(text);
    } else if (type === 1) {
      const a = random(10, 50);
      const b = random(1, a);
      text = `${a} - ${b}`;
      answer = eval(text);
    } else {
      text = `${random(2, 10)} × ${random(2, 10)}`;
      answer = eval(text);
    }
  } else if (currentDifficulty === 'normal') {
    const n = random(2, 12);
    text = `${n}²`;
    answer = n * n;
  } else {
    const n = random(2, 8);
    text = `${n}³`;
    answer = n * n * n;
  }
  
  return { text, answer };
}

function showQuizQuestion() {
  currentQuestion = generateQuizQuestion();
  const options = [currentQuestion.answer];
  while (options.length < 4) {
    const opt = currentQuestion.answer + random(-5, 5);
    if (opt > 0 && !options.includes(opt)) options.push(opt);
  }
  options.sort(() => Math.random() - 0.5);
  
  let html = `<div class="question">${currentQuestion.text} = ?</div>`;
  html += `<div class="options">`;
  options.forEach(opt => {
    html += `<button class="option" onclick="checkQuizAnswer(${opt})">${opt}</button>`;
  });
  html += `</div>`;
  
  document.getElementById('quizArea').innerHTML = html;
  document.getElementById('quizResult').classList.add('hidden');
}

window.checkQuizAnswer = function(selected) {
  const isCorrect = selected === currentQuestion.answer;
  const resultDiv = document.getElementById('quizResult');
  const gains = { facil: { xp: 10, coins: 2 }, normal: { xp: 25, coins: 5 }, dificil: { xp: 50, coins: 10 } };
  
  if (isCorrect) {
    userData.xp += gains[currentDifficulty].xp;
    userData.coins += gains[currentDifficulty].coins;
    saveUser();
    updateDisplay();
    resultDiv.innerHTML = `✅ Correcto! +${gains[currentDifficulty].xp} XP +${gains[currentDifficulty].coins}💰`;
    resultDiv.className = 'result-box correct';
    resultDiv.classList.remove('hidden');
    setTimeout(() => {
      showQuizQuestion();
    }, 1200);
  } else {
    resultDiv.innerHTML = `❌ Incorrecto! Era: ${currentQuestion.answer}`;
    resultDiv.className = 'result-box wrong';
    resultDiv.classList.remove('hidden');
    setTimeout(() => {
      showQuizQuestion();
    }, 1500);
  }
};

document.getElementById('startQuiz').onclick = () => {
  currentDifficulty = document.getElementById('difficultySelect').value;
  showQuizQuestion();
};

// ========== CALCULADORA ==========
document.getElementById('solveBtn').onclick = () => {
  const eq = document.getElementById('equationInput').value.replace(/\s/g, '');
  const match = eq.match(/x\^2([+-]\d+)x([+-]\d+)=0/);
  
  if (!match) {
    document.getElementById('calcResult').innerHTML = '❌ Formato incorrecto. Usa: x^2-3x+2=0';
    return;
  }
  
  const b = Number(match[1]);
  const c = Number(match[2]);
  const delta = (b * b) - (4 * c);
  
  let result = `<strong>Ecuación:</strong> x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0<br>`;
  result += `<strong>Δ =</strong> ${delta}<br>`;
  
  if (delta < 0) {
    result += '❌ No tiene soluciones reales';
  } else if (delta === 0) {
    const x = (-b / 2).toFixed(2);
    result += `✅ Solución única: x = ${x}`;
  } else {
    const x1 = ((-b + Math.sqrt(delta)) / 2).toFixed(2);
    const x2 = ((-b - Math.sqrt(delta)) / 2).toFixed(2);
    result += `✅ Soluciones: x₁ = ${x1}, x₂ = ${x2}`;
  }
  
  document.getElementById('calcResult').innerHTML = result;
};

// ========== MODO INFINITO ==========
let infinityProblem = null;

function newInfinityProblem() {
  const a = random(2, 12);
  const b = random(2, 12);
  infinityProblem = { text: `${a} × ${b}`, answer: a * b };
  document.getElementById('infinityProblem').innerHTML = `<div class="problem-text">${infinityProblem.text} = ?</div>`;
  document.getElementById('infinityAnswer').value = '';
  document.getElementById('infinityResult').innerHTML = '';
  document.getElementById('infinityResult').className = 'result-box';
}

document.getElementById('checkInfinity').onclick = () => {
  const answer = Number(document.getElementById('infinityAnswer').value);
  if (answer === infinityProblem.answer) {
    userData.xp += 5;
    userData.coins += 2;
    saveUser();
    updateDisplay();
    document.getElementById('infinityResult').innerHTML = '✅ Correcto! +5 XP +2💰';
    document.getElementById('infinityResult').classList.add('correct');
    setTimeout(newInfinityProblem, 1000);
  } else {
    document.getElementById('infinityResult').innerHTML = `❌ Incorrecto! Era: ${infinityProblem.answer}`;
    document.getElementById('infinityResult').classList.add('wrong');
  }
};

// ========== TIENDA ==========
const skinsList = [
  { id: 'spiderman', name: 'Spider-Man', price: 0, emoji: '🕷️' },
  { id: 'batman', name: 'Batman', price: 80, emoji: '🦇' },
  { id: 'goku', name: 'Goku', price: 200, emoji: '🐉' },
  { id: 'ironman', name: 'Iron Man', price: 150, emoji: '🤖' },
  { id: 'sasuke', name: 'Sasuke', price: 140, emoji: '🍥' },
  { id: 'kakashi', name: 'Kakashi', price: 120, emoji: '📖' },
  { id: 'vegeta', name: 'Vegeta', price: 210, emoji: '💪' },
  { id: 'zoro', name: 'Zoro', price: 95, emoji: '⚔️' },
  { id: 'luffy', name: 'Luffy', price: 110, emoji: '🏴‍☠️' }
];

function loadShop() {
  let html = '<div class="skins-grid">';
  skinsList.forEach(skin => {
    const owned = userData.skins.includes(skin.id);
    const active = userData.skin === skin.id;
    html += `
      <div class="skin-card ${active ? 'active' : ''}" onclick="buySkin('${skin.id}', ${skin.price})">
        <div class="skin-emoji">${skin.emoji}</div>
        <div class="skin-name">${skin.name}</div>
        <div class="skin-price">${owned ? (active ? '✅ Activo' : '✓ Poseído') : `💰 ${skin.price}`}</div>
      </div>
    `;
  });
  html += '</div>';
  document.getElementById('shopItems').innerHTML = html;
}

window.buySkin = function(id, price) {
  const owned = userData.skins.includes(id);
  
  if (owned) {
    userData.skin = id;
    saveUser();
    updateDisplay();
    loadShop();
  } else if (userData.coins >= price) {
    userData.coins -= price;
    userData.skins.push(id);
    userData.skin = id;
    saveUser();
    updateDisplay();
    loadShop();
  } else {
    alert(`❌ Necesitas ${price} monedas!`);
  }
};

// ========== RANKING ==========
function loadRanking() {
  const users = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('user_')) {
      const user = JSON.parse(localStorage.getItem(key));
      users.push({
        username: user.username,
        xp: user.xp,
        level: Math.floor(user.xp / 100) + 1
      });
    }
  }
  
  users.sort((a, b) => b.xp - a.xp);
  
  let html = '<table class="ranking-table">';
  html += '<tr><th>#</th><th>Usuario</th><th>⭐ XP</th><th>🏆 Nivel</th></tr>';
  users.forEach((u, index) => {
    const isCurrent = u.username === currentUser;
    html += `<tr class="${isCurrent ? 'current-user' : ''}">
      <td>${index + 1}</td>
      <td>${u.username} ${isCurrent ? '👑' : ''}</td>
      <td>${u.xp}</td>
      <td>${u.level}</td>
    </tr>`;
  });
  html += '</table>';
  document.getElementById('rankingList').innerHTML = html;
}

// ========== LOGROS ==========
function loadAchievements() {
  const level = Math.floor(userData.xp / 100) + 1;
  const logros = [
    { icon: '🏆', name: 'Primeros pasos', desc: 'Completar 1 pregunta', achieved: userData.xp > 0 },
    { icon: '💰', name: 'Ahorrador', desc: 'Tener 500 monedas', achieved: userData.coins >= 500 },
    { icon: '⭐', name: 'Aprendiz', desc: 'Alcanzar nivel 5', achieved: level >= 5 },
    { icon: '🌟', name: 'Estudiante', desc: 'Alcanzar nivel 10', achieved: level >= 10 },
    { icon: '🎨', name: 'Coleccionista', desc: 'Tener 3 avatares', achieved: userData.skins.length >= 3 },
    { icon: '👑', name: 'Maestro', desc: 'Alcanzar nivel 20', achieved: level >= 20 }
  ];
  
  let html = '';
  logros.forEach(logro => {
    html += `
      <div class="logro-card ${logro.achieved ? 'achieved' : ''}">
        <div class="logro-icon">${logro.icon}</div>
        <div>
          <strong>${logro.name}</strong><br>
          <small>${logro.desc}</small>
        </div>
      </div>
    `;
  });
  document.getElementById('logrosList').innerHTML = html;
}

// ========== INICIALIZAR ==========
updateDisplay();
showSection('gameSection');
