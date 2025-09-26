/**
 * Cliente API para manejar las puntuaciones del juego
 * Incluye fallback a localStorage cuando la API no esté disponible
 */

class ScoreAPI {
    constructor() {
        // URL base de la API (cambiar cuando despliegues el backend)
        this.baseURL = 'http://localhost:3000/api';
        this.localStorageKey = 'runnerjs-scores';
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
    }

    /**
     * Realiza una petición HTTP con reintentos
     */
    async fetchWithRetry(url, options = {}, retries = this.maxRetries) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn(`Intento fallido: ${error.message}`);
            
            if (retries > 0) {
                console.log(`Reintentando en ${this.retryDelay}ms... (${retries} intentos restantes)`);
                await this.delay(this.retryDelay);
                return this.fetchWithRetry(url, options, retries - 1);
            }
            
            throw error;
        }
    }

    /**
     * Delay helper para reintentos
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Guarda una puntuación en el servidor
     */
    async saveScore(playerName, score, level) {
        const scoreData = {
            playerName: playerName.trim(),
            score: parseInt(score),
            level: parseInt(level),
            timestamp: new Date().toISOString()
        };

        try {
            console.log('Intentando guardar puntuación en servidor...', scoreData);
            
            const result = await this.fetchWithRetry(`${this.baseURL}/scores`, {
                method: 'POST',
                body: JSON.stringify(scoreData)
            });

            console.log('Puntuación guardada en servidor:', result);
            return { success: true, data: result, source: 'server' };

        } catch (error) {
            console.error('Error al guardar en servidor:', error.message);
            console.log('Guardando en localStorage como respaldo...');
            
            // Fallback a localStorage
            try {
                this.saveScoreLocally(scoreData);
                return { 
                    success: true, 
                    data: scoreData, 
                    source: 'localStorage',
                    message: 'Guardado localmente (servidor no disponible)'
                };
            } catch (localError) {
                console.error('Error al guardar localmente:', localError);
                return { 
                    success: false, 
                    error: 'No se pudo guardar la puntuación',
                    source: 'none'
                };
            }
        }
    }

    /**
     * Obtiene las mejores puntuaciones
     */
    async getLeaderboard(limit = 10) {
        try {
            console.log('Obteniendo leaderboard del servidor...');
            
            const result = await this.fetchWithRetry(`${this.baseURL}/scores?limit=${limit}`);
            console.log('Leaderboard obtenido del servidor:', result);
            
            return { 
                success: true, 
                data: result.scores || result, 
                source: 'server' 
            };

        } catch (error) {
            console.error('Error al obtener leaderboard del servidor:', error.message);
            console.log('Obteniendo leaderboard local...');
            
            try {
                const localScores = this.getLocalScores(limit);
                return { 
                    success: true, 
                    data: localScores, 
                    source: 'localStorage',
                    message: 'Datos locales (servidor no disponible)'
                };
            } catch (localError) {
                console.error('Error al obtener puntuaciones locales:', localError);
                return { 
                    success: false, 
                    error: 'No se pudieron cargar las puntuaciones',
                    source: 'none'
                };
            }
        }
    }

    /**
     * Guarda puntuación en localStorage
     */
    saveScoreLocally(scoreData) {
        let scores = this.getLocalScores(100); // Mantener hasta 100 scores locales
        
        scores.push({
            ...scoreData,
            id: Date.now() + Math.random(), // ID único temporal
            isLocal: true
        });

        // Ordenar por puntuación descendente
        scores.sort((a, b) => b.score - a.score);

        // Mantener solo los mejores 100
        scores = scores.slice(0, 100);

        localStorage.setItem(this.localStorageKey, JSON.stringify(scores));
        console.log('Puntuación guardada localmente');
    }

    /**
     * Obtiene puntuaciones de localStorage
     */
    getLocalScores(limit = 10) {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            const scores = stored ? JSON.parse(stored) : [];
            
            // Ordenar por puntuación y devolver solo el límite solicitado
            return scores
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error al leer localStorage:', error);
            return [];
        }
    }

    /**
     * Limpia las puntuaciones locales
     */
    clearLocalScores() {
        try {
            localStorage.removeItem(this.localStorageKey);
            console.log('Puntuaciones locales eliminadas');
            return true;
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
            return false;
        }
    }

    /**
     * Sincroniza puntuaciones locales con el servidor
     */
    async syncLocalScores() {
        const localScores = this.getLocalScores(100);
        const localOnlyScores = localScores.filter(score => score.isLocal);
        
        if (localOnlyScores.length === 0) {
            console.log('No hay puntuaciones locales para sincronizar');
            return { success: true, synced: 0 };
        }

        console.log(`Sincronizando ${localOnlyScores.length} puntuaciones locales...`);
        
        let syncedCount = 0;
        const errors = [];

        for (const score of localOnlyScores) {
            try {
                await this.fetchWithRetry(`${this.baseURL}/scores`, {
                    method: 'POST',
                    body: JSON.stringify({
                        playerName: score.playerName,
                        score: score.score,
                        level: score.level,
                        timestamp: score.timestamp
                    })
                });
                syncedCount++;
            } catch (error) {
                errors.push({ score, error: error.message });
            }
        }

        console.log(`Sincronización completada: ${syncedCount} exitosas, ${errors.length} errores`);
        
        return {
            success: errors.length === 0,
            synced: syncedCount,
            errors: errors
        };
    }

    /**
     * Verifica si la API está disponible
     */
    async checkServerStatus() {
        try {
            await this.fetchWithRetry(`${this.baseURL}/health`, {}, 1);
            return { available: true, message: 'Servidor disponible' };
        } catch (error) {
            return { available: false, message: error.message };
        }
    }

    /**
     * Obtiene estadísticas del jugador local
     */
    getPlayerStats() {
        const scores = this.getLocalScores(1000);
        
        if (scores.length === 0) {
            return {
                totalGames: 0,
                bestScore: 0,
                bestLevel: 0,
                averageScore: 0,
                totalPlayTime: 0
            };
        }

        const bestScore = Math.max(...scores.map(s => s.score));
        const bestLevel = Math.max(...scores.map(s => s.level));
        const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

        return {
            totalGames: scores.length,
            bestScore,
            bestLevel,
            averageScore: Math.round(averageScore),
            recentGames: scores.slice(0, 5)
        };
    }

    /**
     * Formatea una puntuación para mostrar
     */
    static formatScore(score) {
        return score.toLocaleString();
    }

    /**
     * Formatea una fecha para mostrar
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Hoy';
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Valida los datos de puntuación
     */
    static validateScoreData(playerName, score, level) {
        const errors = [];

        if (!playerName || playerName.trim().length === 0) {
            errors.push('El nombre del jugador es requerido');
        }

        if (playerName.trim().length > 20) {
            errors.push('El nombre no puede tener más de 20 caracteres');
        }

        if (!/^[a-zA-Z0-9\s_-]+$/.test(playerName.trim())) {
            errors.push('El nombre solo puede contener letras, números, espacios, guiones y guiones bajos');
        }

        if (!Number.isInteger(score) || score < 0) {
            errors.push('La puntuación debe ser un número entero positivo');
        }

        if (!Number.isInteger(level) || level < 1) {
            errors.push('El nivel debe ser un número entero mayor a 0');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Crear instancia global de la API
const scoreAPI = new ScoreAPI();

// Exportar para uso en módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScoreAPI, scoreAPI };
}

console.log('ScoreAPI inicializada');