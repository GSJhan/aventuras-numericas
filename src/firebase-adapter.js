import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Reutiliza la misma configuración de Firebase (no modifica la configuración actual)
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

/**
 * onRegister({ username, password })
 * - crea un documento de usuario si no existe
 * - devuelve { success: boolean, message: string }
 * Nota: este adaptador sigue la estructura de usuarios usada en main.js
 */
export async function onRegister({ username, password }) {
  if (!username || !password) return { success: false, message: 'Completa todos los campos' };
  const userRef = doc(db, 'users', username);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return { success: false, message: 'Ese usuario ya existe' };
  }

  const newUser = {
    password: password,
    xp: 0,
    coins: 0,
    level: 1,
    skin: 'spiderman',
    skins: ['spiderman'],
    logros: {},
    problemsSolved: 0,
    infinityProblemsSolved: 0,
    infinityBestStreak: 0,
    infinityStreak: 0,
    infinityCoinsEarned: 0,
    infinityXpEarned: 0,
    duelsWon: 0,
    duelCurrentStreak: 0,
    duelBestStreak: 0,
    quizQuestionsAnswered: 0,
    quizEasyCompleted: 0,
    quizNormalCompleted: 0,
    quizHardCompleted: 0,
    quizExpertCompleted: 0,
    quizPerfectRuns: 0,
    calcTotalSolved: 0,
    calcLinearSolved: 0,
    calcQuadraticSolved: 0,
    calcComplexSolved: 0,
    skillPoints: 0,
    skills: { algebra: 0, geometry: 0, speed: 0, precision: 0, infinity: 0 },
    stats: { facil: 0, normal: 0, dificil: 0, experto: 0, infinito: 0 },
    misionesCompletas: 0,
    totalMonedas: 0,
    powerDoubleUsed: 0,
    powerFiftyUsed: 0,
    powerLightUsed: 0,
    powerDoubleOwned: 0,
    powerFiftyOwned: 0,
    powerLightOwned: 0
  };

  await setDoc(userRef, newUser);
  // Importante: no pongas localStorage aquí; el registro no debe iniciar sesión automáticamente
  return { success: true, message: 'Cuenta creada correctamente' };
}

/**
 * onLogin({ username, password })
 * - verifica las credenciales y guarda currentUser en localStorage si todo va bien
 */
export async function onLogin({ username, password }) {
  if (!username || !password) return { success: false, message: 'Completa todos los campos' };
  const userRef = doc(db, 'users', username);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { success: false, message: 'Usuario no encontrado' };
  const user = snap.data();
  if (user.password !== password) return { success: false, message: 'Contraseña incorrecta' };

  // éxito: guarda currentUser como espera el resto de la app
  localStorage.setItem('currentUser', username);
  return { success: true, message: 'Inicio de sesión correcto' };
}
