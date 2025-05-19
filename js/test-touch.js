// Test script to verify touch controls functionality
// This can be used during development and removed in the final version

class TouchTester {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.swipeDirection = '';
        this.isTouching = false;
        
        // Bind methods
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.render = this.render.bind(this);
        
        // Add event listeners
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        
        // Start rendering
        this.render();
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isTouching = true;
            console.log('Touch start:', this.touchStartX, this.touchStartY);
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (this.isTouching && e.touches.length > 0) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            // Calculate the distance moved
            const deltaX = touchX - this.touchStartX;
            const deltaY = touchY - this.touchStartY;
            
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe is dominant
                this.swipeDirection = deltaX > 0 ? 'right' : 'left';
            } else {
                // Vertical swipe is dominant
                this.swipeDirection = deltaY > 0 ? 'down' : 'up';
            }
            
            console.log('Touch move:', touchX, touchY, 'Direction:', this.swipeDirection);
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.isTouching = false;
        console.log('Touch end, final direction:', this.swipeDirection);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw touch test information
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#FFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Touch Control Test', this.canvas.width / 2, 30);
        
        // Draw swipe direction
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Swipe Direction: ${this.swipeDirection || 'none'}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // Draw touch status
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Touch Active: ${this.isTouching ? 'Yes' : 'No'}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Draw instructions
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Swipe to test controls', this.canvas.width / 2, this.canvas.height - 60);
        this.ctx.fillText('Left/Down swipes move paddle left', this.canvas.width / 2, this.canvas.height - 40);
        this.ctx.fillText('Right/Up swipes move paddle right', this.canvas.width / 2, this.canvas.height - 20);
        
        // Continue rendering
        requestAnimationFrame(this.render);
    }
}

// Uncomment the following line to test touch controls
// const touchTester = new TouchTester();