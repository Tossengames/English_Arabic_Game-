// Game elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

// Fixed dimensions like Chrome Dino game
const WIDTH = 600;
const HEIGHT = 150;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Game variables
let gameSpeed = 5;
let score = 0;
let gameOver = false;
let lastFrameTime = 0;
let nextEnemyTime = 2000; // Initial delay
const MAX_SPEED = 15;

// Player (ninja)
const player = {
    x: 50,
    y: HEIGHT - 40,
    width: 30,
    height: 40,
    velocityY: 0,
    jumping: false
};

// Enemies (samurai)
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
    player.velocityY += 0.5; // Gravity
    
    // Ground collision
    if (player.y > HEIGHT - 40) {
        player.y = HEIGHT - 40;
        player.jumping = false;
    }
    
    // Enemy spawning - single samurai at random intervals
    nextEnemyTime -= deltaTime;
    if (nextEnemyTime <= 0 && enemies.length === 0) {
        enemies.push({
            x: WIDTH,
            y: HEIGHT - 50,
            width: 25,
            height: 50,
            speed: gameSpeed
        });
        // Random delay between 0.8-2.5 seconds
        nextEnemyTime = 800 + Math.random() * 1700;
    }
    
    // Move enemies
    for (let i = 0; i < enemies.length; i++) {
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
    
    // Increase difficulty gradually
    if (gameSpeed < MAX_SPEED) {
        gameSpeed += 0.001;
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Draw ground (rooftop)
    ctx.fillStyle = '#333';
    ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);
    
    // Draw moon
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(WIDTH - 50, 30, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player (ninja)
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw enemies (samurai)
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !player.jumping && !gameOver) {
        player.velocityY = -10;
        player.jumping = true;
    }
    
    if (e.key.toLowerCase() === 'r' && gameOver) {
        resetGame();
    }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', () => {
    if (!player.jumping && !gameOver) {
        player.velocityY = -10;
        player.jumping = true;
    }
    
    if (gameOver) {
        resetGame();
    }
});

function resetGame() {
    player.y = HEIGHT - 40;
    player.velocityY = 0;
    player.jumping = false;
    enemies.length = 0;
    score = 0;
    gameSpeed = 5;
    gameOver = false;
    nextEnemyTime = 2000;
    scoreElement.textContent = '0';
    gameOverElement.style.display = 'none';
}

// Start game
requestAnimationFrame(gameLoop);