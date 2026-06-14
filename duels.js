import { collection, query, getDocs, setDoc, doc, getDoc, onSnapshot, updateDoc, deleteDoc, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function renderDuelsInterface(db, user, currentUser, userRef, saveUser) {
  const container = document.getElementById('duelsContainer');
  
  // 1. Escuchar invitaciones entrantes (Alguien me reta)
  const invitationsQuery = query(collection(db, 'duels'), where('player2', '==', currentUser), where('status', '==', 'pending'));
  
  onSnapshot(invitationsQuery, (snapshot) => {
    const invitations = [];
    snapshot.forEach(doc => invitations.push({ id: doc.id, ...doc.data() }));
    renderMain(db, user, currentUser, userRef, saveUser, invitations);
  });
}

async function renderMain(db, user, currentUser, userRef, saveUser, invitations) {
  const container = document.getElementById('duelsContainer');
  
  // Obtener lista de usuarios
  const usersSnap = await getDocs(collection(db, 'users'));
  const allUsers = [];
  usersSnap.forEach(doc => { if (doc.id !== currentUser) allUsers.push({ id: doc.id, ...doc.data() }); });

  let html = `<div class="duel-clash-ui">`;
  
  // Invitaciones Pendientes (Estilo Notificación)
  if (invitations.length > 0) {
    html += `<div class="duel-invites-alert">`;
    for (let inv of invitations) {
      html += `<div class="invite-card animated pulse">
        <span>⚔️ <b>${inv.player1}</b> te desafía!</span>
        <div class="invite-btns">
          <button class="accept-btn" onclick="window.acceptDuel('${inv.id}')">ACEPTAR</button>
          <button class="decline-btn" onclick="window.declineDuel('${inv.id}')">RECHAZAR</button>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  // Lista de Jugadores para Retar
  html += `<div class="clash-friend-list">
    <h3>👑 Arena de Desafíos</h3>
    <div class="clash-grid">`;
  
  for (let friend of allUsers) {
    html += `<div class="clash-item">
      <div class="clash-avatar">👤</div>
      <div class="clash-info">
        <div class="clash-name">${friend.id}</div>
        <div class="clash-xp">⭐ ${friend.xp || 0}</div>
      </div>
      <button class="clash-challenge-btn" onclick="window.sendChallenge('${friend.id}')">RETAR</button>
    </div>`;
  }
  
  html += `</div></div></div>`;
  html += `<div id="duelPlayArea"></div>`;

  container.innerHTML = html;

  // Funciones Globales para los botones
  window.sendChallenge = async (friendId) => {
    const duelId = `duel_${currentUser}_${friendId}_${Date.now()}`;
    await setDoc(doc(db, 'duels', duelId), {
      player1: currentUser,
      player2: friendId,
      status: 'pending',
      timestamp: Date.now(),
      player1Score: 0,
      player2Score: 0
    });
    alert('Desafío enviado! Esperando a que acepte...');
    listenToDuelStatus(db, duelId, currentUser, user, userRef, saveUser);
  };

  window.acceptDuel = async (duelId) => {
    await updateDoc(doc(db, 'duels', duelId), { 
      status: 'active', 
      startTime: Date.now(),
      duration: 60, // 60 segundos
      currentProblem: generateDuelProblem()
    });
    startDuelGame(db, duelId, currentUser, user, userRef, saveUser);
  };

  window.declineDuel = async (duelId) => {
    await deleteDoc(doc(db, 'duels', duelId));
  };
}

function listenToDuelStatus(db, duelId, currentUser, user, userRef, saveUser) {
  onSnapshot(doc(db, 'duels', duelId), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    if (data.status === 'active') {
      startDuelGame(db, duelId, currentUser, user, userRef, saveUser);
    }
  });
}

function generateDuelProblem() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let q = `${a} ${op} ${b}`, ans = 0;
  if (op === '+') ans = a + b;
  if (op === '-') ans = a - b;
  if (op === '*') ans = a * b;
  return { q, a: ans };
}

function startDuelGame(db, duelId, currentUser, user, userRef, saveUser) {
  const container = document.getElementById('duelPlayArea');
  const duelRef = doc(db, 'duels', duelId);
  
  let timerInterval;
  
  const unsubscribe = onSnapshot(duelRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const duel = snapshot.data();
    const isP1 = currentUser === duel.player1;
    const myScore = isP1 ? duel.player1Score : duel.player2Score;
    const oppScore = isP1 ? duel.player2Score : duel.player1Score;
    const opponent = isP1 ? duel.player2 : duel.player1;

    if (duel.status === 'finished') {
      clearInterval(timerInterval);
      showResults(duel, currentUser, user, saveUser, unsubscribe);
      return;
    }

    const elapsed = Math.floor((Date.now() - duel.startTime) / 1000);
    const timeLeft = Math.max(0, 60 - elapsed);

    container.innerHTML = `
      <div class="duel-arena animated fadeIn">
        <div class="clash-header">
          <div class="p-info"><b>TÚ</b><br>🏆 ${myScore}</div>
          <div class="clash-timer-circle">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="circle" stroke-dasharray="${(timeLeft/60)*100}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" class="percentage">${timeLeft}</text>
            </svg>
          </div>
          <div class="p-info"><b>${opponent}</b><br>🏆 ${oppScore}</div>
        </div>
        <div class="clash-problem-card">
          <div class="q-text">${duel.currentProblem.q} = ?</div>
          <input type="number" id="duelAnsInput" autofocus placeholder="Respuesta...">
          <button id="duelSubmit" class="clash-btn-confirm">ENVIAR</button>
        </div>
      </div>
    `;

    document.getElementById('duelSubmit').onclick = async () => {
      const input = document.getElementById('duelAnsInput');
      const val = parseInt(input.value);
      if (val === duel.currentProblem.a) {
        const update = isP1 ? { player1Score: duel.player1Score + 1 } : { player2Score: duel.player2Score + 1 };
        update.currentProblem = generateDuelProblem();
        await updateDoc(duelRef, update);
      } else {
        input.value = '';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
      }
    };

    if (timeLeft <= 0 && duel.status === 'active') {
      updateDoc(duelRef, { status: 'finished' });
    }
  });

  timerInterval = setInterval(() => {
    // Forzar re-render para el timer cada segundo
    duelRef.get(); 
  }, 1000);
}

function showResults(duel, currentUser, user, saveUser, unsubscribe) {
  unsubscribe();
  const isP1 = currentUser === duel.player1;
  const myScore = isP1 ? duel.player1Score : duel.player2Score;
  const oppScore = isP1 ? duel.player2Score : duel.player1Score;
  const win = myScore > oppScore;
  const draw = myScore === oppScore;

  if (win) { user.duelsWon = (user.duelsWon || 0) + 1; user.coins += 50; user.xp += 100; }
  else if (draw) { user.coins += 20; user.xp += 50; }
  saveUser();

  const container = document.getElementById('duelPlayArea');
  container.innerHTML = `
    <div class="clash-result-modal animated bounceIn">
      <h2>${win ? '🔥 ¡VICTORIA!' : (draw ? '🤝 EMPATE' : '💀 DERROTA')}</h2>
      <div class="res-scores">
        <div>Tú: ${myScore}</div>
        <div>Rival: ${oppScore}</div>
      </div>
      <button class="clash-btn-confirm" onclick="location.reload()">VOLVER</button>
    </div>
  `;
}
