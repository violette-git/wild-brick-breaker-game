// Game initialization and main loop
(function() {
    // Canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Game dimensions
    const GAME_WIDTH = 240;
    const GAME_HEIGHT = 320;
    
    // Game states
    const GAME_STATE = {
        MENU: 0,
        PLAYING: 1,
        GAME_OVER: 2,
        LEVEL_COMPLETE: 3,
        PAUSED: 4,
        DIMENSION_SHIFT: 5 // New state for dimension transitions
    };
    
    // Dimensions
    const DIMENSIONS = {
        NORMAL: 'normal',
        REVERSE: 'reverse',
        TIME: 'time'
    };
    
    // Colors
    const COLORS = {
        BACKGROUND: '#000',
        BALL: '#FFF',
        PADDLE: '#0095DD',
        TEXT: '#FFF',
        BRICK_COLORS: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
        DIMENSION_BRICK: '#FF00FF' // Special color for dimension shift bricks
    };
    
    // Game object
    const game = {
        state: GAME_STATE.MENU,
        score: 0,
        lives: 3,
        level: 1,
        bricksRemaining: 0,
        currentDimension: DIMENSIONS.NORMAL,
        dimensionShiftActive: false,
        dimensionShiftAnimation: null,
        targetDimension: null,
        timeScale: 1.0 // For time dimension effects
    };
    
    // Ball object
    const ball = {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 30,
        radius: 6,
        dx: 2,
        dy: -2,
        speed: 2,
        color: COLORS.BALL,
        
        draw: function() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        },
        
        update: function() {
            // Apply time dimension effect if active
            const effectiveSpeed = game.currentDimension === DIMENSIONS.TIME ? 
                this.speed * game.timeScale : this.speed;
            
            // Calculate effective dx and dy based on dimension
            let effectiveDx = this.dx;
            let effectiveDy = this.dy;
            
            // In reverse dimension, reverse vertical movement
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                effectiveDy = -effectiveDy;
            }
            
            // Move the ball with the effective speed
            this.x += effectiveDx * (effectiveSpeed / this.speed);
            this.y += effectiveDy * (effectiveSpeed / this.speed);
            
            // Wall collision (left/right)
            if (this.x + effectiveDx < this.radius || this.x + effectiveDx > GAME_WIDTH - this.radius) {
                this.dx = -this.dx;
            }
            
            // Wall collision (top/bottom)
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                // In reverse dimension, lose life when hitting top
                if (this.y - this.radius < 0) {
                    if (game.lives > 1) {
                        game.lives--;
                        this.reset();
                        paddle.reset();
                    } else {
                        game.state = GAME_STATE.GAME_OVER;
                    }
                }
                
                // In reverse dimension, bounce off bottom
                if (this.y + this.radius > GAME_HEIGHT) {
                    this.dy = -this.dy;
                }
            } else {
                // Normal behavior: bounce off top, lose life at bottom
                if (this.y - this.radius < 0) {
                    this.dy = -this.dy;
                }
                
                if (this.y + this.radius > GAME_HEIGHT) {
                    if (game.lives > 1) {
                        game.lives--;
                        this.reset();
                        paddle.reset();
                    } else {
                        game.state = GAME_STATE.GAME_OVER;
                    }
                }
            }
            
            // Paddle collision
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                // In reverse dimension, paddle is at the top
                if (this.y - this.radius < paddle.y + paddle.height && 
                    this.x > paddle.x && 
                    this.x < paddle.x + paddle.width) {
                    
                    // Calculate bounce angle based on where the ball hit the paddle
                    const hitPoint = (this.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                    
                    // Change direction and adjust angle
                    this.dy = Math.abs(this.dy);
                    this.dx = hitPoint * this.speed;
                }
            } else {
                // Normal dimension, paddle at bottom
                if (this.y + this.radius > paddle.y && 
                    this.y - this.radius < paddle.y + paddle.height &&
                    this.x > paddle.x && 
                    this.x < paddle.x + paddle.width) {
                    
                    // Calculate bounce angle based on where the ball hit the paddle
                    const hitPoint = (this.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                    
                    // Change direction and adjust angle
                    this.dy = -Math.abs(this.dy);
                    this.dx = hitPoint * this.speed;
                }
            }
            
            // Brick collision
            brickCollisionDetection();
        },
        
        reset: function() {
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                // In reverse dimension, start from top
                this.x = GAME_WIDTH / 2;
                this.y = 30;
                this.dx = 2;
                this.dy = 2; // Moving down
            } else {
                // Normal start position
                this.x = GAME_WIDTH / 2;
                this.y = GAME_HEIGHT - 30;
                this.dx = 2;
                this.dy = -2; // Moving up
            }
        }
    };
    
    // Paddle object
    const paddle = {
        width: 60,
        height: 10,
        x: (GAME_WIDTH - 60) / 2,
        y: GAME_HEIGHT - 20,
        dx: 5,
        isMovingLeft: false,
        isMovingRight: false,
        swipeVelocity: 0,
        maxSpeed: 10,
        color: COLORS.PADDLE,
        
        draw: function() {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        },
        
        update: function() {
            // Apply time dimension effect if active
            const effectiveSpeed = game.currentDimension === DIMENSIONS.TIME ? 
                this.dx * game.timeScale : this.dx;
            
            // Calculate paddle speed based on control state and swipe velocity
            let moveSpeed = effectiveSpeed;
            
            // If we have swipe velocity, use it to adjust paddle speed
            if (this.swipeVelocity > 0) {
                moveSpeed = Math.min(this.maxSpeed, this.swipeVelocity);
                
                // Apply time dimension effect to swipe velocity too
                if (game.currentDimension === DIMENSIONS.TIME) {
                    moveSpeed *= game.timeScale;
                }
            }
            
            // Move paddle based on control states
            if (this.isMovingLeft) {
                this.x = Math.max(0, this.x - moveSpeed);
            }
            if (this.isMovingRight) {
                this.x = Math.min(GAME_WIDTH - this.width, this.x + moveSpeed);
            }
            
            // Gradually reduce swipe velocity over time
            if (this.swipeVelocity > 0) {
                this.swipeVelocity *= 0.95; // Decay factor
                if (this.swipeVelocity < 0.5) {
                    this.swipeVelocity = 0;
                }
            }
        },
        
        reset: function() {
            this.x = (GAME_WIDTH - this.width) / 2;
            this.swipeVelocity = 0;
            
            // Position paddle based on current dimension
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                // In reverse dimension, paddle is at the top
                this.y = 10;
            } else {
                // Normal position at bottom
                this.y = GAME_HEIGHT - 20;
            }
        }
    };
    
    // Brick configuration
    const brickConfig = {
        rows: 5,
        cols: 8,
        width: 25,
        height: 12,
        padding: 5,
        offsetTop: 40,
        offsetLeft: 12,
        dimensionBrickChance: 0.1 // 10% chance for a dimension shift brick
    };
    
    // Bricks array
    let bricks = [];
    
    // Initialize bricks
    function initBricks() {
        bricks = [];
        game.bricksRemaining = 0;
        
        for (let r = 0; r < brickConfig.rows; r++) {
            bricks[r] = [];
            for (let c = 0; c < brickConfig.cols; c++) {
                const brickX = c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft;
                const brickY = r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop;
                
                // Determine if this will be a dimension shift brick
                const isDimensionBrick = Math.random() < brickConfig.dimensionBrickChance;
                
                bricks[r][c] = {
                    x: brickX,
                    y: brickY,
                    width: brickConfig.width,
                    height: brickConfig.height,
                    status: 1, // 1 = active, 0 = broken
                    color: isDimensionBrick ? COLORS.DIMENSION_BRICK : COLORS.BRICK_COLORS[r % COLORS.BRICK_COLORS.length],
                    isDimensionBrick: isDimensionBrick,
                    // Determine which dimension this brick shifts to (if it's a dimension brick)
                    targetDimension: isDimensionBrick ? getRandomDimension() : null
                };
                
                game.bricksRemaining++;
            }
        }
    }
    
    // Get a random dimension different from the current one
    function getRandomDimension() {
        const dimensions = Object.values(DIMENSIONS);
        const availableDimensions = dimensions.filter(dim => dim !== game.currentDimension);
        return availableDimensions[Math.floor(Math.random() * availableDimensions.length)];
    }
    
    // Draw bricks
    function drawBricks() {
        for (let r = 0; r < brickConfig.rows; r++) {
            for (let c = 0; c < brickConfig.cols; c++) {
                const brick = bricks[r][c];
                if (brick.status === 1) {
                    ctx.beginPath();
                    ctx.rect(brick.x, brick.y, brick.width, brick.height);
                    ctx.fillStyle = brick.color;
                    ctx.fill();
                    
                    // Add a special glow effect for dimension bricks
                    if (brick.isDimensionBrick) {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        
                        // Pulsating effect
                        const pulseSize = 1 + 0.2 * Math.sin(Date.now() / 200);
                        ctx.beginPath();
                        ctx.rect(
                            brick.x - 2 * pulseSize, 
                            brick.y - 2 * pulseSize, 
                            brick.width + 4 * pulseSize, 
                            brick.height + 4 * pulseSize
                        );
                        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    } else {
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                    
                    ctx.closePath();
                }
            }
        }
    }
    
    // Brick collision detection
    function brickCollisionDetection() {
        for (let r = 0; r < brickConfig.rows; r++) {
            for (let c = 0; c < brickConfig.cols; c++) {
                const brick = bricks[r][c];
                
                if (brick.status === 1) {
                    // Check if ball is colliding with this brick
                    if (ball.x > brick.x && 
                        ball.x < brick.x + brick.width && 
                        ball.y > brick.y && 
                        ball.y < brick.y + brick.height) {
                        
                        ball.dy = -ball.dy; // Reverse ball direction
                        brick.status = 0; // Break the brick
                        game.score += 10; // Add points
                        game.bricksRemaining--;
                        
                        // Create brick break effect
                        if (window.gameEffects) {
                            const breakEffect = window.gameEffects.createBrickBreakEffect(ctx, brick);
                            window.gameEffects.addAnimation(breakEffect);
                        }
                        
                        // Check if this is a dimension shift brick
                        if (brick.isDimensionBrick && brick.targetDimension) {
                            // Trigger dimension shift
                            shiftDimension(brick.targetDimension);
                        }
                        
                        // Check if level is complete
                        if (game.bricksRemaining === 0) {
                            game.state = GAME_STATE.LEVEL_COMPLETE;
                        }
                    }
                }
            }
        }
    }
    
    // Shift to a new dimension
    function shiftDimension(newDimension) {
        // Don't shift if already shifting
        if (game.dimensionShiftActive) return;
        
        game.dimensionShiftActive = true;
        game.targetDimension = newDimension;
        game.state = GAME_STATE.DIMENSION_SHIFT;
        
        // Create dimension shift effect
        if (window.gameEffects) {
            game.dimensionShiftAnimation = window.gameEffects.createDimensionShiftEffect(
                canvas, ctx, game.currentDimension, newDimension
            );
        }
        
        // Schedule the actual dimension change after animation
        setTimeout(() => {
            completeDimensionShift();
        }, 500); // Match the transition duration in effects.js
    }
    
    // Complete the dimension shift after animation
    function completeDimensionShift() {
        // Apply the new dimension
        game.currentDimension = game.targetDimension;
        
        // Apply dimension-specific effects
        applyDimensionEffects();
        
        // Reset game state to playing
        game.dimensionShiftActive = false;
        game.dimensionShiftAnimation = null;
        game.state = GAME_STATE.PLAYING;
    }
    
    // Apply effects based on the current dimension
    function applyDimensionEffects() {
        // Apply visual theme
        if (window.gameEffects) {
            window.gameEffects.applyDimensionTheme(game.currentDimension, game, ball, paddle, COLORS);
        }
        
        // Reset paddle position for the new dimension
        paddle.reset();
        
        // Apply dimension-specific physics
        switch (game.currentDimension) {
            case DIMENSIONS.NORMAL:
                game.timeScale = 1.0;
                break;
                
            case DIMENSIONS.REVERSE:
                game.timeScale = 1.0;
                // Ball direction is handled in the ball.update method
                break;
                
            case DIMENSIONS.TIME:
                // Slow down time
                game.timeScale = 0.5;
                break;
        }
    }
    
    // Draw score
    function drawScore() {
        ctx.font = '14px Arial';
        ctx.fillStyle = COLORS.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 10, 20);
    }
    
    // Draw lives
    function drawLives() {
        ctx.font = '14px Arial';
        ctx.fillStyle = COLORS.TEXT;
        ctx.textAlign = 'right';
        ctx.fillText(`Lives: ${game.lives}`, GAME_WIDTH - 10, 20);
    }
    
    // Draw current dimension
    function drawDimension() {
        ctx.font = '12px Arial';
        ctx.fillStyle = COLORS.TEXT;
        ctx.textAlign = 'center';
        ctx.fillText(`Dimension: ${game.currentDimension.toUpperCase()}`, GAME_WIDTH / 2, 20);
    }
    
    // Draw menu screen
    function drawMenu() {
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BRICK BREAKER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        
        ctx.font = '16px Arial';
        ctx.fillText('Press SPACE or Tap to Start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillText('Use ← → or Swipe to move', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
    // Draw game over screen
    function drawGameOver() {
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        
        ctx.font = '16px Arial';
        ctx.fillText(`Final Score: ${game.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillText('Press SPACE or Tap to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
    // Draw level complete screen
    function drawLevelComplete() {
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        
        ctx.font = '16px Arial';
        ctx.fillText(`Score: ${game.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillText('Press SPACE or Tap to Continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
    // Handle spacebar press based on game state
    function handleSpaceBar() {
        switch (game.state) {
            case GAME_STATE.MENU:
                startGame();
                break;
            case GAME_STATE.GAME_OVER:
                resetGame();
                break;
            case GAME_STATE.LEVEL_COMPLETE:
                nextLevel();
                break;
            case GAME_STATE.PAUSED:
                game.state = GAME_STATE.PLAYING;
                break;
        }
    }
    
    // Start the game
    function startGame() {
        game.state = GAME_STATE.PLAYING;
        initBricks();
    }
    
    // Reset the game
    function resetGame() {
        game.score = 0;
        game.lives = 3;
        game.level = 1;
        game.currentDimension = DIMENSIONS.NORMAL;
        applyDimensionEffects();
        ball.reset();
        paddle.reset();
        initBricks();
        game.state = GAME_STATE.PLAYING;
    }
    
    // Advance to next level
    function nextLevel() {
        game.level++;
        ball.reset();
        paddle.reset();
        
        // Increase difficulty with each level
        ball.speed += 0.5;
        
        // Increase chance of dimension bricks with each level
        brickConfig.dimensionBrickChance = Math.min(0.3, brickConfig.dimensionBrickChance + 0.05);
        
        initBricks();
        
        game.state = GAME_STATE.PLAYING;
    }
    
    // Handle window resize to maintain aspect ratio
    function handleResize() {
        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate the scale factor to fit the canvas within the container
        // while maintaining the aspect ratio
        const scaleX = containerWidth / GAME_WIDTH;
        const scaleY = containerHeight / GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        
        // Apply the scale to the canvas style
        canvas.style.width = `${GAME_WIDTH * scale}px`;
        canvas.style.height = `${GAME_HEIGHT * scale}px`;
    }
    
    // Game state update
    function update() {
        if (game.state === GAME_STATE.PLAYING) {
            paddle.update();
            ball.update();
        }
    }
    
    // Render game elements
    function render() {
        // Clear the canvas
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw background
        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Update visual effects
        if (window.gameEffects) {
            window.gameEffects.updateAnimations(ctx);
        }
        
        // Draw game elements based on state
        switch (game.state) {
            case GAME_STATE.MENU:
                drawMenu();
                break;
                
            case GAME_STATE.PLAYING:
                // Draw game elements
                drawBricks();
                paddle.draw();
                ball.draw();
                drawScore();
                drawLives();
                drawDimension();
                break;
                
            case GAME_STATE.GAME_OVER:
                drawGameOver();
                break;
                
            case GAME_STATE.LEVEL_COMPLETE:
                drawLevelComplete();
                break;
                
            case GAME_STATE.DIMENSION_SHIFT:
                // During dimension shift, only run the shift animation
                if (game.dimensionShiftAnimation) {
                    game.dimensionShiftAnimation();
                }
                break;
        }
    }
    
    // Initialize the game
    function init() {
        // Set up event listeners
        window.addEventListener('resize', handleResize);
        
        // Initial resize
        handleResize();
        
        // Initialize game objects
        ball.reset();
        paddle.reset();
        initBricks();
        
        // Start in menu state
        game.state = GAME_STATE.MENU;
        
        // Start the game loop
        requestAnimationFrame(gameLoop);
    }
    
    // Game loop variables
    let lastTime = 0;
    
    // Main game loop
    function gameLoop(timestamp) {
        // Calculate delta time (time since last frame)
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        update();
        render();
        
        // Continue the game loop
        requestAnimationFrame(gameLoop);
    }
    
    // Expose game control interface for controls.js
    window.gameControls = {
        setPaddleMovement: function(left, right, swipeVelocity = 0) {
            paddle.isMovingLeft = left;
            paddle.isMovingRight = right;
            
            // Update paddle swipe velocity if provided
            if (swipeVelocity > 0) {
                paddle.swipeVelocity = swipeVelocity;
            }
        },
        pressSpacebar: function() {
            handleSpaceBar();
        }
    };
    
    // Start the game when the page is loaded
    window.addEventListener('load', init);
})();