// Game initialization and main loop
(function() {
    // Canvas setup
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("CRITICAL: Game canvas element with ID 'gameCanvas' not found in HTML.");
        alert("Error: Game canvas not found. Please ensure an element with ID 'gameCanvas' exists.");
        return; // Stop execution if canvas is not found
    }
    const ctx = canvas.getContext('2d');

    // Game dimensions
    const GAME_WIDTH = 240;
    const GAME_HEIGHT = 320;

    // Forward declaration for paddle, to be used by gameControls
    let paddle;

    // Expose game control interface for the controls script
    // This must be defined before the controls script might try to use it,
    // or ensure controls are initialized after this is set.
    window.gameControls = {
        setPaddleMovement: function(left, right, swipeVelocity = 0) {
            if (paddle) { // Ensure paddle object is initialized
                paddle.isMovingLeft = left;
                paddle.isMovingRight = right;
                
                // Only update paddle's swipeVelocity if a new one is provided from touch
                // Keyboard/scroll events will pass swipeVelocity = 0 (default) or the existing lastSwipeVelocity.
                // The control script's `updatePaddleMovement` now consistently passes `lastSwipeVelocity`.
                // If it's from a key press/scroll, `lastSwipeVelocity` should ideally be 0 or not influential.
                // The key is that `paddle.swipeVelocity` should primarily be driven by touch flicks.
                if (swipeVelocity > 0) { // A new swipe velocity value from touch
                    paddle.swipeVelocity = swipeVelocity;
                } else if (!left && !right) {
                    // If no directional input, but swipeVelocity was 0, ensure paddle's momentum isn't reset if it had one
                    // This case is subtle: if called from keyup with (false, false, 0), existing paddle.swipeVelocity should persist.
                    // The current logic: if swipeVelocity param is > 0, it's set. Otherwise, paddle.swipeVelocity is not touched by this parameter.
                    // This is fine. The paddle.update() handles decay.
                }
            } else {
                console.warn("Attempted to set paddle movement before paddle was initialized.");
            }
        },
        pressSpacebar: function() {
            // Ensure handleSpaceBar is defined and callable in the game's scope
            if (typeof handleSpaceBar === 'function') {
                handleSpaceBar();
            } else {
                console.warn("handleSpaceBar function not found.");
            }
        }
    };

    // Controls handling for Brick Breaker game
    // (function() {
    //     // Control state
    //     const controlState = {
    //         leftPressed: false,
    //         rightPressed: false,
    //         paddleSpeed: 5, // Default paddle speed (used by paddle.dx, not directly here anymore)
    //         touchSensitivity: 1.0 // Default touch sensitivity (adjustable)
    //     };
        
    //     // Touch control variables
    //     let touchStartX = 0;
    //     let touchStartY = 0;
    //     let touchEndX = 0;
    //     let touchEndY = 0;
    //     let touchStartTime = 0;
    //     let isTouching = false;
    //     let lastSwipeVelocity = 0; // This will carry the velocity for the game to use
    //     let swipeDirection = null; // 'left', 'right', 'up', 'down'
        
    //     // Initialize keyboard controls
    //     function initKeyboardControls() {
    //         document.addEventListener('keydown', handleKeyDown);
    //         document.addEventListener('keyup', handleKeyUp);
    //     }
        
    //     // Handle key down events
    //     function handleKeyDown(e) {
    //         let stateChanged = false;
    //         if (e.key === 'ArrowLeft' || e.key === 'Left') {
    //             controlState.leftPressed = true; stateChanged = true;
    //         } else if (e.key === 'ArrowRight' || e.key === 'Right') {
    //             controlState.rightPressed = true; stateChanged = true;
    //         } else if (e.key === 'ArrowDown' || e.key === 'Down') { // New: Down arrow for left
    //             controlState.leftPressed = true; stateChanged = true;
    //         } else if (e.key === 'ArrowUp' || e.key === 'Up') { // New: Up arrow for right
    //             controlState.rightPressed = true; stateChanged = true;
    //         } else if (e.key === ' ' || e.key === 'Spacebar') {
    //             if (window.gameControls && window.gameControls.pressSpacebar) {
    //                 window.gameControls.pressSpacebar();
    //             }
    //         }

    //         if (stateChanged) {
    //             // For keyboard, there's no "swipe velocity" to pass.
    //             // Pass 0, or let current `lastSwipeVelocity` pass if we want combined inputs (complex).
    //             // Simpler: keyboard input implies no new swipe velocity.
    //             // However, `updatePaddleMovement` sends `lastSwipeVelocity`.
    //             // If a swipe just ended, `lastSwipeVelocity` could be non-zero.
    //             // Keyboard should override this. Let's ensure `lastSwipeVelocity` is 0 for pure key events.
    //             // No, let `updatePaddleMovement` be general. `gameControls.setPaddleMovement` needs to be smart.
    //             // For now, keep it simple: keys set direction, swipe sets direction + velocity.
    //             updatePaddleMovement();
    //         }
    //     }
        
    //     // Handle key up events
    //     function handleKeyUp(e) {
    //         let stateChanged = false;
    //         if (e.key === 'ArrowLeft' || e.key === 'Left') {
    //             controlState.leftPressed = false; stateChanged = true;
    //         } else if (e.key === 'ArrowRight' || e.key === 'Right') {
    //             controlState.rightPressed = false; stateChanged = true;
    //         } else if (e.key === 'ArrowDown' || e.key === 'Down') {
    //             controlState.leftPressed = false; stateChanged = true;
    //         } else if (e.key === 'ArrowUp' || e.key === 'Up') {
    //             controlState.rightPressed = false; stateChanged = true;
    //         }

    //         if (stateChanged) {
    //             updatePaddleMovement();
    //         }
    //     }
        
    //     // Update paddle movement based on control state
    //     function updatePaddleMovement() {
    //         if (window.gameControls && window.gameControls.setPaddleMovement) {
    //             // Pass the current directional state and the last calculated swipe velocity.
    //             // The game (paddle.swipeVelocity) will use this for momentum if applicable.
    //             window.gameControls.setPaddleMovement(
    //                 controlState.leftPressed,
    //                 controlState.rightPressed,
    //                 lastSwipeVelocity // This is crucial for touch momentum
    //             );
    //         }
    //     }
        
    //     // Initialize touch controls
    //     function initTouchControls() {
    //         const localCanvas = document.getElementById('gameCanvas'); // Use local var
    //         if (!localCanvas) {
    //             console.error("Touch controls: gameCanvas not found!");
    //             return;
    //         }
            
    //         localCanvas.addEventListener('touchstart', function(e) {
    //             e.preventDefault();
    //             isTouching = true;
    //             touchStartX = e.touches[0].clientX;
    //             touchStartY = e.touches[0].clientY;
    //             touchEndX = touchStartX; // Initialize touchEnd
    //             touchEndY = touchStartY; // Initialize touchEnd
    //             touchStartTime = Date.now();
                
    //             lastSwipeVelocity = 0; // Reset swipe velocity at the start of a new touch
    //             swipeDirection = null;
                
    //             // Initial state for touch: not moving, velocity 0
    //             controlState.leftPressed = false;
    //             controlState.rightPressed = false;
    //             updatePaddleMovement();
    //         }, { passive: false });
            
    //         localCanvas.addEventListener('touchmove', function(e) {
    //             e.preventDefault();
    //             if (isTouching) {
    //                 touchEndX = e.touches[0].clientX;
    //                 touchEndY = e.touches[0].clientY;
                    
    //                 const deltaX = touchEndX - touchStartX;
    //                 const deltaY = touchEndY - touchStartY;
    //                 const touchTime = Math.max(1, Date.now() - touchStartTime); // Avoid division by zero
                    
    //                 const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / touchTime;
    //                 lastSwipeVelocity = velocity * controlState.touchSensitivity * 50; // Scale factor
                    
    //                 // Determine primary swipe direction
    //                 controlState.leftPressed = false; // Reset direction flags
    //                 controlState.rightPressed = false;

    //                 if (Math.abs(deltaX) > Math.abs(deltaY) * 0.5) { // Prefer horizontal
    //                     if (deltaX < 0) {
    //                         swipeDirection = 'left';
    //                         controlState.leftPressed = true;
    //                     } else {
    //                         swipeDirection = 'right';
    //                         controlState.rightPressed = true;
    //                     }
    //                 } else if (Math.abs(deltaY) > Math.abs(deltaX) * 2) { // Strong vertical for up/down mapping
    //                     if (deltaY < 0) { // Up swipe - map to right
    //                         swipeDirection = 'up';
    //                         controlState.rightPressed = true;
    //                     } else { // Down swipe - map to left
    //                         swipeDirection = 'down';
    //                         controlState.leftPressed = true;
    //                     }
    //                 } else {
    //                     swipeDirection = null; // No clear dominant direction for paddle
    //                     lastSwipeVelocity = 0; // Don't use velocity from ambiguous move
    //                 }
    //                 updatePaddleMovement();
    //             }
    //         }, { passive: false });
            
    //         localCanvas.addEventListener('touchend', function(e) {
    //             e.preventDefault();
    //             if (isTouching) {
    //                 isTouching = false;
    //                 const deltaX = touchEndX - touchStartX;
    //                 const deltaY = touchEndY - touchStartY;
    //                 const touchTime = Math.max(1, Date.now() - touchStartTime);
                    
    //                 if (touchTime > 50 && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) { // Deliberate swipe
    //                     const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / touchTime;
    //                     lastSwipeVelocity = velocity * controlState.touchSensitivity * 50;
                        
    //                     // Set controlState based on final swipe direction for the momentum period
    //                     if (swipeDirection === 'left' || swipeDirection === 'down') {
    //                         controlState.leftPressed = true;
    //                         controlState.rightPressed = false;
    //                     } else if (swipeDirection === 'right' || swipeDirection === 'up') {
    //                         controlState.leftPressed = false;
    //                         controlState.rightPressed = true;
    //                     } else {
    //                         // No clear direction from swipe, so no momentum press
    //                         controlState.leftPressed = false;
    //                         controlState.rightPressed = false;
    //                         lastSwipeVelocity = 0; // No velocity if no direction
    //                     }
    //                     updatePaddleMovement(); // Send final swipe state (direction + velocity)
                        
    //                     // Schedule reset of directional flags for momentum effect.
    //                     // lastSwipeVelocity is NOT reset here; game's paddle.swipeVelocity handles decay.
    //                     setTimeout(function() {
    //                         controlState.leftPressed = false;
    //                         controlState.rightPressed = false;
    //                         // lastSwipeVelocity = 0; // DO NOT DO THIS - let paddle.swipeVelocity decay
    //                         updatePaddleMovement(); // Inform game that direct press ended
    //                     }, 300); // Momentum effect duration
    //                 } else { // Tap or insignificant movement
    //                     controlState.leftPressed = false;
    //                     controlState.rightPressed = false;
    //                     lastSwipeVelocity = 0;
    //                     updatePaddleMovement();
                        
    //                     if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchTime < 200) { // Treat as a tap
    //                         if (window.gameControls && window.gameControls.pressSpacebar) {
    //                             window.gameControls.pressSpacebar();
    //                         }
    //                     }
    //                 }
    //             }
    //         }, { passive: false });
            
    //         localCanvas.addEventListener('touchcancel', function(e) {
    //             e.preventDefault();
    //             if (isTouching) {
    //                 isTouching = false;
    //                 controlState.leftPressed = false;
    //                 controlState.rightPressed = false;
    //                 lastSwipeVelocity = 0;
    //                 swipeDirection = null;
    //                 updatePaddleMovement();
    //             }
    //         }, { passive: false });
    //     }
        
    //     // Initialize scroll wheel controls
    //     function initScrollWheelControls() {
    //         const localCanvas = document.getElementById('gameCanvas');
    //         const targetElement = localCanvas || document; // Scroll on canvas or fallback to document

    //         targetElement.addEventListener('wheel', function(e) {
    //             if (localCanvas && !localCanvas.contains(e.target) && e.target !== localCanvas) {
    //                 return; // Ignore scroll if not on canvas (if canvas exists)
    //             }
    //             e.preventDefault();
                
    //             // Scroll should be a discrete nudge, so reset swipe velocity
    //             lastSwipeVelocity = 0;

    //             if (e.deltaY > 0) { // Scrolling down - move paddle left
    //                 controlState.leftPressed = true;
    //                 controlState.rightPressed = false;
    //             } else if (e.deltaY < 0) { // Scrolling up - move paddle right
    //                 controlState.leftPressed = false;
    //                 controlState.rightPressed = true;
    //             }
    //             updatePaddleMovement();
                
    //             setTimeout(function() {
    //                 controlState.leftPressed = false;
    //                 controlState.rightPressed = false;
    //                 updatePaddleMovement();
    //             }, 100); // Reset after a short delay for nudge effect
    //         }, { passive: false });
    //     }
        
    //     // Adjust touch sensitivity (callable from game if UI is added)
    //     function setTouchSensitivity(value) {
    //         controlState.touchSensitivity = Math.max(0.1, Math.min(2.0, value));
    //     }
        
    //     // Initialize all control types
    //     function initAllControls() {
    //         initKeyboardControls();
    //         initTouchControls();
    //         initScrollWheelControls();
    //     }
        
    //     // Expose init function for the main game to call, and other control settings
    //     window.inputControls = {
    //         init: initAllControls,
    //         setTouchSensitivity: setTouchSensitivity
    //     };
    //     // Removed: window.addEventListener('load', init); // Main game handles this.
    //     // Removed: window.controls exposure, using window.inputControls for clarity
    // })(); // End of Controls IIFE
    
    // Game states
    const GAME_STATE = {
        MENU: 0,
        PLAYING: 1,
        GAME_OVER: 2,
        LEVEL_COMPLETE: 3,
        PAUSED: 4,
        DIMENSION_SHIFT: 5
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
        DIMENSION_BRICK: '#FF00FF'
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
        timeScale: 1.0
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
            const effectiveSpeedMultiplier = game.currentDimension === DIMENSIONS.TIME ? game.timeScale : 1.0;
            const currentSpeed = this.speed * effectiveSpeedMultiplier;

            // Normalized direction vector
            const magnitude = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            const normalizedDx = (magnitude === 0) ? 1 : this.dx / magnitude; // Avoid division by zero, default to right if no prior movement
            const normalizedDy = (magnitude === 0) ? -1 : this.dy / magnitude; // Default to up

            let effectiveBallDx = normalizedDx * currentSpeed;
            let effectiveBallDy = normalizedDy * currentSpeed;
            
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                effectiveBallDy = -effectiveBallDy; // Vertical movement is inverted relative to logical dy
            }
            
            this.x += effectiveBallDx;
            this.y += effectiveBallDy;
            
            // Wall collision (left/right)
            if (this.x + this.radius > GAME_WIDTH || this.x - this.radius < 0) {
                this.dx = -this.dx;
                // Correct position to prevent sticking
                this.x = (this.x + this.radius > GAME_WIDTH) ? GAME_WIDTH - this.radius : this.radius;
            }
            
            // Wall collision (top/bottom) & Paddle
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                if (this.y - this.radius < 0) { // Hits actual top (game over)
                    if (game.lives > 1) {
                        game.lives--; this.reset(); paddle.reset();
                    } else { game.state = GAME_STATE.GAME_OVER; }
                }
                if (this.y + this.radius > GAME_HEIGHT) { // Hits actual bottom (bounce)
                    this.dy = -this.dy;
                    this.y = GAME_HEIGHT - this.radius;
                }
                 // Paddle collision (paddle at top in reverse)
                if (this.y - this.radius < paddle.y + paddle.height &&
                    this.y + this.radius > paddle.y && // Ensure ball isn't past paddle
                    this.x > paddle.x && this.x < paddle.x + paddle.width) {
                    this.dy = Math.abs(this.dy); // Ensure it moves away from paddle (downwards in screen space)
                    const hitPoint = (this.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                    this.dx = hitPoint * this.speed; // Speed here refers to base speed for angle calc
                    this.y = paddle.y + paddle.height + this.radius; // Place ball just off paddle
                }
            } else { // Normal or Time dimension
                if (this.y - this.radius < 0) { // Hits actual top (bounce)
                    this.dy = -this.dy;
                    this.y = this.radius;
                }
                if (this.y + this.radius > GAME_HEIGHT) { // Hits actual bottom (game over)
                    if (game.lives > 1) {
                        game.lives--; this.reset(); paddle.reset();
                    } else { game.state = GAME_STATE.GAME_OVER; }
                }
                // Paddle collision (paddle at bottom)
                if (this.y + this.radius > paddle.y &&
                    this.y - this.radius < paddle.y + paddle.height && // Ensure ball isn't past paddle
                    this.x > paddle.x && this.x < paddle.x + paddle.width) {
                    this.dy = -Math.abs(this.dy); // Ensure it moves away from paddle (upwards)
                    const hitPoint = (this.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                    this.dx = hitPoint * this.speed; // Speed here refers to base speed for angle calc
                    this.y = paddle.y - this.radius; // Place ball just off paddle
                }
            }
            brickCollisionDetection();
        },
        
        reset: function() {
            this.speed = 2 + (game.level -1) * 0.5; // Re-apply base speed + level bonus
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                this.x = GAME_WIDTH / 2; this.y = 30 + this.radius;
                this.dx = (Math.random() < 0.5 ? 1 : -1) * this.speed / 2; this.dy = this.speed / 2; // Moving "down" (screen space)
            } else {
                this.x = GAME_WIDTH / 2; this.y = GAME_HEIGHT - 30 - this.radius;
                this.dx = (Math.random() < 0.5 ? 1 : -1) * this.speed / 2; this.dy = -this.speed / 2; // Moving "up"
            }
        }
    };
    
    // Paddle object - assigned to the forward-declared `paddle`
    paddle = {
        width: 60,
        height: 10,
        x: (GAME_WIDTH - 60) / 2,
        y: GAME_HEIGHT - 20,
        dx: 5, // Base speed for keyboard/scroll
        isMovingLeft: false,
        isMovingRight: false,
        swipeVelocity: 0, // Magnitude of velocity from touch swipe, game controlled decay
        maxSpeed: 10, // Max speed paddle can achieve, esp. from swipes
        color: COLORS.PADDLE,
        
        draw: function() {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        },
        
        update: function() {
            // Determine base speed for current frame (keyboard/scroll)
            let baseMoveSpeed = this.dx;
            if (game.currentDimension === DIMENSIONS.TIME) {
                baseMoveSpeed *= game.timeScale;
            }

            // Determine actual move speed, considering swipe velocity
            let currentAppliedSpeed = baseMoveSpeed;
            if (this.swipeVelocity > 0) {
                let currentSwipeActualSpeed = this.swipeVelocity;
                if (game.currentDimension === DIMENSIONS.TIME) {
                    currentSwipeActualSpeed *= game.timeScale;
                }
                // If swipe velocity is active, it dictates the speed, capped by maxSpeed
                currentAppliedSpeed = Math.min(this.maxSpeed, currentSwipeActualSpeed);
            }
            
            // Apply movement based on directional flags
            if (this.isMovingLeft) {
                this.x -= currentAppliedSpeed;
            } else if (this.isMovingRight) { // Use 'else if' to prevent issues if both flags somehow true
                this.x += currentAppliedSpeed;
            }
            
            // Keep paddle within bounds
            this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));
            
            // Gradually reduce swipe velocity (momentum decay)
            if (this.swipeVelocity > 0) {
                this.swipeVelocity *= 0.95; // Decay factor
                if (this.swipeVelocity < 0.5) { // Threshold to stop momentum
                    this.swipeVelocity = 0;
                }
            }
        },
        
        reset: function() {
            this.width = 60; // Reset width if it can change
            this.x = (GAME_WIDTH - this.width) / 2;
            this.swipeVelocity = 0; // Reset momentum
            this.isMovingLeft = false;
            this.isMovingRight = false;
            
            if (game.currentDimension === DIMENSIONS.REVERSE) {
                this.y = 10;
            } else {
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
        dimensionBrickChance: 0.1
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
                
                const isDimensionBrick = Math.random() < brickConfig.dimensionBrickChance;
                
                bricks[r][c] = {
                    x: brickX, y: brickY,
                    width: brickConfig.width, height: brickConfig.height,
                    status: 1,
                    color: isDimensionBrick ? COLORS.DIMENSION_BRICK : COLORS.BRICK_COLORS[r % COLORS.BRICK_COLORS.length],
                    isDimensionBrick: isDimensionBrick,
                    targetDimension: isDimensionBrick ? getRandomDimension() : null
                };
                game.bricksRemaining++;
            }
        }
    }
    
    function getRandomDimension() {
        const dimensions = Object.values(DIMENSIONS);
        const availableDimensions = dimensions.filter(dim => dim !== game.currentDimension);
        return availableDimensions.length > 0 ? availableDimensions[Math.floor(Math.random() * availableDimensions.length)] : DIMENSIONS.NORMAL;
    }
    
    function drawBricks() {
        for (let r = 0; r < brickConfig.rows; r++) {
            for (let c = 0; c < brickConfig.cols; c++) {
                const brick = bricks[r][c];
                if (brick.status === 1) {
                    ctx.beginPath();
                    ctx.rect(brick.x, brick.y, brick.width, brick.height);
                    ctx.fillStyle = brick.color;
                    ctx.fill();
                    
                    if (brick.isDimensionBrick) {
                        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.stroke();
                        const pulseSize = 1 + 0.2 * Math.sin(Date.now() / 200);
                        ctx.beginPath();
                        ctx.rect(brick.x - 2 * pulseSize, brick.y - 2 * pulseSize, brick.width + 4 * pulseSize, brick.height + 4 * pulseSize);
                        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)'; ctx.lineWidth = 1; ctx.stroke();
                    } else {
                        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
                    }
                    ctx.closePath();
                }
            }
        }
    }
    
    function brickCollisionDetection() {
        for (let r = 0; r < brickConfig.rows; r++) {
            for (let c = 0; c < brickConfig.cols; c++) {
                const b = bricks[r][c];
                if (b.status === 1) {
                    if (ball.x + ball.radius > b.x && ball.x - ball.radius < b.x + b.width &&
                        ball.y + ball.radius > b.y && ball.y - ball.radius < b.y + b.height) {
                        
                        // Determine collision side to correctly reflect ball
                        const overlapX = (ball.x < b.x + b.width/2 ? (b.x + b.width) - (ball.x - ball.radius) : (ball.x + ball.radius) - b.x);
                        const overlapY = (ball.y < b.y + b.height/2 ? (b.y + b.height) - (ball.y - ball.radius) : (ball.y + ball.radius) - b.y);

                        if (overlapX < overlapY) { // Horizontal collision
                           ball.dx = -ball.dx;
                        } else { // Vertical collision
                           ball.dy = -ball.dy;
                        }
                        
                        b.status = 0; game.score += 10; game.bricksRemaining--;
                        
                        if (window.gameEffects && window.gameEffects.createBrickBreakEffect) {
                            const breakEffect = window.gameEffects.createBrickBreakEffect(ctx, b);
                            window.gameEffects.addAnimation(breakEffect);
                        }
                        
                        if (b.isDimensionBrick && b.targetDimension) {
                            shiftDimension(b.targetDimension);
                        }
                        
                        if (game.bricksRemaining === 0) {
                            game.state = GAME_STATE.LEVEL_COMPLETE;
                        }
                        return; // Process one brick collision per frame
                    }
                }
            }
        }
    }
    
    function shiftDimension(newDimension) {
        if (game.dimensionShiftActive) return;
        game.dimensionShiftActive = true; game.targetDimension = newDimension;
        game.state = GAME_STATE.DIMENSION_SHIFT;
        
        if (window.gameEffects && window.gameEffects.createDimensionShiftEffect) {
            game.dimensionShiftAnimation = window.gameEffects.createDimensionShiftEffect(canvas, ctx, game.currentDimension, newDimension);
        }
        setTimeout(completeDimensionShift, 500);
    }
    
    function completeDimensionShift() {
        game.currentDimension = game.targetDimension;
        applyDimensionEffects();
        game.dimensionShiftActive = false; game.dimensionShiftAnimation = null;
        game.state = GAME_STATE.PLAYING;
    }
    
    function applyDimensionEffects() {
        if (window.gameEffects && window.gameEffects.applyDimensionTheme) {
            window.gameEffects.applyDimensionTheme(game.currentDimension, game, ball, paddle, COLORS);
        }
        paddle.reset(); // Reset paddle position/state for new dimension
        ball.reset();   // Reset ball state for new dimension consistency

        switch (game.currentDimension) {
            case DIMENSIONS.NORMAL: game.timeScale = 1.0; break;
            case DIMENSIONS.REVERSE: game.timeScale = 1.0; break;
            case DIMENSIONS.TIME: game.timeScale = 0.5; break;
        }
    }
    
    function drawScore() { ctx.font = '14px Arial'; ctx.fillStyle = COLORS.TEXT; ctx.textAlign = 'left'; ctx.fillText(`Score: ${game.score}`, 10, 20); }
    function drawLives() { ctx.font = '14px Arial'; ctx.fillStyle = COLORS.TEXT; ctx.textAlign = 'right'; ctx.fillText(`Lives: ${game.lives}`, GAME_WIDTH - 10, 20); }
    function drawDimension() { ctx.font = '12px Arial'; ctx.fillStyle = COLORS.TEXT; ctx.textAlign = 'center'; ctx.fillText(`Dimension: ${game.currentDimension.toUpperCase()}`, GAME_WIDTH / 2, 20); }
    
    function drawMenu() {
        ctx.fillStyle = COLORS.TEXT; ctx.font = '24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('BRICK BREAKER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        ctx.font = '16px Arial';
        ctx.fillText('Press SPACE or Tap to Start', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '12px Arial';
        ctx.fillText('Arrows or Swipe to Move Paddle', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        ctx.fillText('Up/Down/Scroll also control paddle', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }
    
    function drawGameOver() {
        ctx.fillStyle = COLORS.TEXT; ctx.font = '24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        ctx.font = '16px Arial';
        ctx.fillText(`Final Score: ${game.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillText('Press SPACE or Tap to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
    function drawLevelComplete() {
        ctx.fillStyle = COLORS.TEXT; ctx.font = '24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        ctx.font = '16px Arial';
        ctx.fillText(`Score: ${game.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillText('Press SPACE or Tap to Continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
    // This function is called by gameControls.pressSpacebar
    function handleSpaceBar() {
        switch (game.state) {
            case GAME_STATE.MENU: startGame(); break;
            case GAME_STATE.GAME_OVER: resetGame(); break;
            case GAME_STATE.LEVEL_COMPLETE: nextLevel(); break;
            case GAME_STATE.PAUSED: game.state = GAME_STATE.PLAYING; break;
        }
    }
    
    function startGame() { game.state = GAME_STATE.PLAYING; resetGame(); } // Reset game ensures fresh start
    
    function resetGame() {
        game.score = 0; game.lives = 3; game.level = 1;
        game.currentDimension = DIMENSIONS.NORMAL;
        brickConfig.dimensionBrickChance = 0.1; // Reset chance
        ball.speed = 2; // Reset ball base speed
        applyDimensionEffects(); // This calls ball.reset() and paddle.reset()
        initBricks();
        game.state = GAME_STATE.PLAYING; // Set to playing after reset
    }
    
    function nextLevel() {
        game.level++;
        ball.speed += 0.25; // Slightly increase ball base speed
        paddle.dx += 0.25; // Optionally increase paddle base speed
        brickConfig.dimensionBrickChance = Math.min(0.35, brickConfig.dimensionBrickChance + 0.025);
        applyDimensionEffects(); // This calls ball.reset() and paddle.reset() for new level
        initBricks();
        game.state = GAME_STATE.PLAYING;
    }
    
    function handleResize() {
        const container = document.querySelector('.game-container');
        let targetWidth, targetHeight;

        if (container) {
            targetWidth = container.clientWidth;
            targetHeight = container.clientHeight;
        } else {
            // Fallback if no container: use window inner dimensions
            console.warn(".game-container not found. Using window dimensions for scaling.");
            targetWidth = window.innerWidth;
            targetHeight = window.innerHeight;
        }
        
        const scaleX = targetWidth / GAME_WIDTH;
        const scaleY = targetHeight / GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY) * (container ? 1 : 0.9); // Apply slight margin if using window
        
        canvas.style.width = `${GAME_WIDTH * scale}px`;
        canvas.style.height = `${GAME_HEIGHT * scale}px`;
    }
    
    function update() {
        if (game.state === GAME_STATE.PLAYING) {
            paddle.update();
            ball.update();
        }
        // Effects update can happen regardless of play state for ongoing animations
        if (window.gameEffects && window.gameEffects.updateAnimations) {
            window.gameEffects.updateAnimations(ctx); // Pass ctx if effects need it
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw game elements based on state
        switch (game.state) {
            case GAME_STATE.MENU: drawMenu(); break;
            case GAME_STATE.PLAYING:
                drawBricks(); paddle.draw(); ball.draw();
                drawScore(); drawLives(); drawDimension();
                break;
            case GAME_STATE.GAME_OVER: drawGameOver(); break;
            case GAME_STATE.LEVEL_COMPLETE: drawLevelComplete(); break;
            case GAME_STATE.DIMENSION_SHIFT:
                if (game.dimensionShiftAnimation) game.dimensionShiftAnimation();
                else { // Fallback if animation missing
                    drawScore(); drawLives(); drawDimension(); // Show some info
                }
                break;
            case GAME_STATE.PAUSED: // Optionally draw a pause screen
                drawScore(); drawLives(); drawDimension();
                ctx.font = '20px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'center';
                ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
                break;
        }
         // Render visual effects on top (if any active ones like break particles)
        if (window.gameEffects && window.gameEffects.renderAnimations) {
            window.gameEffects.renderAnimations(ctx);
        }
    }
    
    // Main initialization function for the game
    function init() {
        if (!canvas || !ctx) {
            console.error("Canvas or context not available in init. Game cannot start.");
            return;
        }
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize
        
        // Initialize controls system
        if (window.inputControls && window.inputControls.init) {
            window.inputControls.init();
        } else {
            console.warn("Input controls module (window.inputControls) not found or init function missing.");
        }
        
        //paddle = createPaddle(); // If paddle was a factory
        //ball = createBall();   // If ball was a factory
        // Initial setup of game objects (paddle is already an object literal, assigned earlier)
        paddle.reset(); // Ensure paddle is in its start state
        ball.reset();   // Ensure ball is in its start state
        initBricks();   // Set up bricks for the first level
        
        game.state = GAME_STATE.MENU; // Start in menu state
        requestAnimationFrame(gameLoop);
    }
    
    let lastTime = 0;
    function gameLoop(timestamp) {
        const deltaTime = (timestamp - lastTime) / 1000; // Delta time in seconds
        lastTime = timestamp;
        
        update(deltaTime); // Pass deltaTime if any physics need it (optional for this game's current state)
        render();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Start the game when the page is loaded
    window.addEventListener('load', init);

})(); // End of Main Game IIFE