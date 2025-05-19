// effects.js - Handles visual and audio effects for the game

class Effects {
    constructor(game) {
        this.game = game;
        this.particles = [];
        this.maxParticles = 100; // Increased for dimension shifts
        
        // Dimension shift effects
        this.dimensionShiftEffects = {
            flashAlpha: 0,
            waveRadius: 0,
            waveWidth: 2,
            particleCount: 0
        };
        
        // Audio context for sound effects (initialized on first user interaction)
        this.audioContext = null;
        this.sounds = {};
        
        // Preload sounds when possible
        this.initAudio();
    }
    
    // Initialize audio context (must be called after user interaction)
    initAudio() {
        // Create audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.loadSounds();
            }
        }, { once: true });
        
        // Also try on touch
        document.addEventListener('touchstart', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.loadSounds();
            }
        }, { once: true });
    }
    
    // Load sound effects
    loadSounds() {
        if (!this.audioContext) return;
        
        // Simple oscillator-based sound effects
        this.sounds = {
            hit: {
                play: () => this.playOscillator(220, 'triangle', 0.1)
            },
            break: {
                play: () => this.playOscillator(440, 'square', 0.1)
            },
            'dimension-shift': {
                play: () => {
                    // Create a complex sound for dimension shift
                    this.playOscillator(220, 'sine', 0.5, 0.1);
                    setTimeout(() => this.playOscillator(330, 'sine', 0.5, 0.1), 100);
                    setTimeout(() => this.playOscillator(440, 'sine', 0.5, 0.1), 200);
                    setTimeout(() => this.playOscillator(880, 'sine', 0.7, 0.2), 300);
                }
            }
        };
    }
    
    // Play a simple oscillator sound
    playOscillator(frequency, type, duration, volume = 0.2) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        
        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(
            0.001, this.audioContext.currentTime + duration
        );
        
        // Stop after duration
        setTimeout(() => {
            oscillator.stop();
        }, duration * 1000);
    }
    
    // Create brick break effect
    createBrickBreakEffect(x, y, color) {
        // Create particles when a brick breaks
        const particleCount = this.game.currentDimension === 'timeWarp' ? 12 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            const speed = this.game.currentDimension === 'reverseGravity' ? 4 : 3;
            
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * speed,
                dy: (Math.random() - 0.5) * speed,
                radius: Math.random() * 3 + 1,
                color: color,
                alpha: 1,
                life: this.getDimensionParticleLife(),
                type: 'brick'
            });
        }
        
        // Remove excess particles
        this.limitParticles();
    }
    
    // Create dimension shift effect
    createDimensionShiftEffect(fromDimension, toDimension) {
        // Flash effect
        this.dimensionShiftEffects.flashAlpha = 0.8;
        
        // Wave effect
        this.dimensionShiftEffects.waveRadius = 0;
        
        // Create particles for dimension shift
        const centerX = this.game.CANVAS_WIDTH / 2;
        const centerY = this.game.CANVAS_HEIGHT / 2;
        const fromColor = this.game.dimensions[fromDimension].backgroundColor;
        const toColor = this.game.dimensions[toDimension].backgroundColor;
        
        // Create particles emanating from center
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const speed = Math.random() * 2 + 3;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? fromColor : toColor,
                alpha: 1,
                life: 60,
                type: 'dimension'
            });
        }
        
        // Create background particles
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * this.game.CANVAS_WIDTH,
                y: Math.random() * this.game.CANVAS_HEIGHT,
                dx: (Math.random() - 0.5) * 1,
                dy: (Math.random() - 0.5) * 1,
                radius: Math.random() * 2 + 1,
                color: toColor,
                alpha: Math.random() * 0.5 + 0.5,
                life: 40 + Math.random() * 20,
                type: 'background'
            });
        }
        
        // Remove excess particles
        this.limitParticles();
    }
    
    // Get particle lifespan based on current dimension
    getDimensionParticleLife() {
        const dimProps = this.game.getCurrentDimensionProps();
        if (typeof dimProps.particleLifespan === 'function') {
            return dimProps.particleLifespan();
        }
        return dimProps.particleLifespan || 30;
    }
    
    // Limit the number of particles to prevent performance issues
    limitParticles() {
        if (this.particles.length > this.maxParticles) {
            // Remove oldest particles first, but prioritize keeping dimension particles
            const excess = this.particles.length - this.maxParticles;
            
            // First try to remove brick particles
            const brickParticles = this.particles.filter(p => p.type === 'brick');
            if (brickParticles.length >= excess) {
                // Sort by life (remove those with least life first)
                this.particles.sort((a, b) => {
                    if (a.type === 'brick' && b.type !== 'brick') return -1;
                    if (a.type !== 'brick' && b.type === 'brick') return 1;
                    return a.life - b.life;
                });
                this.particles.splice(0, excess);
            } else {
                // Remove all types, but prioritize keeping dimension particles
                this.particles.sort((a, b) => {
                    if (a.type === 'dimension' && b.type !== 'dimension') return 1;
                    if (a.type !== 'dimension' && b.type === 'dimension') return -1;
                    return a.life - b.life;
                });
                this.particles.splice(0, excess);
            }
        }
    }
    
    // Update particle effects
    update() {
        // Get current dimension properties
        const dimProps = this.game.getCurrentDimensionProps();
        
        // Update time warp factor for particle movement
        let timeWarpFactor = 1;
        if (typeof dimProps.timeWarpFactor === 'function') {
            timeWarpFactor = dimProps.timeWarpFactor();
        } else {
            timeWarpFactor = dimProps.timeWarpFactor;
        }
        
        // Update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Move particle with time warp factor
            p.x += p.dx * timeWarpFactor;
            p.y += p.dy * timeWarpFactor;
            
            // Apply gravity effect for certain dimensions
            if (this.game.currentDimension === 'reverseGravity' && p.type === 'brick') {
                p.dy -= 0.05; // Particles float upward
            } else if (p.type === 'brick') {
                p.dy += 0.05; // Normal gravity
            }
            
            // Reduce life and alpha
            p.life -= timeWarpFactor;
            p.alpha = p.life / (p.type === 'dimension' ? 60 : this.getDimensionParticleLife());
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                i--;
            }
        }
        
        // Update dimension shift effects
        if (this.dimensionShiftEffects.flashAlpha > 0) {
            this.dimensionShiftEffects.flashAlpha -= 0.05;
        }
        
        if (this.dimensionShiftEffects.waveRadius < this.game.CANVAS_WIDTH * 1.5) {
            this.dimensionShiftEffects.waveRadius += 10;
        }
    }
    
    // Render particle effects
    render(ctx) {
        // Render dimension-specific background effects
        this.renderDimensionBackgroundEffects(ctx);
        
        // Render particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            
            if (p.type === 'dimension') {
                // Star-shaped particles for dimension shifts
                const spikes = 5;
                const outerRadius = p.radius;
                const innerRadius = p.radius / 2;
                
                for (let j = 0; j < spikes * 2; j++) {
                    const radius = j % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (j / (spikes * 2)) * Math.PI * 2;
                    const x = p.x + Math.cos(angle) * radius;
                    const y = p.y + Math.sin(angle) * radius;
                    
                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.closePath();
                ctx.fillStyle = p.color;
                ctx.fill();
            } else {
                // Regular circular particles
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }
            
            ctx.closePath();
        }
        
        // Render dimension shift flash effect
        if (this.dimensionShiftEffects.flashAlpha > 0) {
            ctx.globalAlpha = this.dimensionShiftEffects.flashAlpha;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, this.game.CANVAS_WIDTH, this.game.CANVAS_HEIGHT);
        }
        
        // Render dimension shift wave effect
        if (this.dimensionShiftEffects.waveRadius > 0 && 
            this.dimensionShiftEffects.waveRadius < this.game.CANVAS_WIDTH * 1.5) {
            
            ctx.globalAlpha = 0.7 - (this.dimensionShiftEffects.waveRadius / (this.game.CANVAS_WIDTH * 1.5));
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = this.dimensionShiftEffects.waveWidth;
            
            ctx.beginPath();
            ctx.arc(
                this.game.CANVAS_WIDTH / 2, 
                this.game.CANVAS_HEIGHT / 2, 
                this.dimensionShiftEffects.waveRadius, 
                0, 
                Math.PI * 2
            );
            ctx.stroke();
        }
        
        // Reset global alpha
        ctx.globalAlpha = 1;
    }
    
    // Render dimension-specific background effects
    renderDimensionBackgroundEffects(ctx) {
        const currentDim = this.game.currentDimension;
        
        if (currentDim === 'timeWarp') {
            // Time warp ripple effect
            const time = Date.now() / 1000;
            const centerX = this.game.CANVAS_WIDTH / 2;
            const centerY = this.game.CANVAS_HEIGHT / 2;
            
            for (let i = 0; i < 3; i++) {
                const radius = ((time * (i + 1) * 20) % 200);
                
                ctx.globalAlpha = 0.1 * (1 - radius / 200);
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (currentDim === 'reverseGravity') {
            // Reverse gravity floating particles
            ctx.globalAlpha = 0.2;
            
            for (let i = 0; i < 10; i++) {
                const x = (Math.sin(Date.now() / 1000 + i) * 0.5 + 0.5) * this.game.CANVAS_WIDTH;
                const y = ((Date.now() / 5000 + i / 10) % 1) * this.game.CANVAS_HEIGHT;
                
                ctx.fillStyle = '#FF88FF';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Reset global alpha
        ctx.globalAlpha = 1;
    }
    
    // Play sound effect
    playSound(type) {
        if (this.sounds[type] && this.audioContext) {
            this.sounds[type].play();
        } else {
            // Fallback console log if audio not initialized
            console.log(`Sound effect: ${type}`);
        }
    }
}