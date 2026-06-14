# 🎮 Aventuras Numéricas

Un juego educativo de matemáticas divertido para resolver ecuaciones, hacer desafíos y demostrar que jugando podemos aprender. Disponible como PWA instalable en móvil, tablet y PC.

## 📋 Descripción del Proyecto

**Aventuras Numéricas** es una aplicación web progresiva (PWA) que combina educación y entretenimiento. Los jugadores pueden:
- Resolver ecuaciones cuadráticas con visualización gráfica interactiva
- Participar en quizzes de múltiple opción con diferentes dificultades
- Desafiar a otros jugadores en duelos en tiempo real
- Desbloquear habilidades matemáticas en un árbol interactivo
- Competir en rankings globales
- Jugar en modo infinito acumulando rachas

## 📁 Estructura de Archivos

### 🔧 Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| **manifest.json** | Configuración PWA: permite instalar la app en móvil, tablet y PC. Define nombre, icono, colores y shortcuts. |
| **service-worker.js** | Service Worker para soporte offline, caching inteligente y sincronización en segundo plano. |
| **README.md** | Este archivo con documentación completa del proyecto. |

### 🌐 Páginas HTML

| Archivo | Descripción |
|---------|-------------|
| **index.html** | Página de autenticación (login/registro). Punto de entrada de la aplicación. |
| **menu.html** | Menú principal con navegación a todas las secciones del juego. |
| **game.html** | Página de juego con dos modos: calculadora de ecuaciones y quiz. |

### 🎯 Módulos JavaScript

| Archivo | Descripción |
|---------|-------------|
| **main.js** | Lógica de autenticación con Firebase Firestore. Maneja registro e inicio de sesión. |
| **menu.js** | Controlador del menú principal. Gestiona navegación, avatares, logros, ranking y modo infinito. |
| **game.js** | Lógica del juego: resolución de ecuaciones, generación de preguntas infinitas y quiz interactivo. |
| **skills.js** | Árbol de habilidades con gráfico radial (pentágono). Muestra estadísticas: duelos ganados, racha, nivel, XP y monedas. |
| **duels.js** | Sistema de duelos online entre amigos. Gestiona desafíos en tiempo real con Firestore. |

### 🎨 Estilos

| Archivo | Descripción |
|---------|-------------|
| **style.css** | Hoja de estilos global. Temas, animaciones, componentes UI y estilos responsivos. |

### 🎵 Recursos Multimedia

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| **ciudad.jpg** | Imagen | Fondo tema "Ciudad Nocturna" |
| **galaxia.jpg** | Imagen | Fondo tema "Galaxia" |
| **parque.jpg** | Imagen | Fondo tema "Parque" |
| **bosque.jpg** | Imagen | Fondo tema "Bosque" |
| **neon.jpg** | Imagen | Fondo tema "Neón" |
| **ciudad.mp3** | Audio | Música de fondo para tema "Ciudad Nocturna" |
| **galaxia.mp3** | Audio | Música de fondo para tema "Galaxia" |
| **parque.mp3** | Audio | Música de fondo para tema "Parque" |
| **bosque.mp3** | Audio | Música de fondo para tema "Bosque" |
| **neon.mp3** | Audio | Música de fondo para tema "Neón" |

### 👾 Avatares

| Archivo | Descripción |
|---------|-------------|
| **spiderman.png** | Avatar Spider-Man (desbloqueado por defecto) |
| **batman.jpg** | Avatar Batman (costo: 80 monedas) |
| **goku.png** | Avatar Goku (costo: 200 monedas) |
| **ironman.png** | Avatar Iron Man (costo: 150 monedas) |
| **sasuke.png** | Avatar Sasuke (costo: 140 monedas) |
| **kakashi.jpg** | Avatar Kakashi (costo: 120 monedas) |
| **vegeta.png** | Avatar Vegeta (costo: 210 monedas) |
| **itachi.png** | Avatar Itachi (costo: 220 monedas) |
| **zoro.png** | Avatar Zoro (costo: 95 monedas) |
| **luffy.png** | Avatar Luffy (costo: 110 monedas) |

## 🎮 Características Principales

### 1. 🧮 Modo Calculadora
- Resuelve ecuaciones cuadráticas (formato: x^2-3x+2=0)
- Visualización gráfica interactiva de parábolas
- Muestra raíces, vértice y análisis completo
- Zoom y navegación en el gráfico

### 2. ❓ Modo Quiz
- 4 dificultades: Fácil, Normal, Difícil, Experto
- Generación infinita de preguntas sin repetir
- Avance automático al fallar (1.5 segundos)
- Recompensas por dificultad:
  - Fácil: +10 XP, +2 monedas
  - Normal: +25 XP, +5 monedas
  - Difícil: +50 XP, +10 monedas
  - Experto: +100 XP, +20 monedas

### 3. ∞ Modo Infinito
- Resuelve problemas continuamente
- Acumula rachas y XP
- Recompensas: +5 XP, +2 monedas por respuesta correcta
- Racha máxima registrada

### 4. ⚔️ Duelos Online
- Desafía a otros jugadores en tiempo real
- Temporizador de 60 segundos
- 5 problemas matemáticos aleatorios
- Puntuación competitiva
- Recompensas:
  - Ganador: +50 monedas, +50 XP
  - Segundo: +10 monedas, +20 XP
  - Empate: +25 monedas, +25 XP

### 5. 🌳 Árbol de Habilidades
- Gráfico radial (pentágono) con 5 estadísticas
- Ramas: Álgebra y Geometría (5 niveles cada una)
- Cada habilidad desbloquea bonificaciones
- Visualización de progreso en tiempo real

### 6. 🏆 Logros
- 20 logros desbloqueables
- Categorías: Misiones, Rachas, Niveles, Compras, Monedas, Dificultades

### 7. 🥇 Ranking Global
- Top 20 jugadores en tiempo real
- Podio visual para los 3 primeros
- Barra de progreso de XP
- Actualización en vivo con Firestore

### 8. 👤 Avatares
- 10 avatares disponibles
- Sistema de compra con monedas
- Cambio dinámico en tiempo real

## 🚀 Instalación y Uso

### En Navegador
1. Abre https://aventuras-numericas.firebaseapp.com
2. Crea una cuenta o inicia sesión
3. ¡Comienza a jugar!

### Como PWA (Instalable)

**En Móvil (Android/iOS):**
1. Abre la app en Chrome
2. Toca el menú (⋮) → "Instalar aplicación"
3. Confirma la instalación

**En PC (Windows/Mac/Linux):**
1. Abre en Chrome o Edge
2. Haz clic en el icono de instalación (esquina superior derecha)
3. Confirma la instalación

**En Tablet:**
- Mismo proceso que móvil

## 🔧 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore (base de datos)
- **PWA**: Service Worker, Web App Manifest
- **Gráficos**: Canvas API para gráficos radiales
- **Autenticación**: Firebase (simple username/password)

## 📊 Estadísticas de Jugador

Cada jugador tiene:
- **XP**: Experiencia acumulada
- **Nivel**: Calculado desde XP (100 XP por nivel)
- **Monedas**: Moneda del juego para compras
- **Racha**: Respuestas correctas consecutivas
- **Duelos Ganados**: Total de duelos victoriosos
- **Habilidades**: Árbol de habilidades desbloqueadas
- **Logros**: Insignias conseguidas
- **Avatares**: Personajes disponibles

## 🌍 SEO y Posicionamiento en Google

Para mejorar la visibilidad en Google:

1. **Meta Tags**: Incluidos en todas las páginas
2. **Schema.org**: Datos estructurados para juegos
3. **Sitemap**: XML con todas las rutas
4. **Robots.txt**: Directivas de indexación
5. **Open Graph**: Compartir en redes sociales

### Pasos para mejorar posicionamiento:

1. Registra el sitio en Google Search Console
2. Envía el sitemap: `/sitemap.xml`
3. Solicita indexación de páginas
4. Monitorea palabras clave: "aventuras numéricas", "juego matemáticas", "quiz educativo"
5. Genera backlinks desde blogs educativos

## 🔐 Seguridad

- Autenticación con Firebase
- Reglas de Firestore para proteger datos
- Service Worker para validación de caché
- Datos de usuario encriptados en tránsito

## 📱 Compatibilidad

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Android Chrome
- ✅ iOS Safari

## 🐛 Solución de Problemas

### Error de permisos en Firestore
- Verifica las reglas de Firestore en la consola de Firebase
- Asegúrate de que la colección "users" y "duels" existen

### Preguntas repetidas
- El sistema genera preguntas infinitas sin repetir (últimas 100)
- Si ves repetidas, recarga la página

### Duelos no funcionan
- Verifica que ambos jugadores estén autenticados
- Comprueba la conexión a internet
- Revisa la consola del navegador para errores

## 📞 Contacto y Soporte

Para reportar bugs o sugerencias, abre un issue en GitHub:
https://github.com/GSJhan/aventuras-numericas

## 📄 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo, modificarlo y distribuirlo.

---

**Versión**: 2.0  
**Última actualización**: 2026  
**Desarrollador**: GSJhan  
**Estado**: ✅ En desarrollo activo
