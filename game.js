// Game elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const tapIndicator = document.getElementById('tap-indicator');

// Responsive canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - 80;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game variables
let gameSpeed = 5;
let score = 0;
let gameOver = false;
let lastFrameTime = 0;
let nextEnemyTime = 0;
const MAX_SPEED = 15;
let speedIncreaseTimer = 0;

// Player
const player = {
    x: 100,
    y: canvas.height - 80,
    width: 30,
    height: 50,
    velocityY: 0,
    jumping: false,
    ducking: false
};

// Enemies
const enemies = [];

// Game loop
function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    if (!gameOver) {
        update(deltaTime);
    }
    render();
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Player physics
    player.y += player.velocityY;
    player.velocityY += 0.5;
    
    // Ground collision
    if (player.y > canvas.height - 80) {
        player.y = canvas.height - 80;
        player.jumping = false;
        player.ducking = false;
    }
    
    // Enemy spawning
    nextEnemyTime -= deltaTime;
    if (nextEnemyTime <= 0) {
        const enemyCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < enemyCount; i++) {
            enemies.push({
                x: canvas.width + (i * 200),
                y: canvas.height - 80,
                width: 25,
                height: 60,
                speed: gameSpeed
            });
        }
        
        nextEnemyTime = 400 + Math.random() * 800;
        nextEnemyTime *= 5 / gameSpeed;
    }
    
    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].x -= enemies[i].speed;
        
        // Collision detection
        if (player.x < enemies[i].x + enemies[i].width &&
            player.x + player.width > enemies[i].x &&
            player.y < enemies[i].y + enemies[i].height &&
            player.y + player.height > enemies[i].y) {
            gameOver = true;
            gameOverElement.style.display = 'block';
        }
        
        // Remove off-screen enemies
        if (enemies[i].x + enemies[i].width < 0) {
            enemies.splice(i, 1);
            score++;
            scoreElement.textContent = score;
        }
    }
    
    // Progressive difficulty
    speedIncreaseTimer += deltaTime;
    if (speedIncreaseTimer > 1000 && gameSpeed < MAX_SPEED) {
        gameSpeed += 0.01;
        speedIncreaseTimer = 0;
    }
    
    // Difficulty spikes
    if (score > 0 && score % 100 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.5, MAX_SPEED);
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    // Draw moon
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player
    ctx.fillStyle = 'black';
    if (player.ducking) {
        ctx.fillRect(player.x, player.y, player.width, player.height/2);
    } else {
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw enemies
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y - enemy.height, enemy.width, enemy.height);
    });
    
    // Draw speed indicator
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(20, 20, 100, 10);
    ctx.fillStyle = 'white';
    ctx.fillRect(20, 20, 100 * (gameSpeed / MAX_SPEED), 10);
}

// Controls
function handleTap() {
    if (!gameOver) {
        if (!player.jumping) {
            player.velocityY = -12;
            player.jumping = true;
            player.ducking = false;
        }
    } else {
        resetGame();
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !player.jumping && !gameOver) {
        handleTap();
    }
    
    if (e.key.toLowerCase() === 'r' && gameOver) {
        resetGame();
    }
    
    if (e.key === 'ArrowDown' && !player.jumping && !gameOver) {
        player.ducking = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') {
        player.ducking = false;
    }
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTap();
});

canvas.addEventListener('mousedown', handleTap);

function resetGame() {
    player.y = canvas.height - 80;
    player.velocityY = 0;
    player.jumping = false;
    player.ducking = false;
    enemies.length = 0;
    score = 0;
    gameSpeed = 5;
    gameOver = false;
    nextEnemyTime = 0;
    speedIncreaseTimer = 0;
    scoreElement.textContent = '0';
    gameOverElement.style.display = 'none';
}

// Start game
requestAnimationFrame(gameLoop);