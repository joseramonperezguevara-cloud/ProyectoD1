/**
 * RunnerJS - Juego tipo dinosaurio de Google
 * Lógica principal del juego con canvas HTML5
 */

class RunnerGame {
    constructor() {
        // Elementos del DOM
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Elementos de la interfaz
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        
        // Elementos de puntuación
        this.currentScoreEl = document.getElementById('current-score');
        this.currentLevelEl = document.getElementById('current-level');
        this.highScoreEl = document.getElementById('high-score');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalLevelEl = document.getElementById('final-level');
        this.newRecordEl = document.getElementById('new-record');
        
        // Elementos del leaderboard
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.leaderboardLoading = document.getElementById('leaderboard-loading');
        this.leaderboardError = document.getElementById('leaderboard-error');
        
        // Estado del juego
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        this.lastTime = 0;
        this.animationId = null;
        
        // Configuración del juego
        this.config = {
            gravity: 0.6,
            jumpPower: -12,
            gameSpeed: 4,
            groundHeight: 50,
            playerSize: { width: 40, height: 40 },
            obstacleWidth: 20,
            obstacleMinHeight: 30,
            obstacleMaxHeight: 80,
            obstacleSpacing: 300,
            scoreIncrement: 1,
            levelThreshold: 500 // Puntos necesarios para subir de nivel
        };
        
        // Jugador
        this.player = {
            x: 100,
            y: 0,
            width: this.config.playerSize.width,
            height: this.config.playerSize.height,
            velocityY: 0,
            isJumping: false,
            color: '#f6d70fff'
        };
        
        // Obstáculos
        this.obstacles = [];
        this.lastObstacleX = this.canvas.width;
        
        // Puntuación y nivel
        this.score = 0;
        this.level = 1;
        this.highScore = this.getHighScore();
        
        // Efectos visuales
        this.particles = [];
        this.groundOffset = 0;
        
        // Audio (simulado con beeps de Web Audio API)
        this.audioContext = null;
        this.soundEnabled = true;
        
        this.init();
    }

    /**
     * Inicialización del juego
     */
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupAudio();
        this.resetPlayer();
        this.loadLeaderboard();
        this.updateUI();
        
        console.log('Juego inicializado');
    }

    /**
     * Configuración del canvas
     */
    setupCanvas() {
        // Ajustar el canvas para pantallas de alta densidad
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // Establecer el tamaño visual
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Actualizar posición del suelo
        this.groundY = this.canvas.height / dpr - this.config.groundHeight;
        this.player.y = this.groundY - this.player.height;
    }

    /**
     * Configuración de event listeners
     */
    setupEventListeners() {
        // Controles del juego
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Click en canvas para saltar
        this.canvas.addEventListener('click', () => this.jump());
        
        // Botones de la interfaz
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('menu-btn').addEventListener('click', () => this.showStartScreen());
        
        // Botones de sonido y pantalla completa
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
        
        // Leaderboard
        document.getElementById('save-btn').addEventListener('click', () => this.saveScore());
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('refresh-leaderboard').addEventListener('click', () => this.loadLeaderboard());
        document.getElementById('clear-local-scores').addEventListener('click', () => this.clearLocalScores());
        document.getElementById('retry-leaderboard').addEventListener('click', () => this.loadLeaderboard());
        
        // Redimensionamiento de ventana
        window.addEventListener('resize', () => this.setupCanvas());
        
        // Prevenir scroll con espacio
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
            }
        });
    }

    /**
     * Configuración de audio
     */
    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API no disponible');
            this.soundEnabled = false;
        }
    }

    /**
     * Manejo de teclas presionadas
     */
    handleKeyDown(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.jump();
                break;
            case 'KeyP':
                this.togglePause();
                break;
            case 'Escape':
                if (this.gameState === 'playing') {
                    this.togglePause();
                } else if (this.gameState === 'paused') {
                    this.showStartScreen();
                }
                break;
        }
    }

    /**
     * Manejo de teclas liberadas
     */
    handleKeyUp(e) {
        // Reservado para futuras funcionalidades
    }

    /**
     * Salto del jugador
     */
    jump() {
        if (this.gameState === 'start') {
            this.startGame();
            return;
        }
        
        if (this.gameState === 'playing' && !this.player.isJumping) {
            this.player.velocityY = this.config.jumpPower;
            this.player.isJumping = true;
            this.playSound('jump');
        }
    }

    /**
     * Iniciar el juego
     */
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.obstacles = [];
        this.particles = [];
        this.lastObstacleX = this.canvas.width;
        
        this.resetPlayer();
        this.hideAllOverlays();
        this.updateUI();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.gameLoop();
        this.playSound('start');
        
        console.log('Juego iniciado');
    }

    /**
     * Reiniciar el juego
     */
    restartGame() {
        this.startGame();
    }

    /**
     * Pausar/reanudar juego
     */
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.pauseScreen.classList.remove('hidden');
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.pauseScreen.classList.add('hidden');
            this.gameLoop();
        }
    }

    /**
     * Mostrar pantalla de inicio
     */
    showStartScreen() {
        this.gameState = 'start';
        this.hideAllOverlays();
        this.startScreen.classList.remove('hidden');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    /**
     * Game Over
     */
    gameOver() {
        this.gameState = 'gameOver';
        this.playSound('gameOver');
        
        // Actualizar high score si es necesario
        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
            this.highScore = this.score;
            this.saveHighScore();
            this.newRecordEl.classList.remove('hidden');
        } else {
            this.newRecordEl.classList.add('hidden');
        }
        
        // Mostrar estadísticas finales
        this.finalScoreEl.textContent = ScoreAPI.formatScore(this.score);
        this.finalLevelEl.textContent = this.level;
        
        // Mostrar pantalla de game over
        this.gameOverScreen.classList.remove('hidden');
        
        // Enfocar el input del nombre
        document.getElementById('player-name').focus();
        
        console.log(`Game Over - Puntuación: ${this.score}, Nivel: ${this.level}`);
    }

    /**
     * Loop principal del juego
     */
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Actualización de la lógica del juego
     */
    update(deltaTime) {
        this.updatePlayer(deltaTime);
        this.updateObstacles();
        this.updateParticles(deltaTime);
        this.updateScore();
        this.updateLevel();
        this.checkCollisions();
        
        // Actualizar efectos visuales
        this.groundOffset += this.getCurrentGameSpeed() * 0.5;
        if (this.groundOffset > 20) this.groundOffset = 0;
    }

    /**
     * Actualización del jugador
     */
    updatePlayer(deltaTime) {
        // Aplicar gravedad
        this.player.velocityY += this.config.gravity;
        this.player.y += this.player.velocityY;
        
        // Verificar si está en el suelo
        const groundY = this.groundY - this.player.height;
        if (this.player.y >= groundY) {
            this.player.y = groundY;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
    }

    /**
     * Actualización de obstáculos
     */
    updateObstacles() {
        const gameSpeed = this.getCurrentGameSpeed();
        
        // Mover obstáculos existentes
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= gameSpeed;
            
            // Eliminar obstáculos que salieron de pantalla
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Generar nuevos obstáculos
        const lastObstacle = this.obstacles[this.obstacles.length - 1];
        const shouldSpawn = !lastObstacle || 
            (this.canvas.width - lastObstacle.x) >= this.getObstacleSpacing();
        
        if (shouldSpawn) {
            this.spawnObstacle();
        }
    }

    /**
     * Generar un nuevo obstáculo
     */
    spawnObstacle() {
        const minHeight = this.config.obstacleMinHeight;
        const maxHeight = this.config.obstacleMaxHeight + (this.level * 10);
        const height = minHeight + Math.random() * (maxHeight - minHeight);
        
        const obstacle = {
            x: this.canvas.width,
            y: this.groundY - height,
            width: this.config.obstacleWidth,
            height: height,
            color: '#2C3E50',
            scored: false
        };
        
        this.obstacles.push(obstacle);
    }

    /**
     * Obtener espaciado entre obstáculos basado en el nivel
     */
    getObstacleSpacing() {
        const baseSpacing = this.config.obstacleSpacing;
        const reduction = Math.min(this.level * 20, 150); // Máximo 150px de reducción
        return Math.max(baseSpacing - reduction, 200); // Mínimo 200px
    }

    /**
     * Obtener velocidad actual del juego
     */
    getCurrentGameSpeed() {
        const speedIncrease = Math.floor(this.level / 2) * 0.5;
        return this.config.gameSpeed + speedIncrease;
    }

    /**
     * Actualización de partículas (efectos visuales)
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.2; // Gravedad ligera
            particle.life -= deltaTime * 0.001;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Actualización de puntuación
     */
    updateScore() {
        this.score += this.config.scoreIncrement;
        
        // Puntos extra por obstáculos superados
        this.obstacles.forEach(obstacle => {
            if (!obstacle.scored && obstacle.x + obstacle.width < this.player.x) {
                obstacle.scored = true;
                this.score += 10;
                this.createParticles(this.player.x, this.player.y, '#51CF66');
            }
        });
        
        this.updateUI();
    }

    /**
     * Actualización de nivel
     */
    updateLevel() {
        const newLevel = Math.floor(this.score / this.config.levelThreshold) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.playSound('levelUp');
            this.createParticles(this.player.x, this.player.y - 20, '#FFD43B');
            console.log(`¡Nivel ${this.level} alcanzado!`);
        }
    }

    /**
     * Verificación de colisiones
     */
    checkCollisions() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };
        
        for (const obstacle of this.obstacles) {
            const obstacleRect = {
                x: obstacle.x,
                y: obstacle.y,
                width: obstacle.width,
                height: obstacle.height
            };
            
            if (this.isColliding(playerRect, obstacleRect)) {
                this.createParticles(this.player.x, this.player.y, '#fce732de');
                this.gameOver();
                return;
            }
        }
    }

    /**
     * Detección de colisión entre dos rectángulos
     */
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * Crear partículas para efectos visuales
     */
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + this.player.width / 2,
                y: y + this.player.height / 2,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                color: color,
                life: 1.0
            });
        }
    }

    /**
     * Renderizado del juego
     */
    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fondo con gradiente
        this.renderBackground();
        
        // Suelo
        this.renderGround();
        
        // Obstáculos
        this.renderObstacles();
        
        // Jugador
        this.renderPlayer();
        
        // Partículas
        this.renderParticles();
        
        // Información en pantalla
        this.renderHUD();
    }

    /**
     * Renderizar fondo
     */
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Nubes simples
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            const x = (i * 200 + this.groundOffset * 0.2) % (this.canvas.width + 50);
            this.renderCloud(x, 50 + i * 30);
        }
    }

    /**
     * Renderizar una nube
     */
    renderCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Renderizar suelo
     */
    renderGround() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.config.groundHeight);
        
        // Textura del suelo
        this.ctx.fillStyle = '#A0522D';
        for (let x = -this.groundOffset; x < this.canvas.width; x += 20) {
            this.ctx.fillRect(x, this.groundY + 10, 10, 5);
        }
    }

    /**
     * Renderizar obstáculos
     */
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            // Sombra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(
                obstacle.x + 2,
                obstacle.y + 2,
                obstacle.width,
                obstacle.height
            );
            
            // Obstáculo principal
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Borde superior
            this.ctx.fillStyle = '#34495E';
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 3);
        });
    }

    /**
     * Renderizar jugador
     */
    renderPlayer() {
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        
        // Sombra del jugador
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(
            this.player.x + 2,
            this.groundY - 5,
            this.player.width,
            5
        );
        
        // Cuerpo del dinosaurio (simplificado)
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Detalles del dinosaurio
        this.ctx.fillStyle = '#eae7e7ff';
        // Cabeza
        this.ctx.fillRect(this.player.x + 25, this.player.y, 15, 15);
        // Cola
        this.ctx.fillRect(this.player.x, this.player.y + 15, 20, 10);
        
        // Ojo
        this.ctx.fillStyle = '#0a0101ff';
        this.ctx.fillRect(this.player.x + 30, this.player.y + 3, 6, 6);
        this.ctx.fillStyle = '#000000ff';
        this.ctx.fillRect(this.player.x + 32, this.player.y + 5, 2, 2);
        
        // Patas (animación simple)
        this.ctx.fillStyle = this.player.color;
        const legOffset = Math.sin(Date.now() * 0.01) * 2;
        this.ctx.fillRect(this.player.x + 8, this.player.y + 30, 6, 10 + legOffset);
        this.ctx.fillRect(this.player.x + 18, this.player.y + 30, 6, 10 - legOffset);
    }

    /**
     * Renderizar partículas
     */
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            this.ctx.restore();
        });
    }

    /**
     * Renderizar HUD en pantalla
     */
    renderHUD() {
        if (this.gameState === 'playing') {
            // Barra de progreso del nivel
            const levelProgress = (this.score % this.config.levelThreshold) / this.config.levelThreshold;
            const barWidth = 200;
            const barHeight = 10;
            const barX = this.canvas.width - barWidth - 20;
            const barY = 20;
            
            // Fondo de la barra
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Progreso
            this.ctx.fillStyle = '#51CF66';
            this.ctx.fillRect(barX, barY, barWidth * levelProgress, barHeight);
            
            // Texto del progreso
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Nivel ${this.level}`, barX + barWidth, barY - 5);
        }
    }

    /**
     * Resetear posición del jugador
     */
    resetPlayer() {
        this.player.y = this.groundY - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
    }

    /**
     * Ocultar todas las pantallas overlay
     */
    hideAllOverlays() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
    }

    /**
     * Actualizar interfaz de usuario
     */
    updateUI() {
        this.currentScoreEl.textContent = ScoreAPI.formatScore(this.score);
        this.currentLevelEl.textContent = this.level;
        this.highScoreEl.textContent = ScoreAPI.formatScore(this.highScore);
    }

    /**
     * Reproducir sonido
     */
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch (type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'gameOver':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
            case 'levelUp':
                oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
        }
    }

    /**
     * Alternar sonido
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('sound-btn');
        soundBtn.textContent = this.soundEnabled ? '🔊 Sonido' : '🔇 Sonido';
        
        if (this.soundEnabled && !this.audioContext) {
            this.setupAudio();
        }
    }

    /**
     * Alternar pantalla completa
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('No se pudo activar pantalla completa:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Guardar puntuación
     */
    async saveScore() {
        const playerNameInput = document.getElementById('player-name');
        const saveBtn = document.getElementById('save-btn');
        const playerName = playerNameInput.value.trim();
        
        // Validar datos
        const validation = ScoreAPI.validateScoreData(playerName, this.score, this.level);
        if (!validation.isValid) {
            alert('Error: ' + validation.errors.join('\n'));
            return;
        }
        
        // Mostrar estado de carga
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
        
        try {
            const result = await scoreAPI.saveScore(playerName, this.score, this.level);
            
            if (result.success) {
                // Mostrar mensaje de éxito
                saveBtn.textContent = result.source === 'server' ? 
                    '✓ Guardado en servidor' : '✓ Guardado localmente';
                
                // Actualizar leaderboard
                this.loadLeaderboard();
                
                // Limpiar formulario
                playerNameInput.value = '';
                
                console.log('Puntuación guardada:', result);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Error al guardar puntuación:', error);
            saveBtn.textContent = '✗ Error al guardar';
        }
        
        // Restaurar botón después de 2 segundos
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Puntuación';
        }, 2000);
    }

    /**
     * Cargar y mostrar leaderboard
     */
    async loadLeaderboard() {
        const loadingEl = this.leaderboardLoading;
        const errorEl = this.leaderboardError;
        const listEl = this.leaderboardList;
        
        // Mostrar loading
        loadingEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        listEl.innerHTML = '';
        
        try {
            const result = await scoreAPI.getLeaderboard(10);
            
            if (result.success) {
                this.renderLeaderboard(result.data);
                
                if (result.source === 'localStorage') {
                    console.warn('Leaderboard cargado desde localStorage');
                }
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Error al cargar leaderboard:', error);
            errorEl.classList.remove('hidden');
        } finally {
            loadingEl.classList.add('hidden');
        }
    }

    /**
     * Renderizar leaderboard en HTML
     */
    renderLeaderboard(scores) {
        const listEl = this.leaderboardList;
        
        if (!scores || scores.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: #666;">No hay puntuaciones registradas</p>';
            return;
        }
        
        listEl.innerHTML = scores.map((score, index) => {
            const rank = index + 1;
            let rankClass = '';
            let rankIcon = rank;
            
            if (rank === 1) { rankClass = 'gold'; rankIcon = '🥇'; }
            else if (rank === 2) { rankClass = 'silver'; rankIcon = '🥈'; }
            else if (rank === 3) { rankClass = 'bronze'; rankIcon = '🥉'; }
            
            const isLocal = score.isLocal ? ' 📱' : '';
            const date = score.timestamp ? ScoreAPI.formatDate(score.timestamp) : '';
            
            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${rankIcon}</div>
                    <div class="leaderboard-player">
                        <span class="name">${score.playerName}${isLocal}</span>
                        <span class="level">Nivel ${score.level} • ${date}</span>
                    </div>
                    <div class="leaderboard-score">${ScoreAPI.formatScore(score.score)}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Mostrar leaderboard (scrollear hacia él)
     */
    showLeaderboard() {
        document.querySelector('.leaderboard-section').scrollIntoView({
            behavior: 'smooth'
        });
    }

    /**
     * Limpiar puntuaciones locales
     */
    clearLocalScores() {
        if (confirm('¿Estás seguro de que quieres eliminar todas las puntuaciones locales?')) {
            const success = scoreAPI.clearLocalScores();
            if (success) {
                this.loadLeaderboard();
                alert('Puntuaciones locales eliminadas');
            } else {
                alert('Error al eliminar puntuaciones locales');
            }
        }
    }

    /**
     * Obtener high score desde localStorage
     */
    getHighScore() {
        try {
            return parseInt(localStorage.getItem('runnerjs-highscore') || '0');
        } catch (error) {
            return 0;
        }
    }

    /**
     * Guardar high score en localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('runnerjs-highscore', this.highScore.toString());
        } catch (error) {
            console.warn('No se pudo guardar el high score');
        }
    }
}

// Inicializar juego cuando se carga la página
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando RunnerJS...');
    game = new RunnerGame();
});

// Exportar para uso en módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RunnerGame };
}