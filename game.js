import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { solveEquation, formatSolution } from './equation-solver.js';

const firebaseConfig = {
  apiKey: "AIzaSy83l2S3KIA2LR4MwbUMVgzdTVJxE6l67M",
  authDomain: "aventuras-numericas.firebaseapp.com",
  projectId: "aventuras-numericas",
  storageBucket: "aventuras-numericas.firebasestorage.app",
  messagingSenderId: "460325123048",
  appId: "1:460325123048:web:84c41597efbd2976b0e76d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

var currentUser = localStorage.getItem('currentUser');
if (!currentUser) window.location.href = 'index.html';

var user = null;
var userRef = null;
var activePower = null;
var powerMultiplier = 1;
var chart = null;

async function saveUser() { await setDoc(userRef, user); }

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  user = snap.data();
  
  // Asegurar que los campos necesarios existan
  if (!user.powers) user.powers = { double: 0, fifty: 0, light: 0 };
  if (!user.coins) user.coins = 0;
  if (!user.xp) user.xp = 0;
  
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  initGame();
}

function initGame() {
  document.getElementById('calcBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('calculatorSection').classList.remove('hidden');
  };
  document.getElementById('quizBtn').onclick = () => {
    document.getElementById('gameChoice').classList.add('hidden');
    document.getElementById('quizSection').classList.remove('hidden');
  };
  
  // Manejar selección de dificultad
  document.querySelectorAll('.difficulty-card').forEach(card => {
    card.onclick = function() {
      document.querySelectorAll('.difficulty-card').forEach(c => c.style.opacity = '0.6');
      this.style.opacity = '1';
      document.getElementById('quizDifficulty').value = this.dataset.difficulty;
    };
  });
  
  document.getElementById('startQuizBtn').onclick = () => {
    document.getElementById('quizSetup').classList.add('hidden');
    document.getElementById('quizGame').classList.remove('hidden');
    showQuestion();
  };
  document.getElementById('solveBtn').onclick = solveEquationHandler;
}

function solveEquationHandler() {
  const input = document.getElementById('eqInput').value;
  const resultDiv = document.getElementById('calcResult');
  if (!input.trim()) {
    resultDiv.innerHTML = '<p style="color:#ff4d6d;">⚠️ Por favor ingresa una ecuación</p>';
    return;
  }
  
  const result = solveEquation(input);
  const formattedResult = formatSolution(result);
  
  resultDiv.innerHTML = `
    <div style="margin-bottom: 20px;">
      <p style="font-size:16px; color:#4cff90; margin: 0 0 15px 0;">✅ Ecuación ingresada: <b>${input}</b></p>
      ${formattedResult}
    </div>
  `;
  
  // Contar ecuaciones resueltas
  if (!user.calcTotalSolved) user.calcTotalSolved = 0;
  user.calcTotalSolved++;
  
  // Clasificar por tipo
  if (input.includes('^2') || input.includes('x2')) {
    if (!user.calcQuadraticSolved) user.calcQuadraticSolved = 0;
    user.calcQuadraticSolved++;
  } else if (input.includes('x') && !input.includes('^')) {
    if (!user.calcLinearSolved) user.calcLinearSolved = 0;
    user.calcLinearSolved++;
  } else {
    if (!user.calcComplexSolved) user.calcComplexSolved = 0;
    user.calcComplexSolved++;
  }
  
  // Guardar cambios
  saveUser();
  
  drawChart();
}

function drawChart() {
  const ctx = document.getElementById('calcChart').getContext('2d');
  if (chart) chart.destroy();
  
  // Generar más puntos para una curva más suave
  const labels = [];
  const data = [];
  for (let x = -10; x <= 10; x += 0.25) {
    labels.push(x.toFixed(2));
    data.push(x * x - 3 * x + 2); // f(x) = x^2 - 3x + 2
  }
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'f(x) = x² - 3x + 2',
        data: data,
        borderColor: '#4c90ff',
        backgroundColor: 'rgba(76,144,255,0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 7,
        pointBackgroundColor: '#4cff90',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffd700',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        segment: {
          borderColor: '#4c90ff'
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#e8eaff',
            font: { size: 14, family: "'Orbitron', sans-serif", weight: 'bold' },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(8,12,26,0.95)',
          titleColor: '#4cff90',
          bodyColor: '#fff',
          borderColor: '#4c90ff',
          borderWidth: 2,
          padding: 12,
          titleFont: { size: 14, weight: 'bold', family: "'Orbitron', sans-serif" },
          bodyFont: { size: 13, family: "'Rajdhani', sans-serif" },
          displayColors: false,
          callbacks: {
            title: function(context) {
              return 'x = ' + context[0].label;
            },
            label: function(context) {
              return 'f(x) = ' + context.parsed.y.toFixed(3);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(76,144,255,0.1)',
            lineWidth: 1,
            drawBorder: true,
            drawTicks: true
          },
          ticks: {
            color: '#a78bfa',
            font: { size: 12, family: "'Rajdhani', sans-serif" },
            padding: 10,
            stepSize: 5
          },
          title: {
            display: true,
            text: 'f(x)',
            color: '#4c90ff',
            font: { size: 14, weight: 'bold', family: "'Orbitron', sans-serif" }
          }
        },
        x: {
          grid: {
            color: 'rgba(76,144,255,0.1)',
            lineWidth: 1,
            drawBorder: true,
            drawTicks: true
          },
          ticks: {
            color: '#a78bfa',
            font: { size: 12, family: "'Rajdhani', sans-serif" },
            maxTicksLimit: 15
          },
          title: {
            display: true,
            text: 'x',
            color: '#4c90ff',
            font: { size: 14, weight: 'bold', family: "'Orbitron', sans-serif" }
          }
        }
      }
    }
  });
}

function generateQuestion() {
  const difficulty = document.getElementById('quizDifficulty')?.value || 'facil';
  let a, b, question, answer;
  
  switch(difficulty) {
    case 'facil':
      // Suma y Resta
      const op1 = Math.random() > 0.5 ? '+' : '-';
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      if (op1 === '+') {
        question = `${a} + ${b}`;
        answer = a + b;
      } else {
        question = `${a + b} - ${b}`;
        answer = a;
      }
      break;
      
    case 'normal':
      // Multiplicación y División
      const op2 = Math.random() > 0.5 ? '×' : '÷';
      a = Math.floor(Math.random() * 15) + 2;
      b = Math.floor(Math.random() * 15) + 2;
      if (op2 === '×') {
        question = `${a} × ${b}`;
        answer = a * b;
      } else {
        question = `${a * b} ÷ ${b}`;
        answer = a;
      }
      break;
      
    case 'dificil':
      // Potencia y Raíz
      const op3 = Math.random() > 0.5 ? '^' : '√';
      if (op3 === '^') {
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * 3) + 2;
        question = `${a}^${b}`;
        answer = Math.pow(a, b);
      } else {
        // Raíz cuadrada perfecta
        a = Math.floor(Math.random() * 10) + 2;
        question = `√${a * a}`;
        answer = a;
      }
      break;
      
    case 'extremo':
      // Ecuaciones Cuadráticas simples
      // Generar ecuación de forma (x-p)(x-q) = 0
      const p = Math.floor(Math.random() * 10) + 1;
      const q = Math.floor(Math.random() * 10) + 1;
      const b_coef = -(p + q);
      const c_coef = p * q;
      question = `x² + ${b_coef}x + ${c_coef} = 0 (suma de raíces)`;
      answer = p + q;
      break;
      
    default:
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      question = `${a} + ${b}`;
      answer = a + b;
  }
  
  return { q: question, a: answer };
}

function showQuestion() {
  const qObj = generateQuestion();
  const correct = qObj.a;
  let opts = [correct];
  while(opts.length < 4) {
    let v = correct + Math.floor(Math.random() * 10) - 5;
    if(v >= 0 && !opts.includes(v)) opts.push(v);
  }
  opts.sort(() => Math.random() - 0.5);

  const difficulty = document.getElementById('quizDifficulty')?.value || 'facil';
  const difficultyEmoji = {
    'facil': '😊',
    'normal': '😐',
    'dificil': '😤',
    'extremo': '🔥'
  };
  const difficultyLabel = {
    'facil': 'FÁCIL',
    'normal': 'NORMAL',
    'dificil': 'DIFÍCIL',
    'extremo': 'EXPERTO'
  };

  let html = `
    <div style="text-align: center; margin-bottom: 15px; font-family: 'Orbitron'; font-size: 14px; color: #4cff90; text-transform: uppercase; letter-spacing: 2px;">Nivel: ${difficultyEmoji[difficulty]} ${difficultyLabel[difficulty]}</div>
    <div class="powers-row" style="margin-bottom:20px; display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
      <button class="p-btn" onclick="window.usePower('double')">💰 Doble (${user.powers.double || 0})</button>
      <button class="p-btn" onclick="window.usePower('fifty')">🌓 50/50 (${user.powers.fifty || 0})</button>
      <button class="p-btn" onclick="window.usePower('light')">⚡ Luz (${user.powers.light || 0})</button>
    </div>
    <div class="question-box animated zoomIn">
      <div class="question-text">${qObj.q} = ?</div>
      <div class="options">`;
  
  opts.forEach(opt => {
    html += `<button class="op animated fadeIn" data-val="${opt}">${opt}</button>`;
  });
  html += `</div></div><div id="quizFeedback" style="height:30px; margin-top:15px; text-align:center; font-weight:bold;"></div>`;
  document.getElementById('quizGame').innerHTML = html;

  document.querySelectorAll('.op').forEach(btn => {
    btn.onclick = async function() {
      const val = parseInt(this.dataset.val);
      const feedback = document.getElementById('quizFeedback');
      if (val === correct) {
        let xpG = 10 * powerMultiplier, coinG = 2 * powerMultiplier;
        if (activePower === 'double') { xpG *= 2; coinG *= 2; activePower = null; }
        user.xp += xpG; user.coins += coinG;
        
        // Registrar que se completó un quiz
        if (!user.quizCompleted) user.quizCompleted = 0;
        user.quizCompleted++;
        
        // Contar preguntas respondidas
        if (!user.quizQuestionsAnswered) user.quizQuestionsAnswered = 0;
        user.quizQuestionsAnswered++;
        
        // Contar por dificultad
        const difficulty = document.getElementById('quizDifficulty')?.value || 'facil';
        if (difficulty === 'facil') {
          if (!user.quizEasyCompleted) user.quizEasyCompleted = 0;
          user.quizEasyCompleted++;
        } else if (difficulty === 'normal') {
          if (!user.quizNormalCompleted) user.quizNormalCompleted = 0;
          user.quizNormalCompleted++;
        } else if (difficulty === 'dificil') {
          if (!user.quizHardCompleted) user.quizHardCompleted = 0;
          user.quizHardCompleted++;
        } else if (difficulty === 'extremo') {
          if (!user.quizExpertCompleted) user.quizExpertCompleted = 0;
          user.quizExpertCompleted++;
        }
        
        // Desbloquear logro de Primer Quiz
        if (!user.logros) user.logros = {};
        if (user.quizCompleted === 1 && user.logros['first_quiz'] !== true) {
          user.logros['first_quiz'] = true;
          showQuizAchievementNotification('first_quiz');
        }
        
        feedback.innerHTML = `<span class="correct animated bounceIn">✅ +${xpG}⭐ +${coinG}💰</span>`;
        await saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
        setTimeout(showQuestion, 1200);
      } else {
        feedback.innerHTML = `<span class="wrong animated shake">❌ Fallaste</span>`;
        setTimeout(showQuestion, 1500);
      }
    };
  });

  function showQuizAchievementNotification(achievementId) {
    const achievementNames = {
      'first_quiz': '🎯 Primer Quiz'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ffd700, #ff9500);
      color: #000;
      padding: 20px 30px;
      border-radius: 12px;
      font-weight: bold;
      font-family: 'Orbitron', sans-serif;
      box-shadow: 0 10px 30px rgba(255,215,0,0.5);
      z-index: 9999;
      animation: slideIn 0.5s ease;
    `;
    notification.innerHTML = `🏆 ¡LOGRO DESBLOQUEADO!<br>${achievementNames[achievementId] || achievementId}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.5s ease';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  window.usePower = (type) => {
    if (user.powers[type] <= 0) return;
    user.powers[type]--;
    if (type === 'double') activePower = 'double';
    if (type === 'fifty') {
      const btns = document.querySelectorAll('.op');
      let hidden = 0;
      btns.forEach(b => { if (parseInt(b.dataset.val) !== correct && hidden < 2) { b.style.visibility = 'hidden'; hidden++; } });
    }
    if (type === 'light') { powerMultiplier = 1.5; setTimeout(() => { powerMultiplier = 1; }, 10000); }
    saveUser();
    showQuestion();
  };
}

loadUser();
