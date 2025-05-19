// Game initialization and canvas setup

class Game {
    constructor() {
        // Get the canvas element and its context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Original canvas dimensions
        this.CANVAS_WIDTH = 240;
        this.CANVAS_HEIGHT = 320;
        
        // Game state variables
        this.state = 'start'; // start, ready, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Dimension system
        this.dimensions = {
            normal: {
                name: 'Normal',
                ballGravityFactor: 1,
                ballSpeedFactor: 1,
                paddleSpeedFactor: 1,
                backgroundColor: '#000',
                ballColor: '#FFF',
                paddleColor: '#0095DD',
                particleLifespan: 30,
                timeWarpFactor: 1
            },
            reverseGravity: {
                name: 'Reverse Gravity',
                ballGravityFactor: -1,
                ballSpeedFactor: 1.1,
                paddleSpeedFactor: 0.8,
                backgroundColor: '#330033',
                ballColor: '#FF88FF',
                paddleColor: '#8800AA',
                particleLifespan: 40,
                timeWarpFactor: 1
            },
            timeWarp: {
                name: 'Time Warp',
                ballGravityFactor: 1,
                ballSpeedFactor: function() { return 0.5 + Math.sin(Date.now() / 500) * 0.5 + 0.5; },
                paddleSpeedFactor: function() { return 0.7 + Math.cos(Date.now() / 700) * 0.3 + 0.3; },
                backgroundColor: '#003344',
                ballColor: '#00FFFF',
                paddleColor: '#0088AA',
                particleLifespan: 50,
                timeWarpFactor: function() { return 0.5 + Math.sin(Date.now() / 1000) * 0.5 + 0.5; }
            }
        };
        
        // Current dimension
        this.currentDimension = 'normal';
        this.dimensionTransitioning = false;
        this.dimensionTransitionProgress = 0;
        this.dimensionTransitionDuration = 60; // frames
        this.previousDimension = 'normal';
        
        // Paddle properties
        this.paddle = {
            width: 60,
            height: 10,
            x: this.CANVAS_WIDTH / 2 - 30,
            y: this.CANVAS_HEIGHT - 20,
            speed: 5
        };
        
        // Ball properties
        this.ball = {
            radius: 6,
            x: this.CANVAS_WIDTH / 2,
            y: this.CANVAS_HEIGHT - 30,
            dx: 2,
            dy: -2,
            speed: 2,
            attached: true // Ball starts attached to the paddle
        };
        
        // Brick properties
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 25;
        this.brickHeight = 12;
        this.brickPadding = 3;
        this.brickOffsetTop = 40;
        this.brickOffsetLeft = 15;
        
        // Initialize bricks
        this.bricks = [];
        this.initBricks();
        
        // Initialize controls and effects
        this.controls = new Controls(this);
        this.effects = new Effects(this);
        
        // Animation frame variables
        this.lastTime = 0;
        this.gameRunning = false;
        
        // Device detection for control instructions
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Set up event listeners
        window.addEventListener('resize', this.handleResize);
        
        // Initial resize to set correct scale
        this.handleResize();
    }
    
    // Initialize brick layout
    initBricks() {
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                // Add special dimensional bricks (about 10% chance)
                const isDimensionalBrick = Math.random() < 0.1;
                const brickType = isDimensionalBrick ? 'dimensional' : 'normal';
                
                // Determine which dimension this brick will trigger
                let targetDimension = 'normal';
                if (isDimensionalBrick) {
                    const dimensionKeys = Object.keys(this.dimensions);
                    targetDimension = dimensionKeys[Math.floor(Math.random() * dimensionKeys.length)];
                }
                
                this.bricks[c][r] = { 
                    x: 0, 
                    y: 0, 
                    status: 1, // 1 = active, 0 = broken
                    color: this.getBrickColor(r, brickType, targetDimension),
                    type: brickType,
                    targetDimension: targetDimension
                };
            }
        }
    }
    
    // Get brick color based on row and type
    getBrickColor(row, type, targetDimension) {
        if (type === 'dimensional') {
            // Colors for dimensional bricks based on target dimension
            const dimensionColors = {
                normal: '#FFFFFF',
                reverseGravity: '#FF00FF',
                timeWarp: '#00FFFF'
            };
            return dimensionColors[targetDimension] || '#FFFFFF';
        } else {
            // Regular brick colors
            const colors = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3'];
            return colors[row % colors.length];
        }
    }
    
    // Handle window resize for responsive scaling
    handleResize() {
        const gameContainer = document.getElementById('game-container');
        const containerWidth = gameContainer.clientWidth;
        const containerHeight = gameContainer.clientHeight;
        
        // Calculate the scale factor to maintain aspect ratio
        let scale;
        if (containerWidth / containerHeight > this.CANVAS_WIDTH / this.CANVAS_HEIGHT) {
            // Container is wider than canvas aspect ratio
            scale = containerHeight / this.CANVAS_HEIGHT;
        } else {
            // Container is taller than canvas aspect ratio
            scale = containerWidth / this.CANVAS_WIDTH;
        }
        
        // Apply the scale to maintain pixel-perfect rendering
        this.canvas.style.transform = `scale(${scale})`;
        this.canvas.style.transformOrigin = 'center';
    }
    
    // Start the game
    start() {
        this.gameRunning = true;
        this.state = 'start';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.currentDimension = 'normal';
        this.dimensionTransitioning = false;
        this.initBricks();
        this.resetBall();
        
        // Update the CSS class for the initial dimension
        if (window.dispatchDimensionChangeEvent) {
            window.dispatchDimensionChangeEvent(this.currentDimension);
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    // Start gameplay from ready state
    startGame() {
        if (this.state === 'start' || this.state === 'ready') {
            this.state = 'playing';
            if (this.ball.attached) {
                this.ball.attached = false;
                // Give the ball an initial velocity
                this.ball.dx = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
                this.ball.dy = -this.ball.speed;
            }
        }
    }
    
    // Reset ball position
    resetBall() {
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius;
        this.ball.dx = 2;
        this.ball.dy = -2;
        this.ball.attached = true;
        this.state = 'ready';
    }
    
    // Check if all bricks are broken
    checkLevelComplete() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Move to next level
    nextLevel() {
        this.level++;
        this.ball.speed += 0.5;
        this.initBricks();
        this.resetBall();
    }
    
    // Shift to a new dimension
    shiftDimension(newDimension) {
        if (this.currentDimension === newDimension || this.dimensionTransitioning) {
            return; // Already in this dimension or currently transitioning
        }
        
        this.previousDimension = this.currentDimension;
        this.currentDimension = newDimension;
        this.dimensionTransitioning = true;
        this.dimensionTransitionProgress = 0;
        
        // Create dimension shift effect
        this.effects.createDimensionShiftEffect(this.previousDimension, this.currentDimension);
        
        // Play dimension shift sound
        this.effects.playSound('dimension-shift');
        
        // Update the CSS class for the new dimension
        if (window.dispatchDimensionChangeEvent) {
            window.dispatchDimensionChangeEvent(this.currentDimension);
        }
    }
    
    // Get current dimension properties with transition blending if needed
    getCurrentDimensionProps() {
        const currentDim = this.dimensions[this.currentDimension];
        
        // If not transitioning, return current dimension properties directly
        if (!this.dimensionTransitioning) {
            return currentDim;
        }
        
        // Calculate transition progress (0 to 1)
        const progress = this.dimensionTransitionProgress / this.dimensionTransitionDuration;
        const prevDim = this.dimensions[this.previousDimension];
        
        // Blend properties between dimensions
        const blendedProps = {};
        
        for (const prop in currentDim) {
            if (typeof currentDim[prop] === 'function' || typeof prevDim[prop] === 'function') {
                // For function properties, we can't blend, so just use the target dimension's function
                blendedProps[prop] = currentDim[prop];
            } else if (typeof currentDim[prop] === 'string' && prop.includes('Color')) {
                // Blend colors
                blendedProps[prop] = this.blendColors(prevDim[prop], currentDim[prop], progress);
            } else if (typeof currentDim[prop] === 'number') {
                // Blend numeric values
                blendedProps[prop] = prevDim[prop] + (currentDim[prop] - prevDim[prop]) * progress;
            } else {
                // For other properties, just use the target dimension's value
                blendedProps[prop] = currentDim[prop];
            }
        }
        
        return blendedProps;
    }
    
    // Helper function to blend colors during transition
    blendColors(color1, color2, progress) {
        // Convert hex to RGB
        const hex2rgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        
        // Convert RGB to hex
        const rgb2hex = (r, g, b) => {
            return '#' + [r, g, b].map(x => {
                const hex = Math.round(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        };
        
        // Get RGB values
        const rgb1 = hex2rgb(color1);
        const rgb2 = hex2rgb(color2);
        
        // Blend RGB values
        const blended = rgb1.map((channel, i) => {
            return channel + (rgb2[i] - channel) * progress;
        });
        
        // Convert back to hex
        return rgb2hex(blended[0], blended[1], blended[2]);
    }
    
    // Main game loop
    gameLoop(timestamp) {
        // Calculate delta time (time since last frame)
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Update game state
        this.update(deltaTime);
        
        // Render game elements
        this.render();
        
        // Continue the game loop if game is running
        if (this.gameRunning) {
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    // Update game state
    update(deltaTime) {
        // Get current dimension properties
        const dimProps = this.getCurrentDimensionProps();
        
        // Update dimension transition if in progress
        if (this.dimensionTransitioning) {
            this.dimensionTransitionProgress++;
            if (this.dimensionTransitionProgress >= this.dimensionTransitionDuration) {
                this.dimensionTransitioning = false;
            }
        }
        
        // Calculate paddle speed with dimension factor
        let paddleSpeed = this.paddle.speed;
        if (typeof dimProps.paddleSpeedFactor === 'function') {
            paddleSpeed *= dimProps.paddleSpeedFactor();
        } else {
            paddleSpeed *= dimProps.paddleSpeedFactor;
        }
        
        // Update paddle position based on controls
        if (this.controls.rightPressed && this.paddle.x < this.CANVAS_WIDTH - this.paddle.width) {
            this.paddle.x += paddleSpeed;
        } else if (this.controls.leftPressed && this.paddle.x > 0) {
            this.paddle.x -= paddleSpeed;
        }
        
        // If ball is attached to paddle, move it with the paddle
        if (this.ball.attached) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            return;
        }
        
        // Only update ball if game is playing
        if (this.state !== 'playing') return;
        
        // Update effects
        this.effects.update();
        
        // Calculate ball speed with dimension factor
        let ballSpeedFactor;
        if (typeof dimProps.ballSpeedFactor === 'function') {
            ballSpeedFactor = dimProps.ballSpeedFactor();
        } else {
            ballSpeedFactor = dimProps.ballSpeedFactor;
        }
        
        // Apply gravity factor to ball's vertical movement
        let gravityFactor;
        if (typeof dimProps.ballGravityFactor === 'function') {
            gravityFactor = dimProps.ballGravityFactor();
        } else {
            gravityFactor = dimProps.ballGravityFactor;
        }
        
        // Move the ball with dimension factors applied
        this.ball.x += this.ball.dx * ballSpeedFactor;
        this.ball.y += this.ball.dy * ballSpeedFactor * gravityFactor;
        
        // Ball collision with walls
        if (this.ball.x + this.ball.dx > this.CANVAS_WIDTH - this.ball.radius || 
            this.ball.x + this.ball.dx < this.ball.radius) {
            this.ball.dx = -this.ball.dx;
        }
        
        // Ball collision with top
        if (this.ball.y + this.ball.dy < this.ball.radius) {
            this.ball.dy = -this.ball.dy;
        }
        
        // Ball collision with bottom (lose life)
        if (this.ball.y + this.ball.dy > this.CANVAS_HEIGHT - this.ball.radius) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = 'gameOver';
            } else {
                this.resetBall();
            }
        }
        
        // Ball collision with paddle
        if (this.ball.y + this.ball.radius > this.paddle.y && 
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x && 
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            // Calculate bounce angle based on where ball hits paddle
            const hitPos = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            const angle = hitPos * (Math.PI / 3); // Max 60 degree angle
            
            this.ball.dy = -Math.abs(this.ball.dy); // Always bounce up
            this.ball.dx = this.ball.speed * Math.sin(angle);
            
            // Play hit sound
            this.effects.playSound('hit');
        }
        
        // Ball collision with bricks
        this.checkBrickCollisions();
        
        // Check if level is complete
        if (this.checkLevelComplete()) {
            this.nextLevel();
        }
    }
    
    // Check for collisions between ball and bricks
    checkBrickCollisions() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                
                if (brick.status === 1) {
                    // Calculate brick position
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    brick.x = brickX;
                    brick.y = brickY;
                    
                    // Check for collision
                    if (this.ball.x > brickX && 
                        this.ball.x < brickX + this.brickWidth && 
                        this.ball.y > brickY && 
                        this.ball.y < brickY + this.brickHeight) {
                        
                        this.ball.dy = -this.ball.dy;
                        brick.status = 0;
                        this.score += 10;
                        
                        // Create brick break effect
                        this.effects.createBrickBreakEffect(
                            brickX + this.brickWidth / 2, 
                            brickY + this.brickHeight / 2,
                            brick.color
                        );
                        
                        // Check if this is a dimensional brick
                        if (brick.type === 'dimensional') {
                            this.shiftDimension(brick.targetDimension);
                        }
                        
                        // Play break sound
                        this.effects.playSound('break');
                    }
                }
            }
        }
    }
    
    // Render game elements
    render() {
        // Get current dimension properties for rendering
        const dimProps = this.getCurrentDimensionProps();
        
        // Draw background
        this.ctx.fillStyle = dimProps.backgroundColor;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Draw bricks
        this.drawBricks();
        
        // Draw paddle
        this.drawPaddle(dimProps.paddleColor);
        
        // Draw ball
        this.drawBall(dimProps.ballColor);
        
        // Draw effects
        this.effects.render(this.ctx);
        
        // Draw score
        this.drawScore();
        
        // Draw lives
        this.drawLives();
        
        // Draw level
        this.drawLevel();
        
        // Draw current dimension
        this.drawDimension();
        
        // Draw game state messages
        this.drawGameStateMessages();
    }
    
    // Draw the bricks
    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    const brickX = this.bricks[c][r].x;
                    const brickY = this.bricks[c][r].y;
                    
                    this.ctx.fillStyle = this.bricks[c][r].color;
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);
                    
                    // Add a highlight effect
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(brickX, brickY, this.brickWidth, this.brickHeight);
                    
                    // Add special glow for dimensional bricks
                    if (this.bricks[c][r].type === 'dimensional') {
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(brickX, brickY, this.brickWidth, this.brickHeight);
                        
                        // Add pulsing effect
                        const pulseSize = 1 + Math.sin(Date.now() / 200) * 0.5;
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(
                            brickX - pulseSize, 
                            brickY - pulseSize, 
                            this.brickWidth + pulseSize * 2, 
                            this.brickHeight + pulseSize * 2
                        );
                    }
                }
            }
        }
    }
    
    // Draw the paddle
    drawPaddle(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Add a highlight effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, 2);
    }
    
    // Draw the ball
    drawBall(color) {
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }
    
    // Draw the score
    drawScore() {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#FFF';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 8, 20);
    }
    
    // Draw the lives
    drawLives() {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#FFF';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Lives: ${this.lives}`, this.CANVAS_WIDTH - 8, 20);
    }
    
    // Draw the level
    drawLevel() {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#FFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level: ${this.level}`, this.CANVAS_WIDTH / 2, 20);
    }
    
    // Draw the current dimension
    drawDimension() {
        const dimProps = this.getCurrentDimensionProps();
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#FFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Dimension: ${dimProps.name}`, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT - 5);
    }
    
    // Draw game state messages
    drawGameStateMessages() {
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#FFF';
        this.ctx.textAlign = 'center';
        
        if (this.state === 'start') {
            if (this.isTouchDevice) {
                this.ctx.fillText('Tap to Start', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 - 20);
                this.ctx.font = '12px Arial';
                this.ctx.fillText('Swipe left/down to move left', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 10);
                this.ctx.fillText('Swipe right/up to move right', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 30);
                this.ctx.fillText('Hit glowing bricks to shift dimensions!', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 50);
            } else {
                this.ctx.fillText('Press SPACE to Start', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
                this.ctx.font = '12px Arial';
                this.ctx.fillText('Use arrow keys to move', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 20);
                this.ctx.fillText('Hit glowing bricks to shift dimensions!', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 40);
            }
        } else if (this.state === 'ready') {
            if (this.isTouchDevice) {
                this.ctx.fillText('Tap to Launch', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
            } else {
                this.ctx.fillText('Press SPACE to Launch', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
            }
        } else if (this.state === 'gameOver') {
            this.ctx.fillText('GAME OVER', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 - 10);
            this.ctx.fillText(`Final Score: ${this.score}`, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 10);
            this.ctx.font = '12px Arial';
            if (this.isTouchDevice) {
                this.ctx.fillText('Tap to Restart', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 30);
            } else {
                this.ctx.fillText('Press SPACE to Restart', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 30);
            }
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const game = new Game();
    game.start();
});