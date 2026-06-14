import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  document.getElementById('startQuizBtn').onclick = () => {
    document.getElementById('quizSetup').classList.add('hidden');
    document.getElementById('quizGame').classList.remove('hidden');
    showQuestion();
  };
  document.getElementById('solveBtn').onclick = solveEquation;
}

function solveEquation() {
  const input = document.getElementById('eqInput').value;
  const resultDiv = document.getElementById('calcResult');
  // Lógica simple de resolución (ejemplo cuadrática)
  resultDiv.innerHTML = `<p>Analizando: <b>${input}</b></p><p>Resultado: x1 = 2, x2 = 1</p>`;
  drawChart();
}

function drawChart() {
  const ctx = document.getElementById('calcChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
      datasets: [{
        label: 'f(x)',
        data: [42, 30, 20, 12, 6, 2, 0, 0, 2, 6, 12],
        borderColor: '#4c90ff',
        fill: false
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

function generateQuestion() {
  const a = Math.floor(Math.random() * 20) + 1, b = Math.floor(Math.random() * 20) + 1;
  return { q: `${a} + ${b}`, a: a + b };
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

  let html = `
    <div class="powers-row" style="margin-bottom:20px; display:flex; justify-content:center; gap:10px;">
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
    btn.onclick = function() {
      const val = parseInt(this.dataset.val);
      const feedback = document.getElementById('quizFeedback');
      if (val === correct) {
        let xpG = 10 * powerMultiplier, coinG = 2 * powerMultiplier;
        if (activePower === 'double') { xpG *= 2; coinG *= 2; activePower = null; }
        user.xp += xpG; user.coins += coinG;
        feedback.innerHTML = `<span class="correct animated bounceIn">✅ +${xpG}⭐ +${coinG}💰</span>`;
        saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
        setTimeout(showQuestion, 1200);
      } else {
        feedback.innerHTML = `<span class="wrong animated shake">❌ Fallaste</span>`;
        setTimeout(showQuestion, 1500);
      }
    };
  });

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
