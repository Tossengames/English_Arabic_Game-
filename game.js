// Game setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

// Canvas sizing
canvas.width = 800;
canvas.height = 300;

// Game variables
let gameSpeed = 5;
let score = 0;
let gameOver = false;
let lastFrameTime = 0;

// Player (ninja)
const player = {
    x: 100,
    y: canvas.height - 80,
    width: 30,
    height: 50,
    velocityY: 0,
    jumping: false
};

// Enemies (samurai)
const enemies = [];
let enemyTimer = 0;

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
    // Move player (jump physics)
    player.y += player.velocityY;
    player.velocityY += 0.5; // Gravity
    
    // Ground collision
    if (player.y > canvas.height - 80) {
        player.y = canvas.height - 80;
        player.jumping = false;
    }
    
    // Generate enemies
    enemyTimer += deltaTime;
    if (enemyTimer > 1500 / gameSpeed) { // Spawn rate based on speed
        enemies.push({
            x: canvas.width,
            y: canvas.height - 80,
            width: 25,
            height: 60
        });
        enemyTimer = 0;
    }
    
    // Move enemies
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].x -= gameSpeed;
        
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
    
    // Increase difficulty
    gameSpeed += 0.001;
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground (rooftop)
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    // Draw moon
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(700, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player (ninja)
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw enemies (samurai)
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y - enemy.height, enemy.width, enemy.height);
    });
}

// Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !player.jumping && !gameOver) {
        player.velocityY = -12;
        player.jumping = true;
    }
    
    if (e.key.toLowerCase() === 'r' && gameOver) {
        resetGame();
    }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', () => {
    if (!player.jumping && !gameOver) {
        player.velocityY = -12;
        player.jumping = true;
    }
    
    if (gameOver) {
        resetGame();
    }
});

function resetGame() {
    player.y = canvas.height - 80;
    player.velocityY = 0;
    player.jumping = false;
    enemies.length = 0;
    score = 0;
    gameSpeed = 5;
    gameOver = false;
    scoreElement.textContent = '0';
    gameOverElement.style.display = 'none';
}

// Start game
requestAnimationFrame(gameLoop);