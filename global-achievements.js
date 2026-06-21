// Sistema Global de Verificación de Logros - Actualizado con 100+ Logros
import { getAllAchievements } from './achievements.js';

export async function checkAllAchievements(user, userRef) {
  if (!user.logros) user.logros = {};
  
  const achievements = getAllAchievements();
  let changed = false;

  for (const achievement of achievements) {
    // Si ya está desbloqueado, saltar
    if (user.logros[achievement.id] === true) continue;

    let shouldUnlock = false;
    const level = calculateLevel(user.xp || 0);

    // Verificar condiciones según el ID del logro
    switch(achievement.id) {
      // Principiante
      case 'first_step': shouldUnlock = (user.problemsSolved || 0) >= 1; break;
      case 'first_five': shouldUnlock = (user.problemsSolved || 0) >= 5; break;
      case 'first_ten': shouldUnlock = (user.problemsSolved || 0) >= 10; break;
      case 'first_quiz': shouldUnlock = (user.quizQuestionsAnswered || 0) >= 1; break;
      case 'first_coins': shouldUnlock = (user.coins || 0) >= 100; break;
      case 'first_xp': shouldUnlock = (user.xp || 0) >= 500; break;
      case 'first_level': shouldUnlock = level >= 2; break;
      case 'first_skin': shouldUnlock = (user.skins || []).length > 1; break;

      // Racha
      case 'streak_3': shouldUnlock = (user.infinityBestStreak || 0) >= 3; break;
      case 'streak_5': shouldUnlock = (user.infinityBestStreak || 0) >= 5; break;
      case 'streak_10': shouldUnlock = (user.infinityBestStreak || 0) >= 10; break;
      case 'streak_25': shouldUnlock = (user.infinityBestStreak || 0) >= 25; break;
      case 'streak_50': shouldUnlock = (user.infinityBestStreak || 0) >= 50; break;
      case 'streak_100': shouldUnlock = (user.infinityBestStreak || 0) >= 100; break;
      case 'streak_250': shouldUnlock = (user.infinityBestStreak || 0) >= 250; break;
      case 'streak_500': shouldUnlock = (user.infinityBestStreak || 0) >= 500; break;

      // Progreso
      case 'level_5': shouldUnlock = level >= 5; break;
      case 'level_10': shouldUnlock = level >= 10; break;
      case 'level_20': shouldUnlock = level >= 20; break;
      case 'level_50': shouldUnlock = level >= 50; break;
      case 'level_100': shouldUnlock = level >= 100; break;
      case 'coins_1000': shouldUnlock = (user.coins || 0) >= 1000; break;
      case 'coins_5000': shouldUnlock = (user.coins || 0) >= 5000; break;
      case 'coins_10000': shouldUnlock = (user.coins || 0) >= 10000; break;
      case 'xp_5000': shouldUnlock = (user.xp || 0) >= 5000; break;
      case 'xp_10000': shouldUnlock = (user.xp || 0) >= 10000; break;
      case 'xp_50000': shouldUnlock = (user.xp || 0) >= 50000; break;

      // Infinito
      case 'infinito_10': shouldUnlock = (user.infinityProblemsSolved || 0) >= 10; break;
      case 'infinito_50': shouldUnlock = (user.infinityProblemsSolved || 0) >= 50; break;
      case 'infinito_100': shouldUnlock = (user.infinityProblemsSolved || 0) >= 100; break;
      case 'infinito_500': shouldUnlock = (user.infinityProblemsSolved || 0) >= 500; break;
      case 'infinito_1000': shouldUnlock = (user.infinityProblemsSolved || 0) >= 1000; break;
      case 'infinito_coins_1000': shouldUnlock = (user.infinityCoinsEarned || 0) >= 1000; break;
      case 'infinito_xp_5000': shouldUnlock = (user.infinityXpEarned || 0) >= 5000; break;

      // Quiz
      case 'quiz_easy_10': shouldUnlock = (user.quizEasyCompleted || 0) >= 10; break;
      case 'quiz_normal_10': shouldUnlock = (user.quizNormalCompleted || 0) >= 10; break;
      case 'quiz_hard_10': shouldUnlock = (user.quizHardCompleted || 0) >= 10; break;
      case 'quiz_expert_10': shouldUnlock = (user.quizExpertCompleted || 0) >= 10; break;
      case 'quiz_perfect_5': shouldUnlock = (user.quizPerfectRuns || 0) >= 5; break;
      case 'quiz_perfect_10': shouldUnlock = (user.quizPerfectRuns || 0) >= 10; break;
      case 'quiz_total_100': shouldUnlock = (user.quizQuestionsAnswered || 0) >= 100; break;
      case 'quiz_total_500': shouldUnlock = (user.quizQuestionsAnswered || 0) >= 500; break;

      // Calculadora
      case 'calc_linear': shouldUnlock = (user.calcLinearSolved || 0) >= 10; break;
      case 'calc_quadratic': shouldUnlock = (user.calcQuadraticSolved || 0) >= 10; break;
      case 'calc_complex': shouldUnlock = (user.calcComplexSolved || 0) >= 10; break;
      case 'calc_total_50': shouldUnlock = (user.calcTotalSolved || 0) >= 50; break;
      case 'calc_total_100': shouldUnlock = (user.calcTotalSolved || 0) >= 100; break;

      // Duelos
      case 'duel_first': shouldUnlock = (user.duelsWon || 0) >= 1; break;
      case 'duel_5': shouldUnlock = (user.duelsWon || 0) >= 5; break;
      case 'duel_10': shouldUnlock = (user.duelsWon || 0) >= 10; break;
      case 'duel_25': shouldUnlock = (user.duelsWon || 0) >= 25; break;
      case 'duel_50': shouldUnlock = (user.duelsWon || 0) >= 50; break;
      case 'duel_100': shouldUnlock = (user.duelsWon || 0) >= 100; break;
      case 'duel_warrior': shouldUnlock = (user.duelBestStreak || 0) >= 5; break;
      case 'duel_legend': shouldUnlock = (user.duelBestStreak || 0) >= 10; break;

      // Poderes
      case 'power_double_1': shouldUnlock = (user.powerDoubleUsed || 0) >= 5; break;
      case 'power_double_2': shouldUnlock = (user.powerDoubleUsed || 0) >= 25; break;
      case 'power_fifty_1': shouldUnlock = (user.powerFiftyUsed || 0) >= 5; break;
      case 'power_fifty_2': shouldUnlock = (user.powerFiftyUsed || 0) >= 25; break;
      case 'power_light_1': shouldUnlock = (user.powerLightUsed || 0) >= 5; break;
      case 'power_light_2': shouldUnlock = (user.powerLightUsed || 0) >= 25; break;
      case 'power_all_100': shouldUnlock = ((user.powerDoubleUsed || 0) + (user.powerFiftyUsed || 0) + (user.powerLightUsed || 0)) >= 100; break;

      // Avatares - CORREGIDO: Sin extensión de archivo
      case 'avatar_batman': shouldUnlock = (user.skins || []).includes('batman'); break;
      case 'avatar_goku': shouldUnlock = (user.skins || []).includes('goku'); break;
      case 'avatar_ironman': shouldUnlock = (user.skins || []).includes('ironman'); break;
      case 'avatar_sasuke': shouldUnlock = (user.skins || []).includes('sasuke'); break;
      case 'avatar_kakashi': shouldUnlock = (user.skins || []).includes('kakashi'); break;
      case 'avatar_vegeta': shouldUnlock = (user.skins || []).includes('vegeta'); break;
      case 'avatar_itachi': shouldUnlock = (user.skins || []).includes('itachi'); break;
      case 'avatar_zoro': shouldUnlock = (user.skins || []).includes('zoro'); break;
      case 'avatar_luffy': shouldUnlock = (user.skins || []).includes('luffy'); break;
      case 'avatar_collector': shouldUnlock = (user.skins || []).length >= 10; break;

      // Especiales y Desafíos
      case 'special_collector': shouldUnlock = Object.keys(user.logros).length >= 50; break;
      case 'challenge_rich': shouldUnlock = (user.coins || 0) >= 50000; break;
      case 'challenge_legend': shouldUnlock = level >= 100; break;
    }

    if (shouldUnlock) {
      user.logros[achievement.id] = true;
      changed = true;
      showAchievementNotification(achievement);
    }
  }

  if (changed) {
    const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await setDoc(userRef, user);
  }

  return changed;
}

function calculateLevel(xp) {
  // Fórmula de niveles: 1 nivel cada 500 XP, escalable hasta 10 millones
  return Math.floor(xp / 500) + 1;
}

function showAchievementNotification(achievement) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ffd700, #ff9500);
    color: #000;
    padding: 20px 30px;
    border-radius: 12px;
    font-weight: bold;
    font-family: 'Orbitron', sans-serif;
    box-shadow: 0 10px 30px rgba(255,215,0,0.5);
    z-index: 9999;
    animation: slideIn 0.5s ease;
  `;
  notification.innerHTML = `🏆 ¡LOGRO DESBLOQUEADO!<br>${achievement.icon} ${achievement.title}`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}
