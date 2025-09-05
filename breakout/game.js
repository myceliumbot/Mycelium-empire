(() => {
  const canvas = document.getElementById('gameCanvas');
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext('2d');

  // Game config
  const config = {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    paddle: {
      width: 120,
      height: 16,
      speed: 520,
      marginBottom: 28,
      color: '#8bd1ff',
    },
    ball: {
      radius: 8,
      speed: 360,
      color: '#9bffb0',
      speedGrowthPerLevel: 40,
      maxSpeed: 680,
    },
    bricks: {
      rows: 5,
      cols: 12,
      width: 70,
      height: 24,
      padding: 10,
      offsetTop: 80,
      offsetLeft: 30,
    },
    gameplay: {
      lives: 3,
    }
  };

  // Game state
  const state = {
    running: false,
    paused: false,
    gameOver: false,
    level: 1,
    score: 0,
    lives: config.gameplay.lives,
    lastFrameTs: 0,
  };

  // Entities
  const paddle = {
    width: config.paddle.width,
    height: config.paddle.height,
    x: (config.canvasWidth - config.paddle.width) / 2,
    color: config.paddle.color,
  };

  const ball = {
    x: config.canvasWidth / 2,
    y: config.canvasHeight - config.paddle.marginBottom - config.paddle.height - config.ball.radius - 2,
    dx: config.ball.speed * (Math.random() > 0.5 ? 1 : -1),
    dy: -config.ball.speed,
    radius: config.ball.radius,
    color: config.ball.color,
  };

  /** @type {{x:number,y:number,status:number}[][]} */
  let bricks = [];

  function createBricks() {
    const { rows, cols } = config.bricks;
    bricks = [];
    for (let c = 0; c < cols; c += 1) {
      bricks[c] = [];
      for (let r = 0; r < rows; r += 1) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }
  }

  function resetBall(centerOnPaddle) {
    ball.x = centerOnPaddle ? paddle.x + paddle.width / 2 : config.canvasWidth / 2;
    ball.y = config.canvasHeight - config.paddle.marginBottom - config.paddle.height - ball.radius - 2;
    const angle = (Math.random() * 40 + 70) * (Math.PI / 180); // 70-110 degrees
    const speed = Math.min(config.ball.speed + (state.level - 1) * config.ball.speedGrowthPerLevel, config.ball.maxSpeed);
    ball.dx = speed * Math.cos(angle) * (Math.random() < 0.5 ? -1 : 1);
    ball.dy = -Math.abs(speed * Math.sin(angle));
  }

  function nextLevel() {
    state.level += 1;
    config.bricks.rows = Math.min(10, config.bricks.rows + 1);
    createBricks();
    resetBall(true);
  }

  // Input handling
  const keysDown = new Set();
  document.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) e.preventDefault();
    keysDown.add(e.key);

    if (e.key === ' ' || e.key === 'Spacebar') {
      if (!state.running && !state.gameOver) {
        state.running = true;
      } else if (state.running) {
        state.paused = !state.paused;
      }
    }
  });
  document.addEventListener('keyup', (e) => keysDown.delete(e.key));

  // Mouse / touch control
  function pointerToCanvasX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    return (clientX - rect.left) * scaleX;
  }

  canvas.addEventListener('mousemove', (e) => {
    const x = pointerToCanvasX(e.clientX);
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, x - paddle.width / 2));
  });

  canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const x = pointerToCanvasX(touch.clientX);
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, x - paddle.width / 2));
  }, { passive: true });

  // UI buttons
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  startBtn.addEventListener('click', () => { if (!state.running) state.running = true; });
  pauseBtn.addEventListener('click', () => { if (state.running) state.paused = !state.paused; });
  restartBtn.addEventListener('click', () => restartGame());

  function restartGame() {
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.level = 1;
    state.score = 0;
    state.lives = config.gameplay.lives;
    config.bricks.rows = 5;
    createBricks();
    paddle.x = (canvas.width - paddle.width) / 2;
    resetBall(false);
  }

  // Update loop
  function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;

    const leftPressed = keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('A');
    const rightPressed = keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D');

    if (leftPressed && !rightPressed) {
      paddle.x = Math.max(0, paddle.x - config.paddle.speed * dt);
    } else if (rightPressed && !leftPressed) {
      paddle.x = Math.min(canvas.width - paddle.width, paddle.x + config.paddle.speed * dt);
    }

    ball.x += ball.dx * dt;
    ball.y += ball.dy * dt;

    // Wall collisions
    if (ball.x + ball.radius > canvas.width) { ball.x = canvas.width - ball.radius; ball.dx = -Math.abs(ball.dx); }
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.dx = Math.abs(ball.dx); }
    if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.dy = Math.abs(ball.dy); }

    // Paddle collision
    if (ball.y + ball.radius >= canvas.height - config.paddle.marginBottom - paddle.height &&
        ball.y + ball.radius <= canvas.height - config.paddle.marginBottom + 2) {
      if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.width && ball.dy > 0) {
        const collidePoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const angle = collidePoint * (Math.PI / 3); // -60deg .. +60deg
        const speed = Math.hypot(ball.dx, ball.dy);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -Math.abs(speed * Math.cos(angle));
        ball.y = canvas.height - config.paddle.marginBottom - paddle.height - ball.radius - 0.01;
      }
    }

    // Bottom out
    if (ball.y - ball.radius > canvas.height) {
      state.lives -= 1;
      if (state.lives <= 0) {
        state.gameOver = true;
        state.running = false;
      } else {
        resetBall(true);
      }
    }

    // Brick collisions
    const { width: bw, height: bh, padding: bp, offsetTop: bt, offsetLeft: bl, cols, rows } = config.bricks;
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        const b = bricks[c][r];
        if (b.status !== 1) continue;
        const bx = c * (bw + bp) + bl;
        const by = r * (bh + bp) + bt;
        b.x = bx; b.y = by;

        // Circle-rect collision (approx): check bounds then reflect
        if (ball.x + ball.radius > bx && ball.x - ball.radius < bx + bw &&
            ball.y + ball.radius > by && ball.y - ball.radius < by + bh) {
          b.status = 0;
          state.score += 10;
          // Determine collision side by penetration
          const overlapLeft = ball.x + ball.radius - bx;
          const overlapRight = (bx + bw) - (ball.x - ball.radius);
          const overlapTop = ball.y + ball.radius - by;
          const overlapBottom = (by + bh) - (ball.y - ball.radius);
          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);
          if (minOverlapX < minOverlapY) {
            ball.dx = ball.x < bx ? -Math.abs(ball.dx) : Math.abs(ball.dx);
          } else {
            ball.dy = ball.y < by ? -Math.abs(ball.dy) : Math.abs(ball.dy);
          }
        }
      }
    }

    // Check level cleared
    const remaining = bricks.flat().filter(b => b.status === 1).length;
    if (remaining === 0) {
      nextLevel();
    }
  }

  // Draw helpers
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0c132a');
    g.addColorStop(1, '#0b0f24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawPaddle() {
    const y = canvas.height - config.paddle.marginBottom - paddle.height;
    ctx.fillStyle = paddle.color;
    roundRect(ctx, paddle.x, y, paddle.width, paddle.height, 8);
    ctx.fill();
  }

  function drawBall() {
    ctx.beginPath();
    ctx.fillStyle = ball.color;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBricks() {
    const { width: bw, height: bh, padding: bp, offsetTop: bt, offsetLeft: bl, cols, rows } = config.bricks;
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        const b = bricks[c][r];
        if (b.status !== 1) continue;
        const x = c * (bw + bp) + bl;
        const y = r * (bh + bp) + bt;
        ctx.fillStyle = `hsl(${(r * 36 + c * 5) % 360} 80% 60% / 0.95)`;
        roundRect(ctx, x, y, bw, bh, 8);
        ctx.fill();
      }
    }
  }

  function drawHud() {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${state.score}`, 16, 14);
    ctx.fillText(`Lives: ${state.lives}`, 16, 36);
    ctx.fillText(`Level: ${state.level}`, 16, 58);

    if (!state.running && !state.gameOver) {
      drawCenterText('Press Start or Space', '14px', 0);
    }
    if (state.paused) {
      drawCenterText('Paused', '18px', -20);
      drawCenterText('Press Space to Resume', '14px', 8);
    }
    if (state.gameOver) {
      drawCenterText('Game Over', '18px', -20);
      drawCenterText('Press Restart', '14px', 8);
    }
  }

  function drawCenterText(text, size, dy) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `${size} Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + dy);
    ctx.textAlign = 'left';
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function gameLoop(ts) {
    const dt = Math.min(0.033, (ts - state.lastFrameTs) / 1000 || 0);
    state.lastFrameTs = ts;

    drawBackground();
    drawBricks();
    drawPaddle();
    drawBall();
    drawHud();

    update(dt);

    requestAnimationFrame(gameLoop);
  }

  // Init
  function init() {
    createBricks();
    resetBall(false);
    requestAnimationFrame(gameLoop);

    // Accessibility: focus canvas on start
    document.getElementById('startBtn').addEventListener('click', () => canvas.focus());

    // Resize: keep CSS responsive, canvas pixels fixed at 960x600 for simplicity
    window.addEventListener('resize', () => { /* CSS handles size */ });
  }

  init();
})();