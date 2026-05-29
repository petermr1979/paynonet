/**
 * PNN - Warp Speed Animation
 * Hyperspace effect for token transfer screen
 * Inspired by Star Wars hyperspace jump
 */

class WarpAnimation {
    constructor() {
        this.canvas = document.getElementById('warp-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.animationId = null;
        this.isRunning = false;
        this.speed = 0;
        this.targetSpeed = 0;
        
        // Star colors - blue/white theme
        this.starColors = [
            '#ffffff',
            '#e0f7ff',
            '#b3e5fc',
            '#81d4fa',
            '#4fc3f7',
            '#00d4ff',
            '#7b2fff'
        ];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
        
        // Reinitialize stars on resize
        if (!this.isRunning) {
            this.initStars();
        }
    }
    
    initStars() {
        this.stars = [];
        const starCount = Math.floor((this.width * this.height) / 100);
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push(this.createStar());
        }
    }
    
    createStar() {
        return {
            x: (Math.random() - 0.5) * this.width * 2,
            y: (Math.random() - 0.5) * this.height * 2,
            z: Math.random() * this.width,
            color: this.starColors[Math.floor(Math.random() * this.starColors.length)],
            size: Math.random() * 1.5 + 0.5
        };
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.speed = 0;
        this.targetSpeed = 50;
        this.initStars();
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        this.targetSpeed = 0;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    animate() {
        if (!this.isRunning) return;
        
        // Accelerate/decelerate
        this.speed += (this.targetSpeed - this.speed) * 0.05;
        
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 17, 0.2)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw and update stars
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.stars.forEach(star => {
            // Move star towards viewer
            star.z -= this.speed;
            
            // Reset star if it passes the viewer
            if (star.z <= 0) {
                Object.assign(star, this.createStar());
                star.z = this.width;
            }
            
            // Project 3D coordinates to 2D
            const x = (star.x / star.z) * this.width + centerX;
            const y = (star.y / star.z) * this.height + centerY;
            
            // Calculate star size based on distance
            const size = (1 - star.z / this.width) * star.size * 3;
            
            // Calculate opacity based on distance
            const opacity = (1 - star.z / this.width);
            
            // Draw star streak (line) at high speed
            if (this.speed > 20) {
                const prevX = (star.x / (star.z + this.speed * 2)) * this.width + centerX;
                const prevY = (star.y / (star.z + this.speed * 2)) * this.height + centerY;
                
                this.ctx.beginPath();
                this.ctx.moveTo(prevX, prevY);
                this.ctx.lineTo(x, y);
                this.ctx.strokeStyle = star.color;
                this.ctx.globalAlpha = opacity;
                this.ctx.lineWidth = size;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            } else {
                // Draw as point at low speed
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = star.color;
                this.ctx.globalAlpha = opacity;
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1;
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Create global instance
window.WarpAnimation = new WarpAnimation();
