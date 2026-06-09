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
document.body.className = localStorage.getItem('background') || 'ciudad';
if (!currentUser) window.location.href = 'index.html';

var user = null;
var userRef = null;

async function saveUser() {
  await setDoc(userRef, user);
}

function calcLevel() {
  var lvl = 1, needed = 100, total = user.xp || 0;
  while (total >= needed && lvl < 100) {
    total -= needed;
    lvl++;
    needed += 100;
  }
  return lvl;
}

async function loadUser() {
  userRef = doc(db, 'users', currentUser);
  var snap = await getDoc(userRef);
  if (!snap.exists()) {
    window.location.href = 'index.html';
    return;
  }
  user = snap.data();
  if (!user.logros) user.logros = {};
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;

  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
  document.getElementById('displayLevel').textContent = '🏆 Nivel ' + calcLevel();

  initGame();
}

function initGame() {
  document.getElementById('backToMenu').onclick = function() {
    window.location.href = 'menu.html';
  };
  
  document.getElementById('solveBtn').onclick = function() {
    var eq = document.getElementById('eqInput').value.replace(/\s/g, '');
    var match = eq.match(/x\^2([+-]\d+)x([+-]\d+)=0/);
    
    if (!match) {
      document.getElementById('calcResult').innerHTML = '<span class="wrong">❌ Formato incorrecto. Usa: x^2-3x+2=0</span>';
      return;
    }
    
    var b = Number(match[1]), c = Number(match[2]);
    var delta = (b * b) - (4 * c);
    
    var result = `<strong>Ecuación:</strong> x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0<br>`;
    result += `<strong>Δ =</strong> ${delta}<br>`;
    
    if (delta < 0) {
      result += '<span class="wrong">❌ No tiene soluciones reales</span>';
    } else if (delta === 0) {
      var x = (-b / 2).toFixed(2);
      result += `<span class="correct">✅ Solución única: x = ${x}</span>`;
    } else {
      var x1 = ((-b + Math.sqrt(delta)) / 2).toFixed(2);
      var x2 = ((-b - Math.sqrt(delta)) / 2).toFixed(2);
      result += `<span class="correct">✅ Soluciones: x₁ = ${x1}, x₂ = ${x2}</span>`;
    }
    
    document.getElementById('calcResult').innerHTML = result;
  };
}

loadUser();
