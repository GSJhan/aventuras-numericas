// Sistema de Invitaciones a Duelos
export class DuelInvitation {
  constructor(invitedUsername, invitedUserId) {
    this.invitedUsername = invitedUsername;
    this.invitedUserId = invitedUserId;
    this.timeRemaining = 60; // 60 segundos
    this.isMinimized = false;
    this.intervalId = null;
    this.init();
  }

  init() {
    this.createModal();
    this.startCountdown();
  }

  createModal() {
    // Modal principal
    const modal = document.createElement('div');
    modal.id = 'duel-invitation-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 2px solid #ff4d6d;
      border-radius: 15px;
      padding: 30px;
      z-index: 9998;
      box-shadow: 0 20px 60px rgba(255, 77, 109, 0.3);
      text-align: center;
      min-width: 350px;
      font-family: 'Orbitron', sans-serif;
      animation: slideInDuel 0.5s ease;
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #ff4d6d; margin: 0; font-size: 20px;">⚔️ INVITACIÓN A DUELO</h2>
        <button id="duel-close-btn" style="background: none; border: none; color: #ff4d6d; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;">✕</button>
      </div>
      
      <div style="margin: 20px 0;">
        <p style="color: #a78bfa; font-size: 14px; margin: 10px 0;"><strong>${this.invitedUsername}</strong> te ha retado a un duelo</p>
        <div style="background: rgba(255, 77, 109, 0.1); border: 2px solid rgba(255, 77, 109, 0.3); border-radius: 10px; padding: 15px; margin: 15px 0;">
          <div style="color: #ffd700; font-size: 32px; margin-bottom: 10px;">⏱️</div>\n          <div id="duel-timer" style="color: #4cff90; font-size: 24px; font-weight: bold;">60 seg</div>\n          <div style="color: #a78bfa; font-size: 12px; margin-top: 10px;">Tiempo para aceptar</div>\n        </div>\n      </div>\n      
n      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
        <button id="duel-accept-btn" style="background: linear-gradient(135deg, #4cff90, #2ecc71); color: #000; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Orbitron', sans-serif;">✓ Aceptar</button>
        <button id="duel-decline-btn" style="background: linear-gradient(135deg, #ff4d6d, #c41e3a); color: #fff; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: 'Orbitron', sans-serif;">✕ Rechazar</button>\n      </div>\n    `;

    document.body.appendChild(modal);

    // Barra superior (inicialmente oculta)
    const topBar = document.createElement('div');
    topBar.id = 'duel-invitation-bar';
    topBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #ff4d6d, #ff6b9d);
      color: #fff;
      padding: 12px 20px;
      text-align: center;
      font-family: 'Orbitron', sans-serif;
      font-size: 13px;
      z-index: 9997;
      display: none;
      box-shadow: 0 4px 12px rgba(255, 77, 109, 0.3);
    `;
    topBar.innerHTML = `
      <span>🔔 Invitación pendiente de <strong>${this.invitedUsername}</strong> • Tiempo restante: <span id="duel-bar-timer">60 seg</span></span>
    `;
    document.body.appendChild(topBar);

    // Event listeners
    document.getElementById('duel-close-btn').onclick = () => this.minimize();
    document.getElementById('duel-accept-btn').onclick = () => this.accept();
    document.getElementById('duel-decline-btn').onclick = () => this.decline();
  }

  startCountdown() {
    this.intervalId = setInterval(() => {
      this.timeRemaining--;
      this.updateDisplay();

      if (this.timeRemaining <= 0) {
        this.expire();
      }
    }, 1000);
  }

  updateDisplay() {
    const timerEl = document.getElementById('duel-timer');
    const barTimerEl = document.getElementById('duel-bar-timer');
    
    if (timerEl) timerEl.textContent = `${this.timeRemaining} seg`;
    if (barTimerEl) barTimerEl.textContent = `${this.timeRemaining} seg`;

    // Cambiar color según tiempo restante
    if (this.timeRemaining <= 10) {
      if (timerEl) timerEl.style.color = '#ff4d6d';
      if (barTimerEl) barTimerEl.style.color = '#ffff00';
    }
  }

  minimize() {
    this.isMinimized = true;
    const modal = document.getElementById('duel-invitation-modal');
    const topBar = document.getElementById('duel-invitation-bar');
    
    if (modal) modal.style.display = 'none';
    if (topBar) topBar.style.display = 'block';
  }

  maximize() {
    this.isMinimized = false;
    const modal = document.getElementById('duel-invitation-modal');
    const topBar = document.getElementById('duel-invitation-bar');
    
    if (modal) modal.style.display = 'block';
    if (topBar) topBar.style.display = 'none';
  }

  accept() {
    clearInterval(this.intervalId);
    console.log(`Duelo aceptado con ${this.invitedUsername}`);
    this.cleanup();
    // Aquí iría la lógica para iniciar el duelo
    alert(`¡Duelo iniciado con ${this.invitedUsername}!`);
  }

  decline() {
    clearInterval(this.intervalId);
    console.log(`Duelo rechazado de ${this.invitedUsername}`);
    this.cleanup();
    alert(`Duelo rechazado`);
  }

  expire() {
    clearInterval(this.intervalId);
    console.log(`Invitación de duelo expirada`);
    this.cleanup();
    alert(`La invitación de duelo ha expirado`);
  }

  cleanup() {
    const modal = document.getElementById('duel-invitation-modal');
    const topBar = document.getElementById('duel-invitation-bar');
    
    if (modal) modal.remove();
    if (topBar) topBar.remove();
  }
}

// Función para crear una invitación de prueba
export function createTestInvitation() {
  new DuelInvitation('Jugador123', 'user_id_123');
}
