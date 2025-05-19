// Controls handling for Brick Breaker game
(function() {
    // Control state
    const controlState = {
        leftPressed: false,
        rightPressed: false,
        paddleSpeed: 5, // Default paddle speed
        touchSensitivity: 1.0 // Default touch sensitivity (adjustable)
    };
    
    // Touch control variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    let isTouching = false;
    let lastSwipeVelocity = 0;
    let swipeDirection = null;
    
    // Initialize keyboard controls
    function initKeyboardControls() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }
    
    // Handle key down events
    function handleKeyDown(e) {
        // Original controls
        if (e.key === 'ArrowLeft' || e.key === 'Left') {
            controlState.leftPressed = true;
            updatePaddleMovement();
        } else if (e.key === 'ArrowRight' || e.key === 'Right') {
            controlState.rightPressed = true;
            updatePaddleMovement();
        } 
        // New controls: Down arrow key for moving left
        else if (e.key === 'ArrowDown' || e.key === 'Down') {
            controlState.leftPressed = true;
            updatePaddleMovement();
        } 
        // New controls: Up arrow key for moving right
        else if (e.key === 'ArrowUp' || e.key === 'Up') {
            controlState.rightPressed = true;
            updatePaddleMovement();
        }
        // Spacebar control
        else if (e.key === ' ' || e.key === 'Spacebar') {
            if (window.gameControls) {
                window.gameControls.pressSpacebar();
            }
        }
    }
    
    // Handle key up events
    function handleKeyUp(e) {
        // Original controls
        if (e.key === 'ArrowLeft' || e.key === 'Left') {
            controlState.leftPressed = false;
            updatePaddleMovement();
        } else if (e.key === 'ArrowRight' || e.key === 'Right') {
            controlState.rightPressed = false;
            updatePaddleMovement();
        }
        // New controls: Down arrow key for moving left
        else if (e.key === 'ArrowDown' || e.key === 'Down') {
            controlState.leftPressed = false;
            updatePaddleMovement();
        } 
        // New controls: Up arrow key for moving right
        else if (e.key === 'ArrowUp' || e.key === 'Up') {
            controlState.rightPressed = false;
            updatePaddleMovement();
        }
    }
    
    // Update paddle movement based on control state
    function updatePaddleMovement() {
        if (window.gameControls) {
            window.gameControls.setPaddleMovement(
                controlState.leftPressed,
                controlState.rightPressed,
                lastSwipeVelocity
            );
        }
    }
    
    // Initialize touch controls
    function initTouchControls() {
        const canvas = document.getElementById('gameCanvas');
        
        // Touch start event
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevent default touch behavior
            
            isTouching = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchEndX = touchStartX;
            touchEndY = touchStartY;
            touchStartTime = Date.now();
            
            // Reset swipe velocity and direction
            lastSwipeVelocity = 0;
            swipeDirection = null;
            
            // Reset paddle movement
            controlState.leftPressed = false;
            controlState.rightPressed = false;
            updatePaddleMovement();
        });
        
        // Touch move event
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault(); // Prevent default touch behavior
            
            if (isTouching) {
                touchEndX = e.touches[0].clientX;
                touchEndY = e.touches[0].clientY;
                
                // Calculate swipe direction and distance
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                // Calculate time elapsed since touch start
                const touchTime = Date.now() - touchStartTime;
                
                // Calculate velocity (pixels per millisecond)
                const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / touchTime;
                
                // Scale velocity by sensitivity
                lastSwipeVelocity = velocity * controlState.touchSensitivity * 50;
                
                // Determine primary swipe direction
                // For this game, we'll consider horizontal swipes as primary,
                // but also allow diagonal swipes with a horizontal component
                if (Math.abs(deltaX) > Math.abs(deltaY) * 0.5) {
                    if (deltaX < 0) {
                        // Left swipe
                        swipeDirection = 'left';
                        controlState.leftPressed = true;
                        controlState.rightPressed = false;
                    } else {
                        // Right swipe
                        swipeDirection = 'right';
                        controlState.leftPressed = false;
                        controlState.rightPressed = true;
                    }
                } else if (Math.abs(deltaY) > Math.abs(deltaX) * 2) {
                    // Vertical swipe with minimal horizontal component
                    if (deltaY < 0) {
                        // Up swipe - map to right
                        swipeDirection = 'up';
                        controlState.leftPressed = false;
                        controlState.rightPressed = true;
                    } else {
                        // Down swipe - map to left
                        swipeDirection = 'down';
                        controlState.leftPressed = true;
                        controlState.rightPressed = false;
                    }
                }
                
                // Update paddle movement
                updatePaddleMovement();
            }
        });
        
        // Touch end event
        canvas.addEventListener('touchend', function(e) {
            e.preventDefault(); // Prevent default touch behavior
            
            if (isTouching) {
                isTouching = false;
                
                // Calculate final swipe metrics
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const touchTime = Date.now() - touchStartTime;
                
                // Only process as a swipe if it's a deliberate motion
                // (not just a tap)
                if (touchTime > 50 && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                    // Calculate final velocity
                    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / touchTime;
                    lastSwipeVelocity = velocity * controlState.touchSensitivity * 50;
                    
                    // Apply momentum based on swipe velocity
                    // This will gradually decrease over time in the game loop
                    if (swipeDirection === 'left' || swipeDirection === 'down') {
                        controlState.leftPressed = true;
                        controlState.rightPressed = false;
                    } else if (swipeDirection === 'right' || swipeDirection === 'up') {
                        controlState.leftPressed = false;
                        controlState.rightPressed = true;
                    }
                    
                    // Schedule momentum decay
                    setTimeout(function() {
                        // Reset control state after momentum effect
                        controlState.leftPressed = false;
                        controlState.rightPressed = false;
                        lastSwipeVelocity = 0;
                        updatePaddleMovement();
                    }, 300); // Momentum lasts for 300ms
                } else {
                    // Handle as a tap - reset movement immediately
                    controlState.leftPressed = false;
                    controlState.rightPressed = false;
                    lastSwipeVelocity = 0;
                    updatePaddleMovement();
                    
                    // If it's a tap, trigger spacebar action
                    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchTime < 200) {
                        if (window.gameControls) {
                            window.gameControls.pressSpacebar();
                        }
                    }
                }
            }
        });
        
        // Touch cancel event (e.g., if a system dialog appears)
        canvas.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            isTouching = false;
            controlState.leftPressed = false;
            controlState.rightPressed = false;
            lastSwipeVelocity = 0;
            updatePaddleMovement();
        });
    }
    
    // Initialize scroll wheel controls
    function initScrollWheelControls() {
        document.addEventListener('wheel', function(e) {
            e.preventDefault(); // Prevent default scroll behavior
            
            // Determine scroll direction
            if (e.deltaY > 0) {
                // Scrolling down - move paddle left
                controlState.leftPressed = true;
                controlState.rightPressed = false;
            } else if (e.deltaY < 0) {
                // Scrolling up - move paddle right
                controlState.leftPressed = false;
                controlState.rightPressed = true;
            }
            
            // Update paddle movement
            updatePaddleMovement();
            
            // Reset after a short delay to prevent continuous movement
            setTimeout(function() {
                controlState.leftPressed = false;
                controlState.rightPressed = false;
                updatePaddleMovement();
            }, 100);
        }, { passive: false });
    }
    
    // Adjust touch sensitivity
    function setTouchSensitivity(value) {
        // Clamp sensitivity between 0.1 and 2.0
        controlState.touchSensitivity = Math.max(0.1, Math.min(2.0, value));
    }
    
    // Initialize controls
    function init() {
        initKeyboardControls();
        initTouchControls();
        initScrollWheelControls(); // Add scroll wheel controls
    }
    
    // Start when the page is loaded
    window.addEventListener('load', init);
    
    // Expose control interface
    window.controls = {
        getState: function() {
            return {
                leftPressed: controlState.leftPressed,
                rightPressed: controlState.rightPressed,
                swipeVelocity: lastSwipeVelocity,
                swipeDirection: swipeDirection
            };
        },
        setTouchSensitivity: setTouchSensitivity
    };
})();