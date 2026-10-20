// Power state normalization
function ensurePowerState() {
  if (!user) return;
  user.powerDoubleOwned = Number(user.powerDoubleOwned || 0);
  user.powerFiftyOwned = Number(user.powerFiftyOwned || 0);
  user.powerLightOwned = Number(user.powerLightOwned || 0);
}

// --- TIENDA (SOLO PODERES) ---
window.showTienda = function() {
  if (!user) return;
  ensurePowerState();

  let html = '<div class="tienda-grid">';
  html += '<h3 style="grid-column:1/-1; color:#4c90ff; font-family:Orbitron;">⚡ Poderes Especiales</h3>';

  POWERS.forEach(power => {
    const owned = power.id === 'double'
      ? (user.powerDoubleOwned || 0)
      : power.id === 'fifty'
        ? (user.powerFiftyOwned || 0)
        : (user.powerLightOwned || 0);

    html += `
      <div class="tienda-item">
        <div style="font-size:40px;">${power.icon}</div>
        <div>${power.name}</div>
        <div style="font-size:12px; opacity:0.8;">${power.desc}</div>
        <div style="font-size:12px; opacity:0.8; margin:6px 0;">Tienes: ${owned}</div>
        <button class="btn-primary" onclick="window.buyPower('${power.id}', ${power.cost})">
          ${power.cost} 💰
        </button>
      </div>
    `;
  });

  html += '</div>';
  const tiendaSection = document.getElementById('tiendaSection');
  if (tiendaSection) {
    tiendaSection.innerHTML = '<h2>🛍️ Tienda</h2>' + html;
  }
};

window.buyPower = async function(powerId, cost) {
  if (!user) return;
  ensurePowerState();

  if (user.coins < cost) {
    alert('No tienes suficientes monedas');
    return;
  }

  user.coins = Number(user.coins || 0) - Number(cost);

  if (powerId === 'double') {
    user.powerDoubleOwned += 1;
  } else if (powerId === 'fifty') {
    user.powerFiftyOwned += 1;
  } else if (powerId === 'light') {
    user.powerLightOwned += 1;
  }

  await saveUser();

  const coinsEl = document.getElementById('displayCoins');
  if (coinsEl) coinsEl.textContent = '💰 ' + user.coins;

  alert('¡Poder comprado!');
  window.showTienda();
};

// --- AVATAR EDITOR (CON COMPRA DE SKINS) ---
window.showAvatarEditor = function() {
  let html = '<div class="avatar-grid">';
  AVATARS.forEach(avatar => {
    const isSelected = user.skin === avatar;
    const owned = user.skins && user.skins.includes(avatar);
    const btnText = owned ? (isSelected ? '✓ Equipado' : 'Equipar') : 'Comprar (500 💰)';
    const btnClass = owned ? (isSelected ? 'btn-gray' : 'btn-green') : 'btn-primary';
    
    html += `
      <div class="avatar-option ${isSelected ? 'selected' : ''}">
        <img src="${getAvatarSrc(avatar)}" class="avatar-choice-img">
        <div style="margin-top:10px; font-size:12px;">${avatar}</div>
        <button class="${btnClass}" onclick="${owned ? `window.selectAvatar('${avatar}')` : `window.buyAvatar('${avatar}')`}" style="width:100%; margin-top:8px; padding:8px; border:none; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.3s;">
          ${btnText}
        </button>
      </div>
    `;
  });
  html += '</div>';
  document.getElementById('avatarSection').innerHTML = '<h2>👤 Avatares y Skins</h2>' + html;
};

window.buyAvatar = async function(avatar) {
  if (user.coins < 500) { alert('No tienes suficientes monedas'); return; }
  if (user.skins && user.skins.includes(avatar)) { alert('Ya lo posees'); return; }
  
  user.coins -= 500;
  if (!user.skins) user.skins = [];
  user.skins.push(avatar);
  await saveUser();
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  alert('¡Avatar comprado!');
  window.showAvatarEditor();
};

window.selectAvatar = async function(avatar) {
  if (!user.skins || !user.skins.includes(avatar)) {
    alert('Debes comprar este avatar primero');
    return;
  }
  user.skin = avatar;
  await saveUser();
  const avatarDisplay = document.getElementById('avatarDisplay');
  if (avatarDisplay) avatarDisplay.innerHTML = `<img src="${getAvatarSrc(avatar)}" onerror="this.outerHTML='🦸'" class="avatar-img-main"/>`;
  document.getElementById('displayCoins').textContent = '💰 ' + user.coins;
  window.showAvatarEditor();
};
