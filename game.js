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
var streak = 0;
var difficulty = 'facil';
var activePower = null;
var powerMultiplier = 1;

async function saveUser() { await setDoc(userRef, user); }

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  user = snap.data();
  if (!user.powers) user.powers = { double: 0, fifty: 0, light: 0 };
  updateStats();
  initGame();
}

function updateStats() {
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
}

function initGame() {
  document.getElementById('startQuizBtn').onclick = () => {
    difficulty = document.getElementById('quizDifficulty').value;
    document.getElementById('quizSetup').classList.add('hidden');
    document.getElementById('quizGame').classList.remove('hidden');
    showQuestion();
  };
}

function generateQuestion() {
  const a = Math.floor(Math.random() * 20) + 1, b = Math.floor(Math.random() * 20) + 1;
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let q = `${a} ${op} ${b}`, ans = 0;
  if (op === '+') ans = a + b;
  if (op === '-') ans = a - b;
  if (op === '*') ans = a * b;
  return { q, a: ans };
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
    <div class="powers-row animated fadeInDown">
      <button class="p-btn ${user.powers.double > 0 ? 'active' : ''}" onclick="window.usePower('double')">💰 Doble (${user.powers.double})</button>
      <button class="p-btn ${user.powers.fifty > 0 ? 'active' : ''}" onclick="window.usePower('fifty')">🌓 50/50 (${user.powers.fifty})</button>
      <button class="p-btn ${user.powers.light > 0 ? 'active' : ''}" onclick="window.usePower('light')">⚡ Luz (${user.powers.light})</button>
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
        saveUser(); updateStats();
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
    const pBtns = document.querySelectorAll('.p-btn');
    pBtns.forEach(b => { if(b.innerText.includes(type)) b.innerText = b.innerText.replace(/\(\d+\)/, `(${user.powers[type]})`); });
  };
}

loadUser();
