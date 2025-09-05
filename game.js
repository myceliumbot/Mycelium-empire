class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameSpeed = 150;
        
        this.initializeGame();
        this.setupEventListeners();
        this.updateHighScoreDisplay();
    }
    
    initializeGame() {
        this.overlay = document.getElementById('gameOverlay');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        this.showOverlay('Welcome to Snake!', 'Use arrow keys or WASD to move. Eat the food to grow and score points!');
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // Mobile controls
        document.getElementById('upBtn').addEventListener('click', () => this.changeDirection(0, -1));
        document.getElementById('downBtn').addEventListener('click', () => this.changeDirection(0, 1));
        document.getElementById('leftBtn').addEventListener('click', () => this.changeDirection(-1, 0));
        document.getElementById('rightBtn').addEventListener('click', () => this.changeDirection(1, 0));
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0 && this.dx !== -1) {
                    this.changeDirection(1, 0);
                } else if (deltaX < 0 && this.dx !== 1) {
                    this.changeDirection(-1, 0);
                }
            } else {
                // Vertical swipe
                if (deltaY > 0 && this.dy !== -1) {
                    this.changeDirection(0, 1);
                } else if (deltaY < 0 && this.dy !== 1) {
                    this.changeDirection(0, -1);
                }
            }
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.changeDirection(1, 0);
                break;
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    changeDirection(newDx, newDy) {
        if (this.gamePaused) return;
        
        // Prevent reverse direction
        if ((this.dx === 0 && newDx === 0) || (this.dy === 0 && newDy === 0)) {
            if (this.dx !== -newDx && this.dy !== -newDy) {
                this.dx = newDx;
                this.dy = newDy;
            }
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.hideOverlay();
        this.gameLoop();
    }
    
    restartGame() {
        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.updateScore();
        this.gameRunning = true;
        this.gamePaused = false;
        this.hideOverlay();
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            this.showOverlay('Game Paused', 'Press Space to resume or click Start to restart');
        } else {
            this.hideOverlay();
            this.gameLoop();
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        setTimeout(() => {
            this.update();
            this.draw();
            this.gameLoop();
        }, this.gameSpeed);
    }
    
    update() {
        // Move snake
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            
            // Increase speed every 50 points
            if (this.score % 50 === 0 && this.gameSpeed > 50) {
                this.gameSpeed -= 10;
            }
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw snake
        this.drawSnake();
        
        // Draw food
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head
                this.ctx.fillStyle = '#4ecdc4';
                this.ctx.shadowColor = '#4ecdc4';
                this.ctx.shadowBlur = 10;
            } else {
                // Body
                this.ctx.fillStyle = '#45b7d1';
                this.ctx.shadowColor = '#45b7d1';
                this.ctx.shadowBlur = 5;
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );
            
            // Add eyes to head
            if (index === 0) {
                this.ctx.fillStyle = 'white';
                this.ctx.shadowBlur = 0;
                
                // Eye positions based on direction
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const centerX = segment.x * this.gridSize + this.gridSize / 2;
                const centerY = segment.y * this.gridSize + this.gridSize / 2;
                
                if (this.dx === 1) { // Right
                    eyeX1 = centerX + 3; eyeY1 = centerY - 3;
                    eyeX2 = centerX + 3; eyeY2 = centerY + 3;
                } else if (this.dx === -1) { // Left
                    eyeX1 = centerX - 3; eyeY1 = centerY - 3;
                    eyeX2 = centerX - 3; eyeY2 = centerY + 3;
                } else if (this.dy === -1) { // Up
                    eyeX1 = centerX - 3; eyeY1 = centerY - 3;
                    eyeX2 = centerX + 3; eyeY2 = centerY - 3;
                } else if (this.dy === 1) { // Down
                    eyeX1 = centerX - 3; eyeY1 = centerY + 3;
                    eyeX2 = centerX + 3; eyeY2 = centerY + 3;
                } else { // Default (no movement)
                    eyeX1 = centerX + 3; eyeY1 = centerY - 3;
                    eyeX2 = centerX + 3; eyeY2 = centerY + 3;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(eyeX1, eyeY1, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(eyeX2, eyeY2, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.shadowBlur = 0;
    }
    
    drawFood() {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        return newFood;
    }
    
    gameOver() {
        this.gameRunning = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
        
        this.showOverlay(
            'Game Over!',
            `Final Score: ${this.score}\nHigh Score: ${this.highScore}`,
            true
        );
    }
    
    showOverlay(title, message, showRestart = false) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.style.display = 'flex';
        
        if (showRestart) {
            this.startButton.style.display = 'none';
            this.restartButton.style.display = 'inline-block';
        } else {
            this.startButton.style.display = 'inline-block';
            this.restartButton.style.display = 'none';
        }
    }
    
    hideOverlay() {
        this.overlay.style.display = 'none';
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.scoreElement.classList.add('updated');
        setTimeout(() => {
            this.scoreElement.classList.remove('updated');
        }, 300);
    }
    
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});