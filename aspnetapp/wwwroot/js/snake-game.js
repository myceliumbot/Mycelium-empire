class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gameOverlay');
        this.gameMessage = document.getElementById('gameMessage');
        this.startButton = document.getElementById('startButton');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.snake = [{ x: 10, y: 10 }];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameLoop = null;
        
        // Load high score from localStorage
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.highScoreElement.textContent = this.highScore;
        
        this.init();
    }
    
    init() {
        this.generateFood();
        this.setupEventListeners();
        this.draw();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && (e.code === 'Space' || e.key === ' ')) {
                e.preventDefault();
                this.startGame();
                return;
            }
            
            if (!this.gameRunning) return;
            
            // Prevent default behavior for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
            
            // Change direction (prevent reversing into itself)
            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (this.dy === 0) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (this.dy === 0) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.dx === 0) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.dx === 0) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
            }
        });
        
        // Start button
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
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
            if (!this.gameRunning) {
                this.startGame();
                return;
            }
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0 && this.dx === 0) {
                        // Swipe right
                        this.dx = 1;
                        this.dy = 0;
                    } else if (deltaX < 0 && this.dx === 0) {
                        // Swipe left
                        this.dx = -1;
                        this.dy = 0;
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0 && this.dy === 0) {
                        // Swipe down
                        this.dx = 0;
                        this.dy = 1;
                    } else if (deltaY < 0 && this.dy === 0) {
                        // Swipe up
                        this.dx = 0;
                        this.dy = -1;
                    }
                }
            }
        });
    }
    
    startGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.gameRunning = true;
        this.overlay.style.display = 'none';
        this.generateFood();
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 150);
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Move snake head
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
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
            this.scoreElement.textContent = this.score;
            this.generateFood();
            
            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreElement.textContent = this.highScore;
                localStorage.setItem('snakeHighScore', this.highScore.toString());
            }
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }
    
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // Make sure food doesn't spawn on snake
        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                return;
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#16213e';
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
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Snake head
                this.ctx.fillStyle = '#4ecdc4';
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, 
                                this.gridSize - 2, this.gridSize - 2);
                
                // Add eyes to head
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = 3;
                const eyeOffset = 6;
                this.ctx.fillRect(segment.x * this.gridSize + eyeOffset, 
                                segment.y * this.gridSize + eyeOffset, eyeSize, eyeSize);
                this.ctx.fillRect(segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize, 
                                segment.y * this.gridSize + eyeOffset, eyeSize, eyeSize);
            } else {
                // Snake body
                this.ctx.fillStyle = '#45b7b8';
                this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, 
                                this.gridSize - 4, this.gridSize - 4);
            }
        });
        
        // Draw food
        this.ctx.fillStyle = '#f38ba8';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        // Add sparkle effect to food
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2 - 3,
            this.food.y * this.gridSize + this.gridSize / 2 - 3,
            2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        this.gameMessage.innerHTML = `
            <h2>Game Over!</h2>
            <p>Final Score: ${this.score}</p>
            ${this.score === this.highScore ? '<p class="new-high-score">🎉 New High Score! 🎉</p>' : ''}
            <p>Press SPACE or click Start to play again</p>
        `;
        
        this.overlay.style.display = 'flex';
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});