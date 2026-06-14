import { collection, query, getDocs, setDoc, doc, getDoc, onSnapshot, updateDoc, deleteDoc, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function renderDuelsInterface(db, user, currentUser, userRef, saveUser) {
  const container = document.getElementById('duelsContainer');
  const invitationsQuery = query(collection(db, 'duels'), where('player2', '==', currentUser), where('status', '==', 'pending'));
  
  onSnapshot(invitationsQuery, (snapshot) => {
    const invitations = [];
    snapshot.forEach(doc => invitations.push({ id: doc.id, ...doc.data() }));
    renderMain(db, user, currentUser, userRef, saveUser, invitations);
  });
}

async function renderMain(db, user, currentUser, userRef, saveUser, invitations) {
  const container = document.getElementById('duelsContainer');
  const usersSnap = await getDocs(collection(db, 'users'));
  const allUsers = [];
  usersSnap.forEach(doc => { if (doc.id !== currentUser) allUsers.push({ id: doc.id, ...doc.data() }); });

  let html = `<div class="duel-clash-ui">`;
  
  if (invitations.length > 0) {
    html += `<div class="duel-invites-alert">`;
    invitations.forEach(inv => {
      html += `<div class="invite-card animated pulse">
        <span>⚔️ <b>${inv.player1}</b> te reta por 💰${inv.bet}!</span>
        <div class="invite-btns">
          <button class="accept-btn" onclick="window.acceptDuel('${inv.id}', ${inv.bet})">ACEPTAR</button>
          <button class="decline-btn" onclick="window.declineDuel('${inv.id}')">RECHAZAR</button>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="clash-friend-list">
    <h3>👑 Arena de Apuestas (Mínimo 10 💰)</h3>
    <div style="margin-bottom:15px; text-align:center;">
      <input type="number" id="betAmount" placeholder="Cantidad a apostar..." min="10" style="width:200px; display:inline-block; margin-right:10px;">
    </div>
    <div class="clash-grid">`;
  
  allUsers.forEach(friend => {
    html += `<div class="clash-item">
      <div class="clash-avatar">👤</div>
      <div class="clash-info">
        <div class="clash-name">${friend.id}</div>
        <div class="clash-xp">⭐ ${friend.xp || 0}</div>
      </div>
      <button class="clash-challenge-btn" onclick="window.sendChallenge('${friend.id}')">RETAR</button>
    </div>`;
  });
  
  html += `</div></div></div><div id="duelPlayArea"></div>`;
  container.innerHTML = html;

  window.sendChallenge = async (friendId) => {
    const bet = parseInt(document.getElementById('betAmount').value);
    if (isNaN(bet) || bet < 10) { alert('❌ Apuesta mínima: 10 monedas'); return; }
    if (user.coins < bet) { alert('❌ No tienes suficientes monedas'); return; }

    const duelId = `duel_${currentUser}_${friendId}_${Date.now()}`;
    await setDoc(doc(db, 'duels', duelId), {
      player1: currentUser, player2: friendId, status: 'pending', bet: bet,
      timestamp: Date.now(), player1Score: 0, player2Score: 0
    });
    alert('¡Desafío enviado por ' + bet + ' monedas!');
    listenToDuelStatus(db, duelId, currentUser, user, userRef, saveUser);
  };

  window.acceptDuel = async (duelId, bet) => {
    if (user.coins < bet) { alert('❌ No tienes suficientes monedas para aceptar la apuesta'); return; }
    await updateDoc(doc(db, 'duels', duelId), { 
      status: 'active', startTime: Date.now(), duration: 60, currentProblem: generateDuelProblem()
    });
    startDuelGame(db, duelId, currentUser, user, userRef, saveUser);
  };

  window.declineDuel = async (duelId) => { await deleteDoc(doc(db, 'duels', duelId)); };
}

function listenToDuelStatus(db, duelId, currentUser, user, userRef, saveUser) {
  onSnapshot(doc(db, 'duels', duelId), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    if (data.status === 'active') startDuelGame(db, duelId, currentUser, user, userRef, saveUser);
  });
}

function generateDuelProblem() {
  const a = Math.floor(Math.random() * 20) + 1, b = Math.floor(Math.random() * 20) + 1;
  return { q: `${a} + ${b}`, a: a + b };
}

function startDuelGame(db, duelId, currentUser, user, userRef, saveUser) {
  const container = document.getElementById('duelPlayArea');
  const duelRef = doc(db, 'duels', duelId);
  
  onSnapshot(duelRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const duel = snapshot.data();
    const isP1 = currentUser === duel.player1;
    const myScore = isP1 ? duel.player1Score : duel.player2Score;
    const oppScore = isP1 ? duel.player2Score : duel.player1Score;
    const timeLeft = Math.max(0, 60 - Math.floor((Date.now() - duel.startTime) / 1000));

    if (duel.status === 'finished') {
      showResults(duel, currentUser, user, saveUser);
      return;
    }

    container.innerHTML = `
      <div class="duel-arena animated fadeIn">
        <div class="clash-header">
          <div class="p-info">TÚ<br>🏆 ${myScore}</div>
          <div class="clash-timer-circle"><svg viewBox="0 0 36 36" class="circular-chart"><path class="circle" stroke-dasharray="${(timeLeft/60)*100}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><text x="18" y="20.35" class="percentage">${timeLeft}</text></svg></div>
          <div class="p-info">RIVAL<br>🏆 ${oppScore}</div>
        </div>
        <div class="clash-problem-card">
          <div class="q-text">${duel.currentProblem.q} = ?</div>
          <input type="number" id="duelAnsInput" autofocus>
          <button id="duelSubmit" class="clash-btn-confirm">ENVIAR</button>
        </div>
      </div>`;

    document.getElementById('duelSubmit').onclick = async () => {
      const val = parseInt(document.getElementById('duelAnsInput').value);
      if (val === duel.currentProblem.a) {
        const update = isP1 ? { player1Score: duel.player1Score + 1 } : { player2Score: duel.player2Score + 1 };
        update.currentProblem = generateDuelProblem();
        await updateDoc(duelRef, update);
      }
    };

    if (timeLeft <= 0 && duel.status === 'active') updateDoc(duelRef, { status: 'finished' });
  });
}

async function showResults(duel, currentUser, user, saveUser) {
  const isP1 = currentUser === duel.player1;
  const myScore = isP1 ? duel.player1Score : duel.player2Score;
  const oppScore = isP1 ? duel.player2Score : duel.player1Score;
  const win = myScore > oppScore, draw = myScore === oppScore;

  if (win) { user.coins += duel.bet; user.xp += 100; }
  else if (!draw) { user.coins -= duel.bet; }
  await saveUser();

  document.getElementById('duelPlayArea').innerHTML = `
    <div class="clash-result-modal animated bounceIn">
      <h2>${win ? '🔥 VICTORIA' : (draw ? '🤝 EMPATE' : '💀 DERROTA')}</h2>
      <p>Ganaste/Perdiste: 💰${duel.bet}</p>
      <button class="clash-btn-confirm" onclick="location.reload()">VOLVER</button>
    </div>`;
}
