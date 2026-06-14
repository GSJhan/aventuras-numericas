import { collection, query, where, getDocs, setDoc, doc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function renderDuelsInterface(db, user, currentUser, userRef, saveUser) {
  const container = document.getElementById('duelsContainer');
  
  // Obtener lista de todos los usuarios para amigos
  const usersSnap = await getDocs(collection(db, 'users'));
  const allUsers = [];
  usersSnap.forEach(doc => {
    if (doc.id !== currentUser) {
      allUsers.push({ id: doc.id, data: doc.data() });
    }
  });

  let html = '<div class="duel-section">';
  html += '<h3>👥 Lista de Amigos</h3>';
  html += '<div class="friend-list" id="friendsList">';
  
  if (allUsers.length === 0) {
    html += '<p style="text-align:center; color:#888; padding:20px;">No hay otros jugadores disponibles</p>';
  } else {
    for (let friend of allUsers) {
      const friendLevel = calcLevelFrom(friend.data.xp || 0);
      html += `<div class="friend-item">`;
      html += `<div>`;
      html += `<div class="friend-name">${friend.id}</div>`;
      html += `<div class="friend-status">Nv. ${friendLevel} • ⭐${friend.data.xp || 0}</div>`;
      html += `</div>`;
      html += `<button class="challenge-btn" data-friend="${friend.id}">⚔️ Desafiar</button>`;
      html += `</div>`;
    }
  }
  
  html += '</div>';
  html += '</div>';

  // Sección de duelo activo
  html += '<div class="duel-section">';
  html += '<h3>🎮 Duelo Activo</h3>';
  html += '<div id="activeDuelContainer" style="text-align:center; color:#888; padding:20px;">Selecciona un amigo para desafiar</div>';
  html += '</div>';

  container.innerHTML = html;

  // Event listeners para desafiar
  const challengeButtons = container.querySelectorAll('.challenge-btn');
  for (let btn of challengeButtons) {
    btn.addEventListener('click', function() {
      const friendId = this.dataset.friend;
      startDuel(db, user, currentUser, friendId, userRef, saveUser);
    });
  }
}

function calcLevelFrom(xp) {
  let lvl = 1, needed = 100, total = xp || 0;
  while (total >= needed && lvl < 100) { total -= needed; lvl++; needed += 100; }
  return lvl;
}

function generateDuelProblem() {
  const types = [
    () => { const x = Math.floor(Math.random()*50)+1, y = Math.floor(Math.random()*50)+1; return { q: `${x} + ${y}`, a: x+y }; },
    () => { const x = Math.floor(Math.random()*80)+10, y = Math.floor(Math.random()*x)+1; return { q: `${x} - ${y}`, a: x-y }; },
    () => { const x = Math.floor(Math.random()*15)+2, y = Math.floor(Math.random()*12)+2; return { q: `${x} × ${y}`, a: x*y }; },
    () => { const x = Math.floor(Math.random()*6)+2; return { q: `${x}²`, a: x*x }; },
    () => { const x = Math.floor(Math.random()*6)+2, y = Math.floor(Math.random()*3)+2; return { q: `${x}^${y}`, a: Math.pow(x,y) }; },
    () => { const x = (Math.floor(Math.random()*9)+1)*10, y = (Math.floor(Math.random()*9)+1)*10; return { q: `(${x} + ${y}) ÷ 2`, a: (x+y)/2 }; }
  ];
  
  const type = types[Math.floor(Math.random()*types.length)];
  return type();
}

async function startDuel(db, user, currentUser, friendId, userRef, saveUser) {
  const duelId = `${currentUser}_vs_${friendId}_${Date.now()}`;
  const duelRef = doc(db, 'duels', duelId);
  
  const duelData = {
    player1: currentUser,
    player2: friendId,
    player1Score: 0,
    player2Score: 0,
    player1Correct: 0,
    player2Correct: 0,
    status: 'active',
    startTime: Date.now(),
    duration: 60000, // 60 segundos
    currentProblem: generateDuelProblem(),
    problemCount: 0,
    maxProblems: 5
  };

  await setDoc(duelRef, duelData);
  renderActiveDuel(db, duelId, currentUser, user, userRef, saveUser);
}

function renderActiveDuel(db, duelId, currentUser, user, userRef, saveUser) {
  const duelRef = doc(db, 'duels', duelId);
  
  const unsubscribe = onSnapshot(duelRef, (snapshot) => {
    if (!snapshot.exists()) return;
    
    const duel = snapshot.data();
    const isPlayer1 = currentUser === duel.player1;
    const opponent = isPlayer1 ? duel.player2 : duel.player1;
    const myScore = isPlayer1 ? duel.player1Score : duel.player2Score;
    const oppScore = isPlayer1 ? duel.player2Score : duel.player1Score;
    const myCorrect = isPlayer1 ? duel.player1Correct : duel.player2Correct;
    const oppCorrect = isPlayer1 ? duel.player2Correct : duel.player1Correct;
    
    const timeRemaining = Math.max(0, Math.ceil((duel.duration - (Date.now() - duel.startTime)) / 1000));
    
    if (duel.status === 'finished') {
      showDuelResult(db, duel, currentUser, user, userRef, saveUser, unsubscribe);
      return;
    }

    let html = '<div class="duel-active">';
    html += '<div class="duel-header">';
    html += '<div class="duel-player"><div class="duel-player-name">Tú</div><div class="duel-player-score">' + myScore + '</div></div>';
    html += '<div class="duel-vs">VS</div>';
    html += '<div class="duel-player"><div class="duel-player-name">' + opponent + '</div><div class="duel-player-score">' + oppScore + '</div></div>';
    html += '</div>';
    html += '<div class="duel-timer">⏱️ ' + timeRemaining + 's</div>';
    html += '<div class="duel-problem">';
    html += '<div class="duel-problem-text">' + duel.currentProblem.q + ' = ?</div>';
    html += '</div>';
    html += '<div class="duel-input-row">';
    html += '<input id="duelAnswer" type="number" placeholder="Tu respuesta..." />';
    html += '<button class="duel-submit" id="duelSubmitBtn">✔ Enviar</button>';
    html += '</div>';
    html += '<div id="duelResultMsg" style="text-align:center; font-size:12px; color:#aaa;">Problema ' + (duel.problemCount + 1) + ' de ' + duel.maxProblems + '</div>';
    html += '</div>';

    const container = document.getElementById('activeDuelContainer');
    container.innerHTML = html;

    document.getElementById('duelSubmitBtn').addEventListener('click', async () => {
      const answer = parseInt(document.getElementById('duelAnswer').value);
      if (isNaN(answer)) return;

      const isCorrect = answer === duel.currentProblem.a;
      const updateData = {};
      
      if (isPlayer1) {
        updateData.player1Score = duel.player1Score + (isCorrect ? 10 : 0);
        updateData.player1Correct = duel.player1Correct + (isCorrect ? 1 : 0);
      } else {
        updateData.player2Score = duel.player2Score + (isCorrect ? 10 : 0);
        updateData.player2Correct = duel.player2Correct + (isCorrect ? 1 : 0);
      }

      updateData.problemCount = duel.problemCount + 1;
      
      if (updateData.problemCount >= duel.maxProblems || timeRemaining <= 0) {
        updateData.status = 'finished';
        updateData.endTime = Date.now();
      } else {
        updateData.currentProblem = generateDuelProblem();
      }

      await updateDoc(duelRef, updateData);
      
      if (isCorrect) {
        user.coins = (user.coins || 0) + 5;
        user.xp = (user.xp || 0) + 10;
        await saveUser();
        document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
        document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';
      }
    });

    // Temporizador para finalizar duelo
    if (timeRemaining <= 0 && duel.status === 'active') {
      updateDoc(duelRef, { status: 'finished', endTime: Date.now() });
    }
  });
}

async function showDuelResult(db, duel, currentUser, user, userRef, saveUser, unsubscribe) {
  const isPlayer1 = currentUser === duel.player1;
  const winner = duel.player1Score > duel.player2Score ? duel.player1 : (duel.player2Score > duel.player1Score ? duel.player2 : 'Empate');
  const isWinner = winner === currentUser;

  let html = '<div class="duel-end-modal">';
  html += '<h2>' + (isWinner ? '🎉 ¡GANASTE!' : (winner === 'Empate' ? '🤝 EMPATE' : '😢 Perdiste')) + '</h2>';
  html += '<div class="winner">' + (winner === 'Empate' ? 'Ambos jugadores empataron' : 'Ganador: ' + winner) + '</div>';
  html += '<div class="stats">';
  html += '<div class="stat-item"><div class="stat-label">Tu Puntuación</div><div class="stat-value">' + (isPlayer1 ? duel.player1Score : duel.player2Score) + '</div></div>';
  html += '<div class="stat-item"><div class="stat-label">Respuestas Correctas</div><div class="stat-value">' + (isPlayer1 ? duel.player1Correct : duel.player2Correct) + '/' + duel.maxProblems + '</div></div>';
  html += '<div class="stat-item"><div class="stat-label">Puntuación Rival</div><div class="stat-value">' + (isPlayer1 ? duel.player2Score : duel.player1Score) + '</div></div>';
  html += '<div class="stat-item"><div class="stat-label">Respuestas Correctas Rival</div><div class="stat-value">' + (isPlayer1 ? duel.player2Correct : duel.player1Correct) + '/' + duel.maxProblems + '</div></div>';
  html += '</div>';
  
  if (isWinner) {
    user.coins = (user.coins || 0) + 50;
    user.xp = (user.xp || 0) + 50;
  } else if (winner !== 'Empate') {
    user.coins = (user.coins || 0) + 10;
    user.xp = (user.xp || 0) + 20;
  } else {
    user.coins = (user.coins || 0) + 25;
    user.xp = (user.xp || 0) + 25;
  }
  
  await saveUser();
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins + ' monedas';
  document.getElementById('displayXP').textContent = '⭐ ' + user.xp + ' XP';

  html += '<button class="btn-primary" onclick="location.reload()">Volver al Menú</button>';
  html += '</div>';

  document.getElementById('activeDuelContainer').innerHTML = html;
  unsubscribe();
}
