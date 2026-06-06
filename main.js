var isRegister = true;

function showMessage(msg, ok) {
  var el = document.getElementById('authMessage');
  el.textContent = msg;
  el.style.color = ok ? '#4cff90' : '#ff6b6b';
}

function handleAuth() {
  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value.trim();
  if (!username || !password) { showMessage('⚠️ Completa usuario y contraseña'); return; }
  var users = JSON.parse(localStorage.getItem('users') || '{}');
  if (isRegister) {
    if (users[username]) { showMessage('⚠️ Ese usuario ya existe'); return; }
    users[username] = {
      password: password, xp: 0, coins: 0, level: 1,
      skin: 'spiderman', skins: ['spiderman'],
      logros: { mision3: false, rach5: false, nivel10: false, experto1: false, comprador: false },
      misionesCompletas: 0
    };
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', username);
    showMessage('✅ ¡Cuenta creada!', true);
    setTimeout(function() { window.location.href = 'menu.html'; }, 1000);
  } else {
    if (!users[username] || users[username].password !== password) {
      showMessage('⚠️ Usuario o contraseña incorrectos'); return;
    }
    localStorage.setItem('currentUser', username);
    showMessage('✅ ¡Bienvenido de vuelta!', true);
    setTimeout(function() { window.location.href = 'menu.html'; }, 1000);
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