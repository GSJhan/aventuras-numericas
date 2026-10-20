import React, { useState } from 'react';
import styled from 'styled-components';

/**
 * Form.jsx
 * Reemplaza la interfaz de acceso/registro con el flujo correcto:
 * - "Acceso" = inicia sesión en una cuenta existente (llama a props.onLogin)
 * - "Registro" = crea una nueva cuenta (llama a props.onRegister)
 * Después de un registro exitoso, la tarjeta vuelve a "Acceso" y muestra un mensaje.
 * Props (opcionales):
 *  - onLogin({ username, password }) => Promise<{ success: boolean, message?: string }>
 *  - onRegister({ username, password }) => Promise<{ success: boolean, message?: string }>
 *  - onSuccess() => llamado después de iniciar sesión (por ejemplo, navegar al menú)
 *
 * Nota: el componente usa variables CSS del estilo global para mantener el tema del sitio
 * (por ejemplo: --bg, --accent, --accent2, --text). Si quieres integrar Firebase aquí,
 * pasa handlers que llamen a Firestore como en tu main.js existente.
 */

const Form = ({ onLogin, onRegister, onSuccess }) => {
  // toggleChecked: false -> frente (Acceso), true -> atrás (Registro)
  const [toggleChecked, setToggleChecked] = useState(false);

  // campos de acceso
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // campos de registro
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const safeCall = async (fn, args) => {
    try {
      if (!fn) return { success: false, message: 'No se proporcionó un manejador' };
      return await fn(args);
    } catch (e) {
      return { success: false, message: e?.message || 'Error inesperado' };
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setMessage(null);
    if (!loginUser || !loginPass) {
      setMessage({ type: 'error', text: 'Completa usuario y contraseña' });
      return;
    }
    setLoading(true);
    const res = await safeCall(onLogin, { username: loginUser.trim(), password: loginPass });
    setLoading(false);
    if (res && res.success) {
      setMessage({ type: 'ok', text: res.message || 'Sesión iniciada' });
      if (onSuccess) onSuccess();
    } else {
      setMessage({ type: 'error', text: res?.message || 'Usuario o contraseña incorrectos' });
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setMessage(null);
    if (!regUser || !regPass) {
      setMessage({ type: 'error', text: 'Completa usuario y contraseña para registrarte' });
      return;
    }
    setLoading(true);
    const res = await safeCall(onRegister, { username: regUser.trim(), password: regPass });
    setLoading(false);

    if (res && res.success) {
      // Importante: no inicies sesión automáticamente. Vuelve a Acceso para que el usuario entre.
      setToggleChecked(false);
      setMessage({ type: 'ok', text: res.message || 'Cuenta creada. Ahora inicia sesión.' });
      // Opcionalmente, precarga el nombre de usuario recién creado
      setLoginUser(regUser.trim());
      setLoginPass('');
      // limpia regPass por seguridad
      setRegPass('');
    } else {
      setMessage({ type: 'error', text: res?.message || 'No se pudo crear la cuenta' });
    }
  };

  return (
    <StyledWrapper>
      <div className="wrapper">
        <div className="card-switch">
          <label className="switch">
            <input
              className="toggle"
              type="checkbox"
              checked={toggleChecked}
              onChange={(e) => { setToggleChecked(e.target.checked); setMessage(null); }}
            />
            <span className="slider" />
            <span className="card-side" />

            <div className="flip-card__inner">
              <div className="flip-card__front">
                <div className="title">Acceso</div>
                <form onSubmit={handleLogin} className="flip-card__form">
                  <input
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    type="text"
                    placeholder="Nombre de usuario"
                    name="nombre"
                    className="flip-card__input"
                    autoComplete="username"
                  />
                  <input
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    type="password"
                    placeholder="Contraseña"
                    name="contrasena"
                    className="flip-card__input"
                    autoComplete="current-password"
                  />
                  <button type="submit" className="flip-card__btn" disabled={loading}>
                    {loading ? 'Cargando...' : 'Acceder'}
                  </button>
                </form>
              </div>

              <div className="flip-card__back">
                <div className="title">Registro</div>
                <form onSubmit={handleRegister} className="flip-card__form">
                  <input
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value)}
                    type="text"
                    placeholder="Nombre de usuario"
                    name="nombre"
                    className="flip-card__input"
                    autoComplete="username"
                  />
                  <input
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    type="password"
                    placeholder="Contraseña"
                    name="contrasena"
                    className="flip-card__input"
                    autoComplete="new-password"
                  />
                  <button type="submit" className="flip-card__btn" disabled={loading}>
                    {loading ? 'Creando...' : 'Registrarse'}
                  </button>
                </form>
              </div>
            </div>
          </label>

          {message && (
            <div className={`form-message ${message.type === 'ok' ? 'ok' : 'error'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .wrapper {
    --input-focus: var(--accent, #2d8cf0);
    --font-color: var(--text, #fefefe);
    --font-color-sub: rgba(255,255,255,0.6);
    --bg-color: var(--bg, #111);
    --main-color: var(--text, #fefefe);
    display:flex; justify-content:center; align-items:center; padding: 24px;
  }

  /* tarjeta de cambio */
  .switch {
    transform: translateY(0);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 18px;
    width: 50px;
    height: 20px;
  }

  .card-side::before {
    position: absolute;
    content: 'Acceso';
    left: -90px;
    top: -6px;
    width: 120px;
    text-decoration: underline;
    color: var(--font-color);
    font-weight: 600;
    text-transform: capitalize;
  }

  .card-side::after {
    position: absolute;
    content: 'Registro';
    left: 70px;
    top: -6px;
    width: 120px;
    text-decoration: none;
    color: var(--font-color);
    font-weight: 600;
    text-transform: capitalize;
  }

  .toggle { opacity: 0; width: 0; height: 0; }

  .slider {
    box-sizing: border-box;
    border-radius: 6px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--bg-color);
    transition: 0.3s;
  }

  .slider:before {
    box-sizing: border-box;
    position: absolute;
    content: "";
    height: 20px; width: 20px;
    border: 2px solid var(--main-color);
    border-radius: 6px;
    left: -2px; bottom: 2px;
    background-color: var(--bg-color);
    box-shadow: 0 3px 0 var(--main-color);
    transition: 0.3s;
  }

  .toggle:checked + .slider { background-color: var(--input-focus); }
  .toggle:checked + .slider:before { transform: translateX(30px); }
  .toggle:checked ~ .card-side:before { text-decoration: none; }
  .toggle:checked ~ .card-side:after { text-decoration: underline; }

  /* tarjeta */
  .flip-card__inner {
    width: 320px; max-width: 92vw;
    height: 380px;
    position: relative; background-color: transparent;
    perspective: 1000px; text-align: center;
    transition: transform 0.8s; transform-style: preserve-3d;
    margin-top: 12px;
  }

  .toggle:checked ~ .flip-card__inner { transform: rotateY(180deg); }
  .toggle:checked ~ .flip-card__front { box-shadow: none; }

  .flip-card__front, .flip-card__back {
    padding: 20px; position: absolute; display: flex; flex-direction: column; justify-content: center;
    -webkit-backface-visibility: hidden; backface-visibility: hidden;
    background: var(--bg-color); gap: 20px; border-radius: 8px; border: 2px solid var(--main-color);
    box-shadow: 6px 6px 0 var(--main-color);
    left: 0; top: 0; right: 0; bottom: 0;
  }

  .flip-card__back { transform: rotateY(180deg); }

  .flip-card__form { display: flex; flex-direction: column; align-items: center; gap: 16px; }

  .title { margin: 10px 0 0 0; font-size: 22px; font-weight: 900; color: var(--main-color); }

  .flip-card__input {
    width: 260px; max-width: 88%; height: 42px; border-radius: 6px;
    border: 2px solid var(--main-color); background-color: var(--bg-color);
    box-shadow: 4px 4px 0 var(--main-color); font-size: 15px; font-weight: 600; color: var(--font-color);
    padding: 6px 10px; outline: none;
  }
  .flip-card__input::placeholder { color: var(--font-color-sub); opacity: 0.9; }
  .flip-card__input:focus { border: 2px solid var(--input-focus); }

  .flip-card__btn { margin: 8px 0 0 0; width: 140px; height: 42px; border-radius: 6px; border: 2px solid var(--main-color); background-color: var(--bg-color); box-shadow: 4px 4px 0 var(--main-color); color: var(--font-color); font-weight: 800; cursor: pointer; }
  .flip-card__btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .form-message { margin-top: 14px; text-align: center; font-weight: 700; }
  .form-message.ok { color: var(--green, #4cff90); }
  .form-message.error { color: var(--red, #ff4d6d); }

  @media (max-width: 480px) {
    .flip-card__input { width: 220px; }
    .flip-card__inner { height: 420px; }
  }
`;

export default Form;
