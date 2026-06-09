import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

var isRegister = true;

function showMessage(msg, ok) {
  var el = document.getElementById('authMessage');
  el.textContent = msg;
  el.style.color = ok ? '#4cff90' : '#ff6b6b';
}

async function handleAuth() {
  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value.trim();
  if (!username || !password) {
    showMessage('⚠️ Completa usuario y contraseña');
    return;
  }

  var userRef = doc(db, 'users', username);
  var userSnap = await getDoc(userRef);

  if (isRegister) {
    if (userSnap.exists()) {
      showMessage('⚠️ Ese usuario ya existe');
      return;
    }
    var newUser = {
      password: password,
      xp: 0,
      coins: 0,
      level: 1,
      skin: 'spiderman',
      skins: ['spiderman'],
      logros: {},
      misionesCompletas: 0,
      totalMonedas: 0,
      preguntasRespondidas: 0,
      respuestasCorrectas: 0
    };
    await setDoc(userRef, newUser);
    localStorage.setItem('currentUser', username);
    showMessage('✅ ¡Cuenta creada!', true);
    setTimeout(function() {
      window.location.href = 'menu.html';
    }, 1000);
  } else {
    if (!userSnap.exists() || userSnap.data().password !== password) {
      showMessage('⚠️ Usuario o contraseña incorrectos');
      return;
    }
    localStorage.setItem('currentUser', username);
    showMessage('✅ ¡Bienvenido de vuelta!', true);
    setTimeout(function() {
      window.location.href = 'menu.html';
    }, 1000);
  }
}

function toggleAuth() {
  isRegister = !isRegister;
  document.getElementById('authTitle').textContent = isRegister ? 'Crear Cuenta' : 'Iniciar Sesión';
  document.getElementById('authBtn').textContent = isRegister ? 'Crear Cuenta' : 'Iniciar Sesión';
  document.getElementById('switchLink').textContent = isRegister ? 'Inicia aquí' : 'Crear cuenta';
  showMessage('');
}

document.getElementById('authBtn').onclick = handleAuth;
document.getElementById('switchLink').onclick = toggleAuth;
document.getElementById('password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleAuth();
});
