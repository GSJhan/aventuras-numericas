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
var quizPoints = 0;
var difficulty = 'facil';
var activePower = null;
var powerMultiplier = 1;

async function saveUser() { await setDoc(userRef, user); }

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  user = snap.data();
  if (!user.powers) user.powers = { double: 0, fifty: 0, light: 0 };
  streak = user.streak || 0;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  initGame();
}

function initGame() {
  document.getElementById('calcBtn').onclick = () => {
    document.getElementById('calculatorSection').classList.remove('hidden');
    document.getElementById('quizSection').classList.add('hidden');
  };
  document.getElementById('quizBtn').onclick = () => {
    document.getElementById('quizSection').classList.remove('hidden');
    document.getElementById('calculatorSection').classList.add('hidden');
  };
  document.getElementById('startQuizBtn').onclick = () => {
    difficulty = document.getElementById('quizDifficulty').value;
    showQuestion();
  };
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

  let html = `<div class="question-box">
    <div class="powers-row" style="margin-bottom:20px; display:flex; justify-content:center; gap:10px;">
      <button onclick="window.usePower('double')" ${user.powers.double > 0 ? '' : 'disabled'}>💰 Doble o Nada (${user.powers.double})</button>
      <button onclick="window.usePower('fifty')" ${user.powers.fifty > 0 ? '' : 'disabled'}>🌓 50/50 (${user.powers.fifty})</button>
      <button onclick="window.usePower('light')" ${user.powers.light > 0 ? '' : 'disabled'}>⚡ Luz (${user.powers.light})</button>
    </div>
    <div class="question-text">${qObj.q} = ?</div>
    <div class="options" id="quizOptions">`;
  
  opts.forEach(opt => {
    html += `<button class="op" data-val="${opt}">${opt}</button>`;
  });
  html += `</div></div>`;
  document.getElementById('quizGame').innerHTML = html;

  document.querySelectorAll('.op').forEach(btn => {
    btn.onclick = function() {
      const val = parseInt(this.dataset.val);
      if (val === correct) {
        let xpG = 10 * powerMultiplier, coinG = 2 * powerMultiplier;
        if (activePower === 'double') { xpG *= 2; coinG *= 2; activePower = null; }
        user.xp += xpG; user.coins += coinG;
        saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
        showQuestion();
      } else {
        alert('❌ Fallaste');
        showQuestion();
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
      btns.forEach(b => {
        if (parseInt(b.dataset.val) !== correct && hidden < 2) {
          b.style.visibility = 'hidden';
          hidden++;
        }
      });
    }
    if (type === 'light') {
      powerMultiplier = 1.5;
      setTimeout(() => { powerMultiplier = 1; }, 10000);
    }
    saveUser();
    showQuestion();
  };
}

loadUser();
