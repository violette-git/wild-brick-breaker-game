// controls.js - Handles keyboard and touch input for the game

class Controls {
    constructor(game) {
        this.game = game;
        this.leftPressed = false;
        this.rightPressed = false;
        
        // Touch control variables
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;
        this.touchSensitivity = 5; // Minimum pixels to detect a swipe
        
        // Bind event handlers to maintain 'this' context
        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
        this.touchStartHandler = this.touchStartHandler.bind(this);
        this.touchMoveHandler = this.touchMoveHandler.bind(this);
        this.touchEndHandler = this.touchEndHandler.bind(this);
        
        // Add keyboard event listeners
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        
        // Add touch event listeners
        this.game.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        this.game.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        this.game.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
        
        // Prevent default touch behaviors on the canvas
        this.game.canvas.style.touchAction = 'none';
    }
    
    // Handle key down events
    keyDownHandler(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            this.rightPressed = true;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            this.leftPressed = true;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            // Space bar to start the game or release the ball
            if (this.game.state === 'start' || this.game.state === 'ready') {
                this.game.startGame();
            } else if (this.game.state === 'gameOver') {
                // Restart the game
                this.game.start();
            }
        }
    }
    
    // Handle key up events
    keyUpHandler(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            this.rightPressed = false;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            this.leftPressed = false;
        }
    }
    
    // Handle touch start event
    touchStartHandler(e) {
        e.preventDefault(); // Prevent default touch behaviors like scrolling
        
        if (e.touches.length > 0) {
            // Store the initial touch position
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isTouching = true;
            
            // Handle game state changes on tap
            if (this.game.state === 'start' || this.game.state === 'ready') {
                this.game.startGame();
            } else if (this.game.state === 'gameOver') {
                this.game.start();
            }
        }
    }
    
    // Handle touch move event
    touchMoveHandler(e) {
        e.preventDefault(); // Prevent default touch behaviors like scrolling
        
        if (!this.isTouching || e.touches.length === 0) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        // Calculate the distance moved
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;
        
        // Determine swipe direction if movement exceeds sensitivity threshold
        if (Math.abs(deltaX) > this.touchSensitivity || Math.abs(deltaY) > this.touchSensitivity) {
            // Determine primary direction of swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe is dominant
                if (deltaX > 0) {
                    // Right swipe
                    this.leftPressed = false;
                    this.rightPressed = true;
                } else {
                    // Left swipe
                    this.leftPressed = true;
                    this.rightPressed = false;
                }
            } else {
                // Vertical swipe is dominant
                if (deltaY > 0) {
                    // Down swipe - move left
                    this.leftPressed = true;
                    this.rightPressed = false;
                } else {
                    // Up swipe - move right
                    this.leftPressed = false;
                    this.rightPressed = true;
                }
            }
            
            // Update touch start position for continuous movement
            this.touchStartX = touchX;
            this.touchStartY = touchY;
        }
    }
    
    // Handle touch end event
    touchEndHandler(e) {
        e.preventDefault(); // Prevent default touch behaviors
        
        // Reset touch state
        this.isTouching = false;
        this.leftPressed = false;
        this.rightPressed = false;
    }
    
    // Reset control states
    reset() {
        this.leftPressed = false;
        this.rightPressed = false;
        this.isTouching = false;
    }
    
    // Clean up event listeners when no longer needed
    destroy() {
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        this.game.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.game.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        this.game.canvas.removeEventListener('touchend', this.touchEndHandler);
    }
    
    // Adjust touch sensitivity
    setTouchSensitivity(value) {
        this.touchSensitivity = value;
    }
}