// Visual and audio effects for Brick Breaker game
(function() {
    // Effect settings
    const effectSettings = {
        transitionDuration: 500, // ms
        particleCount: 20,
        maxParticleSize: 4
    };
    
    // Dimension themes
    const dimensionThemes = {
        normal: {
            background: '#000',
            ballColor: '#FFF',
            paddleColor: '#0095DD',
            textColor: '#FFF',
            particleColors: ['#FFF', '#0095DD', '#FF4081']
        },
        reverse: {
            background: '#001133',
            ballColor: '#FFCC00',
            paddleColor: '#FF4081',
            textColor: '#FFCC00',
            particleColors: ['#FFCC00', '#FF4081', '#00FFFF']
        },
        time: {
            background: '#220033',
            ballColor: '#00FFFF',
            paddleColor: '#FFCC00',
            textColor: '#00FFFF',
            particleColors: ['#00FFFF', '#FFCC00', '#FF00FF']
        }
    };
    
    // Particles array for effects
    let particles = [];
    
    // Create a dimensional shift transition effect
    function createDimensionShiftEffect(canvas, ctx, fromDimension, toDimension) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Create a snapshot of the current canvas
        const snapshot = ctx.getImageData(0, 0, width, height);
        
        // Start time for animation
        const startTime = Date.now();
        
        // Create particles for the transition effect
        createParticles(width, height, dimensionThemes[toDimension].particleColors);
        
        // Return an animation function that will be called each frame
        return function animateTransition() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / effectSettings.transitionDuration);
            
            // Clear the canvas
            ctx.clearRect(0, 0, width, height);
            
            // Draw fading snapshot
            ctx.globalAlpha = 1 - progress;
            ctx.putImageData(snapshot, 0, 0);
            ctx.globalAlpha = 1;
            
            // Draw particles
            updateAndDrawParticles(ctx, progress);
            
            // Apply color overlay for new dimension
            ctx.globalAlpha = progress * 0.5;
            ctx.fillStyle = dimensionThemes[toDimension].background;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
            
            // Return true if animation is complete
            return progress >= 1;
        };
    }
    
    // Create particles for effects
    function createParticles(width, height, colors) {
        particles = [];
        
        for (let i = 0; i < effectSettings.particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 1 + Math.random() * effectSettings.maxParticleSize,
                speedX: -2 + Math.random() * 4,
                speedY: -2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }
    
    // Update and draw particles
    function updateAndDrawParticles(ctx, progress) {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // Update position
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 + progress), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.closePath();
        }
    }
    
    // Create brick break effect
    function createBrickBreakEffect(ctx, brick) {
        const particleCount = 10;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: brick.x + brick.width / 2,
                y: brick.y + brick.height / 2,
                size: 1 + Math.random() * 2,
                speedX: -3 + Math.random() * 6,
                speedY: -3 + Math.random() * 6,
                color: brick.color,
                life: 1.0
            });
        }
        
        // Return animation function
        return function animateBrickBreak() {
            let isActive = false;
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                if (p.life > 0) {
                    isActive = true;
                    
                    // Update position
                    p.x += p.speedX;
                    p.y += p.speedY;
                    p.life -= 0.05;
                    
                    // Draw particle
                    ctx.globalAlpha = p.life;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    ctx.closePath();
                    ctx.globalAlpha = 1;
                }
            }
            
            return !isActive; // Return true when animation is complete
        };
    }
    
    // Create power-up effect
    function createPowerUpEffect(ctx, x, y, color) {
        const startTime = Date.now();
        const duration = 500;
        
        // Return animation function
        return function animatePowerUp() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            const radius = 20 * progress;
            const alpha = 1 - progress;
            
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
            ctx.globalAlpha = 1;
            
            return progress >= 1;
        };
    }
    
    // Active animations array
    let activeAnimations = [];
    
    // Update all active animations
    function updateAnimations(ctx) {
        // Filter out completed animations
        activeAnimations = activeAnimations.filter(animation => {
            const isComplete = animation(ctx);
            return !isComplete;
        });
    }
    
    // Add a new animation to the active list
    function addAnimation(animation) {
        activeAnimations.push(animation);
    }
    
    // Apply dimension theme to game objects
    function applyDimensionTheme(dimension, game, ball, paddle, COLORS) {
        const theme = dimensionThemes[dimension];
        
        // Update colors
        COLORS.BACKGROUND = theme.background;
        COLORS.BALL = theme.ballColor;
        COLORS.PADDLE = theme.paddleColor;
        COLORS.TEXT = theme.textColor;
        
        // Update object colors
        ball.color = theme.ballColor;
        paddle.color = theme.paddleColor;
    }
    
    // Expose public interface
    window.gameEffects = {
        createDimensionShiftEffect,
        createBrickBreakEffect,
        createPowerUpEffect,
        updateAnimations,
        addAnimation,
        applyDimensionTheme,
        dimensionThemes
    };
})();