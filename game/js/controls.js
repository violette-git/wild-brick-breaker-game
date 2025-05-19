// File: controls.js

(function() {
    // Control state
    const controlState = {
        leftPressed: false,
        rightPressed: false,
        // paddleSpeed: 5, // This is more of a game/paddle property now
        touchSensitivity: 1.0
    };
    
    // Touch control variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    let isTouching = false;
    let lastSwipeVelocity = 0; // Carries velocity for the game to use
    let swipeDirection = null;
    
    // Initialize keyboard controls
    function initKeyboardControls() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }
    
    // Handle key down events
    function handleKeyDown(e) {
        let stateChanged = false;
        // Original controls
        if (e.key === 'ArrowLeft' || e.key === 'Left') {
            controlState.leftPressed = true; stateChanged = true;
        } else if (e.key === 'ArrowRight' || e.key === 'Right') {
            controlState.rightPressed = true; stateChanged = true;
        } 
        // New controls: Down arrow key for moving left
        else if (e.key === 'ArrowDown' || e.key === 'Down') {
            controlState.leftPressed = true; stateChanged = true;
        } 
        // New controls: Up arrow key for moving right
        else if (e.key === 'ArrowUp' || e.key === 'Up') {
            controlState.rightPressed = true; stateChanged = true;
        }
        // Spacebar control
        else if (e.key === ' ' || e.key === 'Spacebar') {
            if (window.gameControls && typeof window.gameControls.pressSpacebar === 'function') {
                window.gameControls.pressSpacebar();
            }
        }

        if (stateChanged) {
            // For keyboard, new swipe velocity is not generated.
            // We pass current lastSwipeVelocity, but game's setPaddleMovement logic should handle this.
            // Ideally, keyboard presses shouldn't inject swipe velocity.
            // To ensure keyboard doesn't use lingering swipe, explicitly pass 0 for swipeVelocity.
            // However, to allow combined control (e.g., swipe then tap key), this is complex.
            // Current simplified approach: `updatePaddleMovement` passes `lastSwipeVelocity`.
            // If it's a pure key event, this might be 0 or a stale value.
            // Let's be explicit for key presses: they don't generate *new* swipe velocity.
            // If a swipe is active, its velocity persists via paddle.swipeVelocity.
            // Key presses should only set direction.
            // So, we update the direction state, and `updatePaddleMovement` sends it.
            // If `lastSwipeVelocity` is non-zero from a recent swipe, it will be sent.
            // The game.setPaddleMovement can decide if a new swipeVelocity param > 0 overrides, or if keypresses nullify it.
            // My `setPaddleMovement` in the previous answer: if swipeVelocity param > 0, it updates paddle.swipeVelocity.
            // This means key presses (which would call with default 0 or old `lastSwipeVelocity`) won't *set* a new one.
            // This behavior is reasonable.
            updatePaddleMovement();
        }
    }
    
    // Handle key up events
    function handleKeyUp(e) {
        let stateChanged = false;
        if (e.key === 'ArrowLeft' || e.key === 'Left') {
            controlState.leftPressed = false; stateChanged = true;
        } else if (e.key === 'ArrowRight' || e.key === 'Right') {
            controlState.rightPressed = false; stateChanged = true;
        } else if (e.key === 'ArrowDown' || e.key === 'Down') {
            controlState.leftPressed = false; stateChanged = true;
        } else if (e.key === 'ArrowUp' || e.key === 'Up') {
            controlState.rightPressed = false; stateChanged = true;
        }

        if (stateChanged) {
            updatePaddleMovement();
        }
    }
    
    // Update paddle movement based on control state
    function updatePaddleMovement() {
        if (window.gameControls && typeof window.gameControls.setPaddleMovement === 'function') {
            window.gameControls.setPaddleMovement(
                controlState.leftPressed,
                controlState.rightPressed,
                lastSwipeVelocity // This is key for touch momentum
            );
        }
    }
    
    // Initialize touch controls
    function initTouchControls() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error("Touch controls: gameCanvas element not found!");
            return;
        }
        
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault(); 
            isTouching = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchEndX = touchStartX; 
            touchEndY = touchStartY; 
            touchStartTime = Date.now();
            
            lastSwipeVelocity = 0; // Reset for a new touch interaction
            swipeDirection = null;
            
            controlState.leftPressed = false;
            controlState.rightPressed = false;
            updatePaddleMovement(); // Send initial state (no move, no velocity)
        }, { passive: false });
        
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            if (isTouching) {
                touchEndX = e.touches[0].clientX;
                touchEndY = e.touches[0].clientY;
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const touchTime = Math.max(1, Date.now() - touchStartTime); 
                
                const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / touchTime;
                lastSwipeVelocity = velocity * controlState.touchSensitivity * 50;
                
                controlState.leftPressed = false; 
                controlState.rightPressed = false;

                if (Math.abs(deltaX) > Math.abs(deltaY) * 0.5) { 
                    if (deltaX < 0) {
                        swipeDirection = 'left'; controlState.leftPressed = true;
                    } else {
                        swipeDirection = 'right'; controlState.rightPressed = true;
                    }
                } else if (Math.abs(deltaY) > Math.abs(deltaX) * 2) {
                    if (deltaY < 0) { // Up swipe maps to right
                        swipeDirection = 'up'; controlState.rightPressed = true;
                    } else { // Down swipe maps to left
                        swipeDirection = 'down'; controlState.leftPressed = true;
                    }
                } else {
                    swipeDirection = null;
                    lastSwipeVelocity = 0; // No clear direction, no velocity
                }
                updatePaddleMovement();
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', function(e) {
            e.preventDefault();
            if (isTouching) {
                isTouching = false;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const touchTime = Math.max(1, Date.now() - touchStartTime);
                
                if (touchTime > 50 && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / touchTime;
                    lastSwipeVelocity = velocity * controlState.touchSensitivity * 50;
                    
                    if (swipeDirection === 'left' || swipeDirection === 'down') {
                        controlState.leftPressed = true; controlState.rightPressed = false;
                    } else if (swipeDirection === 'right' || swipeDirection === 'up') {
                        controlState.leftPressed = false; controlState.rightPressed = true;
                    } else {
                        controlState.leftPressed = false; controlState.rightPressed = false;
                        lastSwipeVelocity = 0; // No velocity if no valid swipe direction
                    }
                    updatePaddleMovement(); // Send final swipe state
                    
                    // Momentum effect: directional flags reset after timeout, but lastSwipeVelocity is NOT reset here.
                    // The game's paddle.swipeVelocity uses it and decays it.
                    setTimeout(function() {
                        controlState.leftPressed = false;
                        controlState.rightPressed = false;
                        // DO NOT RESET lastSwipeVelocity here for momentum.
                        updatePaddleMovement(); // Inform game that direct press ended
                    }, 300); 
                } else { // Tap or insignificant movement
                    controlState.leftPressed = false;
                    controlState.rightPressed = false;
                    lastSwipeVelocity = 0;
                    updatePaddleMovement();
                    
                    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchTime < 200) { // Tap
                        if (window.gameControls && typeof window.gameControls.pressSpacebar === 'function') {
                            window.gameControls.pressSpacebar();
                        }
                    }
                }
            }
        }, { passive: false });
        
        canvas.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            if (isTouching) {
                isTouching = false;
                controlState.leftPressed = false;
                controlState.rightPressed = false;
                lastSwipeVelocity = 0;
                swipeDirection = null;
                updatePaddleMovement();
            }
        }, { passive: false });
    }
    
    // Initialize scroll wheel controls
    function initScrollWheelControls() {
        const targetElement = document.getElementById('gameCanvas') || document; // Prefer canvas

        targetElement.addEventListener('wheel', function(e) {
            // Only act if the event target is the canvas or if canvas doesn't exist (document fallback)
            const gameCanvas = document.getElementById('gameCanvas');
            if (gameCanvas && !gameCanvas.contains(e.target) && e.target !== gameCanvas) {
                 return; // Ignore scroll if not on canvas (and canvas exists)
            }
            e.preventDefault();
            
            lastSwipeVelocity = 0; // Scroll is a discrete nudge, not a swipe

            if (e.deltaY > 0) { // Scrolling down - move paddle left
                controlState.leftPressed = true; controlState.rightPressed = false;
            } else if (e.deltaY < 0) { // Scrolling up - move paddle right
                controlState.leftPressed = false; controlState.rightPressed = true;
            }
            updatePaddleMovement();
            
            setTimeout(function() {
                controlState.leftPressed = false;
                controlState.rightPressed = false;
                updatePaddleMovement();
            }, 100); // Reset after a short delay
        }, { passive: false });
    }
    
    // Adjust touch sensitivity
    function setTouchSensitivity(value) {
        controlState.touchSensitivity = Math.max(0.1, Math.min(2.0, value));
    }
    
    // Initialize all controls
    function initAllControls() {
        initKeyboardControls();
        initTouchControls();
        initScrollWheelControls();
    }
    
    // Expose control interface for the main game to initialize controls
    window.inputControls = {
        init: initAllControls,
        setTouchSensitivity: setTouchSensitivity
        // Removed original `window.controls.getState` as the game directly uses paddle state.
        // If needed, it could be re-added, but `updatePaddleMovement` is the primary interface.
    };
})();