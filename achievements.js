// Sistema de Logros - 100+ Logros organizados por categorías

export const ACHIEVEMENTS = {
  // Categoría: Principiante
  beginner: [
    { id: 'first_step', icon: '👣', title: 'Primer Paso', desc: 'Resuelve tu primer problema', category: 'Principiante' },
    { id: 'first_five', icon: '5️⃣', title: 'Cinco Problemas', desc: 'Resuelve 5 problemas', category: 'Principiante' },
    { id: 'first_ten', icon: '🔟', title: 'Diez Problemas', desc: 'Resuelve 10 problemas', category: 'Principiante' },
    { id: 'first_quiz', icon: '🎯', title: 'Primer Quiz', desc: 'Completa tu primer quiz', category: 'Principiante' },
    { id: 'first_coins', icon: '💰', title: 'Primeras Monedas', desc: 'Gana 100 monedas', category: 'Principiante' },
    { id: 'first_xp', icon: '⭐', title: 'Primeras Estrellas', desc: 'Gana 500 XP', category: 'Principiante' },
    { id: 'first_level', icon: '📈', title: 'Nivel 2', desc: 'Alcanza nivel 2', category: 'Principiante' },
    { id: 'first_skin', icon: '👤', title: 'Nuevo Avatar', desc: 'Compra tu primer avatar', category: 'Principiante' },
  ],

  // Categoría: Racha
  streak: [
    { id: 'streak_3', icon: '🔥', title: 'Racha x3', desc: '3 aciertos seguidos en Infinito', category: 'Racha' },
    { id: 'streak_5', icon: '🔥🔥', title: 'Racha x5', desc: '5 aciertos seguidos en Infinito', category: 'Racha' },
    { id: 'streak_10', icon: '🔥🔥🔥', title: 'Racha x10', desc: '10 aciertos seguidos en Infinito', category: 'Racha' },
    { id: 'streak_25', icon: '🌪️', title: 'Racha x25', desc: '25 aciertos seguidos en Infinito', category: 'Racha' },
    { id: 'streak_50', icon: '⚡', title: 'Racha x50', desc: '50 aciertos seguidos en Infinito', category: 'Racha' },
    { id: 'streak_100', icon: '💥', title: 'Racha x100', desc: '100 aciertos seguidos en Infinito', category: 'Racha' },
    { id: 'streak_250', icon: '🌟', title: 'Racha x250', desc: '250 aciertos seguidos en Infinito', category: 'Racha' },
    { id: 'streak_500', icon: '👑', title: 'Racha x500', desc: '500 aciertos seguidos en Infinito', category: 'Racha' },
  ],

  // Categoría: Progreso
  progress: [
    { id: 'level_5', icon: '📊', title: 'Nivel 5', desc: 'Alcanza nivel 5', category: 'Progreso' },
    { id: 'level_10', icon: '📈', title: 'Nivel 10', desc: 'Alcanza nivel 10', category: 'Progreso' },
    { id: 'level_20', icon: '📉', title: 'Nivel 20', desc: 'Alcanza nivel 20', category: 'Progreso' },
    { id: 'level_50', icon: '🚀', title: 'Nivel 50', desc: 'Alcanza nivel 50', category: 'Progreso' },
    { id: 'level_100', icon: '🌌', title: 'Nivel 100', desc: 'Alcanza nivel 100', category: 'Progreso' },
    { id: 'coins_1000', icon: '💎', title: 'Mil Monedas', desc: 'Acumula 1000 monedas', category: 'Progreso' },
    { id: 'coins_5000', icon: '💍', title: 'Cinco Mil Monedas', desc: 'Acumula 5000 monedas', category: 'Progreso' },
    { id: 'coins_10000', icon: '👑', title: 'Diez Mil Monedas', desc: 'Acumula 10000 monedas', category: 'Progreso' },
    { id: 'xp_5000', icon: '✨', title: '5000 XP', desc: 'Gana 5000 XP total', category: 'Progreso' },
    { id: 'xp_10000', icon: '🌠', title: '10000 XP', desc: 'Gana 10000 XP total', category: 'Progreso' },
    { id: 'xp_50000', icon: '🌟', title: '50000 XP', desc: 'Gana 50000 XP total', category: 'Progreso' },
  ],

  // Categoría: Modo Infinito
  infinity: [
    { id: 'infinito_10', icon: '∞', title: 'Infinito Principiante', desc: 'Resuelve 10 problemas en Infinito', category: 'Infinito' },
    { id: 'infinito_50', icon: '∞∞', title: 'Infinito Intermedio', desc: 'Resuelve 50 problemas en Infinito', category: 'Infinito' },
    { id: 'infinito_100', icon: '∞∞∞', title: 'Infinito Avanzado', desc: 'Resuelve 100 problemas en Infinito', category: 'Infinito' },
    { id: 'infinito_500', icon: '♾️', title: 'Infinito Experto', desc: 'Resuelve 500 problemas en Infinito', category: 'Infinito' },
    { id: 'infinito_1000', icon: '🌀', title: 'Maestro del Infinito', desc: 'Resuelve 1000 problemas en Infinito', category: 'Infinito' },
    { id: 'infinito_coins_1000', icon: '💰∞', title: 'Monedas Infinitas', desc: 'Gana 1000 monedas en Infinito', category: 'Infinito' },
    { id: 'infinito_xp_5000', icon: '⭐∞', title: 'XP Infinito', desc: 'Gana 5000 XP en Infinito', category: 'Infinito' },
  ],

  // Categoría: Quiz
  quiz: [
    { id: 'quiz_easy_10', icon: '😊', title: 'Quiz Fácil', desc: 'Completa 10 quizzes en dificultad Fácil', category: 'Quiz' },
    { id: 'quiz_normal_10', icon: '😐', title: 'Quiz Normal', desc: 'Completa 10 quizzes en dificultad Normal', category: 'Quiz' },
    { id: 'quiz_hard_10', icon: '😤', title: 'Quiz Difícil', desc: 'Completa 10 quizzes en dificultad Difícil', category: 'Quiz' },
    { id: 'quiz_expert_10', icon: '🔥', title: 'Quiz Experto', desc: 'Completa 10 quizzes en dificultad Experto', category: 'Quiz' },
    { id: 'quiz_perfect_5', icon: '💯', title: 'Quiz Perfecto', desc: 'Completa 5 quizzes sin errores', category: 'Quiz' },
    { id: 'quiz_perfect_10', icon: '🎯', title: 'Quiz Maestro', desc: 'Completa 10 quizzes sin errores', category: 'Quiz' },
    { id: 'quiz_total_100', icon: '📚', title: 'Cien Preguntas', desc: 'Responde 100 preguntas en total', category: 'Quiz' },
    { id: 'quiz_total_500', icon: '📖', title: 'Quinientas Preguntas', desc: 'Responde 500 preguntas en total', category: 'Quiz' },
  ],

  // Categoría: Calculadora
  calculator: [
    { id: 'calc_linear', icon: '📐', title: 'Ecuaciones Lineales', desc: 'Resuelve 10 ecuaciones lineales', category: 'Calculadora' },
    { id: 'calc_quadratic', icon: '📏', title: 'Ecuaciones Cuadráticas', desc: 'Resuelve 10 ecuaciones cuadráticas', category: 'Calculadora' },
    { id: 'calc_complex', icon: '🔬', title: 'Ecuaciones Complejas', desc: 'Resuelve 10 ecuaciones complejas', category: 'Calculadora' },
    { id: 'calc_total_50', icon: '🧮', title: 'Cincuenta Ecuaciones', desc: 'Resuelve 50 ecuaciones en total', category: 'Calculadora' },
    { id: 'calc_total_100', icon: '🔢', title: 'Cien Ecuaciones', desc: 'Resuelve 100 ecuaciones en total', category: 'Calculadora' },
  ],

  // Categoría: Duelos
  duels: [
    { id: 'duel_first', icon: '⚔️', title: 'Primer Duelo', desc: 'Gana tu primer duelo', category: 'Duelos' },
    { id: 'duel_5', icon: '⚔️⚔️', title: 'Cinco Duelos', desc: 'Gana 5 duelos', category: 'Duelos' },
    { id: 'duel_10', icon: '⚔️⚔️⚔️', title: 'Diez Duelos', desc: 'Gana 10 duelos', category: 'Duelos' },
    { id: 'duel_25', icon: '🗡️', title: 'Veinticinco Duelos', desc: 'Gana 25 duelos', category: 'Duelos' },
    { id: 'duel_50', icon: '🛡️', title: 'Cincuenta Duelos', desc: 'Gana 50 duelos', category: 'Duelos' },
    { id: 'duel_100', icon: '👑', title: 'Cien Duelos', desc: 'Gana 100 duelos', category: 'Duelos' },
    { id: 'duel_warrior', icon: '🏆', title: 'Guerrero', desc: 'Gana 5 duelos consecutivos', category: 'Duelos' },
    { id: 'duel_legend', icon: '⭐', title: 'Leyenda', desc: 'Gana 10 duelos consecutivos', category: 'Duelos' },
  ],

  // Categoría: Poderes
  powers: [
    { id: 'power_double_1', icon: '💰', title: 'Doble Novato', desc: 'Usa el poder Doble 5 veces', category: 'Poderes' },
    { id: 'power_double_2', icon: '💰💰', title: 'Doble Experto', desc: 'Usa el poder Doble 25 veces', category: 'Poderes' },
    { id: 'power_fifty_1', icon: '🌓', title: '50/50 Novato', desc: 'Usa el poder 50/50 5 veces', category: 'Poderes' },
    { id: 'power_fifty_2', icon: '🌓🌓', title: '50/50 Experto', desc: 'Usa el poder 50/50 25 veces', category: 'Poderes' },
    { id: 'power_light_1', icon: '⚡', title: 'Luz Novato', desc: 'Usa el poder Luz 5 veces', category: 'Poderes' },
    { id: 'power_light_2', icon: '⚡⚡', title: 'Luz Experto', desc: 'Usa el poder Luz 25 veces', category: 'Poderes' },
    { id: 'power_all_100', icon: '🌟', title: 'Coleccionista de Poderes', desc: 'Usa todos los poderes 100 veces en total', category: 'Poderes' },
  ],

  // Categoría: Avatares
  avatars: [
    { id: 'avatar_batman', icon: '🦇', title: 'Murciélago Nocturno', desc: 'Compra el avatar de Batman', category: 'Avatares' },
    { id: 'avatar_goku', icon: '🧡', title: 'Guerrero Saiyajin', desc: 'Compra el avatar de Goku', category: 'Avatares' },
    { id: 'avatar_ironman', icon: '🤖', title: 'Hombre de Hierro', desc: 'Compra el avatar de Iron Man', category: 'Avatares' },
    { id: 'avatar_sasuke', icon: '⚫', title: 'Venganza Ninja', desc: 'Compra el avatar de Sasuke', category: 'Avatares' },
    { id: 'avatar_kakashi', icon: '👁️', title: 'Ojo Copia', desc: 'Compra el avatar de Kakashi', category: 'Avatares' },
    { id: 'avatar_vegeta', icon: '💜', title: 'Príncipe Saiyajin', desc: 'Compra el avatar de Vegeta', category: 'Avatares' },
    { id: 'avatar_itachi', icon: '🌙', title: 'Genjutsu Maestro', desc: 'Compra el avatar de Itachi', category: 'Avatares' },
    { id: 'avatar_zoro', icon: '🗡️', title: 'Espadachín Legendario', desc: 'Compra el avatar de Zoro', category: 'Avatares' },
    { id: 'avatar_luffy', icon: '❤️', title: 'Rey de los Piratas', desc: 'Compra el avatar de Luffy', category: 'Avatares' },
    { id: 'avatar_collector', icon: '🎭', title: 'Coleccionista', desc: 'Compra todos los avatares', category: 'Avatares' },
  ],

  // Categoría: Habilidades
  skills: [
    { id: 'skill_algebra_1', icon: '📐', title: 'Álgebra Básica', desc: 'Alcanza nivel 3 en Álgebra', category: 'Habilidades' },
    { id: 'skill_algebra_2', icon: '📐📐', title: 'Álgebra Avanzada', desc: 'Alcanza nivel 5 en Álgebra', category: 'Habilidades' },
    { id: 'skill_geometry_1', icon: '📏', title: 'Geometría Básica', desc: 'Alcanza nivel 3 en Geometría', category: 'Habilidades' },
    { id: 'skill_geometry_2', icon: '📏📏', title: 'Geometría Avanzada', desc: 'Alcanza nivel 5 en Geometría', category: 'Habilidades' },
    { id: 'skill_speed_1', icon: '⚡', title: 'Rapidez Básica', desc: 'Alcanza nivel 3 en Rapidez', category: 'Habilidades' },
    { id: 'skill_speed_2', icon: '⚡⚡', title: 'Rapidez Avanzada', desc: 'Alcanza nivel 5 en Rapidez', category: 'Habilidades' },
    { id: 'skill_accuracy_1', icon: '🎯', title: 'Precisión Básica', desc: 'Alcanza nivel 3 en Precisión', category: 'Habilidades' },
    { id: 'skill_accuracy_2', icon: '🎯🎯', title: 'Precisión Avanzada', desc: 'Alcanza nivel 5 en Precisión', category: 'Habilidades' },
  ],

  // Categoría: Especiales
  special: [
    { id: 'special_night_owl', icon: '🌙', title: 'Búho Nocturno', desc: 'Juega entre las 12am y 6am', category: 'Especiales' },
    { id: 'special_early_bird', icon: '🌅', title: 'Madrugador', desc: 'Juega entre las 6am y 9am', category: 'Especiales' },
    { id: 'special_daily_1', icon: '📅', title: 'Jugador Diario', desc: 'Juega 7 días seguidos', category: 'Especiales' },
    { id: 'special_daily_2', icon: '📆', title: 'Adicto al Juego', desc: 'Juega 30 días seguidos', category: 'Especiales' },
    { id: 'special_session_1h', icon: '⏱️', title: 'Sesión Larga', desc: 'Juega 1 hora seguida', category: 'Especiales' },
    { id: 'special_session_5h', icon: '⏰', title: 'Maratón', desc: 'Juega 5 horas seguidas', category: 'Especiales' },
    { id: 'special_comeback', icon: '🔄', title: 'Regreso Triunfal', desc: 'Vuelve después de 7 días sin jugar', category: 'Especiales' },
    { id: 'special_lucky', icon: '🍀', title: 'Afortunado', desc: 'Gana 3 duelos en fila con poderes', category: 'Especiales' },
    { id: 'special_speedrun', icon: '🚀', title: 'Velocista', desc: 'Resuelve 10 problemas en menos de 5 minutos', category: 'Especiales' },
    { id: 'special_collector', icon: '🏅', title: 'Coleccionista de Logros', desc: 'Desbloquea 50 logros', category: 'Especiales' },
    { id: 'special_master', icon: '👑', title: 'Maestro del Juego', desc: 'Desbloquea todos los logros', category: 'Especiales' },
  ],

  // Categoría: Desafíos
  challenges: [
    { id: 'challenge_100_correct', icon: '💯', title: 'Cien Aciertos', desc: '100 respuestas correctas sin errores', category: 'Desafíos' },
    { id: 'challenge_no_power', icon: '🚫', title: 'Sin Poderes', desc: 'Gana 10 duelos sin usar poderes', category: 'Desafíos' },
    { id: 'challenge_all_modes', icon: '🎮', title: 'Polivalente', desc: 'Juega en todos los modos disponibles', category: 'Desafíos' },
    { id: 'challenge_rich', icon: '💸', title: 'Millonario', desc: 'Acumula 50000 monedas', category: 'Desafíos' },
    { id: 'challenge_legend', icon: '🌟', title: 'Leyenda Viviente', desc: 'Alcanza nivel 100', category: 'Desafíos' },
  ],
};

// Función para obtener todos los logros
export function getAllAchievements() {
  const all = [];
  for (const category in ACHIEVEMENTS) {
    all.push(...ACHIEVEMENTS[category]);
  }
  return all;
}

// Función para obtener logros por categoría
export function getAchievementsByCategory(category) {
  return ACHIEVEMENTS[category] || [];
}

// Función para obtener estadísticas de logros
export function getAchievementStats(userLogros) {
  const all = getAllAchievements();
  const unlocked = all.filter(a => userLogros[a.id]).length;
  const total = all.length;
  const percentage = Math.round((unlocked / total) * 100);
  
  return { unlocked, total, percentage };
}
