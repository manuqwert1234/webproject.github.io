// Game State
const gameState = {
    screen: 'start',
    score: 0,
    health: 100,
    special: 0,
    level: 1,
    keys: {},
    player: {
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        speed: 5,
        shootTimer: 0,
        shootCooldown: 15,
        color: '#00f7ff'
    },
    projectiles: [],
    enemies: [],
    particles: [],
    powerups: [],
    gameLoop: null,
    lastEnemySpawn: 0,
    enemySpawnRate: 120,
    stars: [],
    gameTime: 0
};

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');
const healthFill = document.getElementById('health-fill');
const specialFill = document.getElementById('special-fill');
const startButton = document.querySelector('#start-screen .glowing-btn');
const restartButton = document.querySelector('#game-over-screen .glowing-btn');


function handleKeyDown(e) {
    gameState.keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'q' && gameState.special >= 100) {
        useSpecialAttack();
    }
}

function handleKeyUp(e) {
    gameState.keys[e.key.toLowerCase()] = false;
}


function showScreen(screen) {
    startScreen.style.opacity = '0';
    gameScreen.style.opacity = '0';
    gameOverScreen.style.opacity = '0';
    startScreen.style.pointerEvents = 'none';
    gameScreen.style.pointerEvents = 'none';
    gameOverScreen.style.pointerEvents = 'none';
    
    gameState.screen = screen;
    
    if (screen === 'start') {
        startScreen.style.opacity = '1';
        startScreen.style.pointerEvents = 'auto';
    } else if (screen === 'game') {
        gameScreen.style.opacity = '1';
        gameScreen.style.pointerEvents = 'auto';
    } else if (screen === 'gameOver') {
        gameOverScreen.style.opacity = '1';
        gameOverScreen.style.pointerEvents = 'auto';
        
        const highScore = localStorage.getItem('cosmicDefenderHighScore') || 0;
        if (gameState.score > highScore) {
            localStorage.setItem('cosmicDefenderHighScore', gameState.score);
            finalScoreElement.textContent = gameState.score;
            highScoreElement.textContent = gameState.score;
        } else {
            finalScoreElement.textContent = gameState.score;
            highScoreElement.textContent = highScore;
        }
    }
}

function startGame() {

    gameState.score = 0;
    gameState.health = 100;
    gameState.special = 0;
    gameState.level = 1;
    gameState.projectiles = [];
    gameState.enemies = [];
    gameState.particles = [];
    gameState.powerups = [];
    gameState.gameTime = 0;
    

    updateUI();
    

    showScreen('game');
    

    if (gameState.gameLoop) cancelAnimationFrame(gameState.gameLoop);
    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

function restartGame() {
    startGame();
}

function gameOver() {
    cancelAnimationFrame(gameState.gameLoop);
    showScreen('gameOver');
}


function updatePlayer() {

    if ((gameState.keys['w'] || gameState.keys['arrowup']) && gameState.player.y > 0) {
        gameState.player.y -= gameState.player.speed;
    }
    if ((gameState.keys['s'] || gameState.keys['arrowdown']) && gameState.player.y < canvas.height - gameState.player.height) {
        gameState.player.y += gameState.player.speed;
    }
    if ((gameState.keys['a'] || gameState.keys['arrowleft']) && gameState.player.x > 0) {
        gameState.player.x -= gameState.player.speed;
    }
    if ((gameState.keys['d'] || gameState.keys['arrowright']) && gameState.player.x < canvas.width - gameState.player.width) {
        gameState.player.x += gameState.player.speed;
    }
    

    if (gameState.player.shootTimer > 0) {
        gameState.player.shootTimer--;
    }
    
    if ((gameState.keys[' '] || gameState.keys['space']) && gameState.player.shootTimer === 0) {

        gameState.projectiles.push({
            x: gameState.player.x + gameState.player.width / 2 - 5,
            y: gameState.player.y,
            width: 10,
            height: 20,
            speed: 10,
            color: gameState.player.color,
            damage: 10
        });
        

        createParticles(
            gameState.player.x + gameState.player.width / 2,
            gameState.player.y,
            5,
            gameState.player.color,
            1
        );
        

        gameState.player.shootTimer = gameState.player.shootCooldown;
    }
}

function updateProjectiles() {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const p = gameState.projectiles[i];
        p.y -= p.speed;
        

        if (p.y + p.height < 0) {
            gameState.projectiles.splice(i, 1);
        }
    }
}

function updateEnemies() {
    // Spawn enemies
    if (gameState.gameTime - gameState.lastEnemySpawn > gameState.enemySpawnRate) {
        const enemy = {
            x: Math.random() * (canvas.width - 40),
            y: -50,
            width: 40,
            height: 40,
            speed: 1 + Math.random() * 2,
            health: 30 + Math.floor(Math.random() * 20),
            maxHealth: 30 + Math.floor(Math.random() * 20),
            color: '#ff00e6',
            points: 10
        };
        
        gameState.enemies.push(enemy);
        gameState.lastEnemySpawn = gameState.gameTime;
    }
    

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        enemy.y += enemy.speed;
        

        if (enemy.y > canvas.height) {
            takeDamage(10);
            gameState.enemies.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.02;
        
        if (p.opacity <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function checkCollisions() {

    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            

            if (
                proj.x < enemy.x + enemy.width &&
                proj.x + proj.width > enemy.x &&
                proj.y < enemy.y + enemy.height &&
                proj.y + proj.height > enemy.y
            ) {

                enemy.health -= proj.damage;
                

                if (enemy.health <= 0) {
                    gameState.score += enemy.points;
                    increaseSpecial(10);
                    createParticles(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        20,
                        enemy.color,
                        3
                    );
                    gameState.enemies.splice(j, 1);
                }
                

                gameState.projectiles.splice(i, 1);
                break;
            }
        }
    }
    

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        
        if (
            gameState.player.x < enemy.x + enemy.width &&
            gameState.player.x + gameState.player.width > enemy.x &&
            gameState.player.y < enemy.y + enemy.height &&
            gameState.player.y + gameState.player.height > enemy.y
        ) {
            takeDamage(20);
            createParticles(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                10,
                enemy.color,
                2
            );
            gameState.enemies.splice(i, 1);
        }
    }
}

function useSpecialAttack() {

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        createParticles(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            20,
            enemy.color,
            3
        );
        gameState.score += enemy.points;
    }
    
    gameState.enemies = [];
    gameState.special = 0;
    

    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50;
        createParticles(
            gameState.player.x + gameState.player.width / 2 + Math.cos(angle) * distance,
            gameState.player.y + gameState.player.height / 2 + Math.sin(angle) * distance,
            5,
            '#ffcc00',
            2
        );
    }
    
    updateUI();
}


function createParticles(x, y, count, color, speed) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            color: color,
            opacity: 1
        });
    }
}

function takeDamage(amount) {
    gameState.health -= amount;
    gameState.health = Math.max(0, gameState.health);
    updateUI();
}

function increaseSpecial(amount) {
    gameState.special += amount;
    gameState.special = Math.min(100, gameState.special);
    updateUI();
}

function generateStars() {
    gameState.stars = [];
    for (let i = 0; i < 100; i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function updateStars() {
    gameState.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}


function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    

    gameState.stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
    });
    

    drawPlayer();
    

    gameState.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        

        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.shadowBlur = 0;
    });
    

    gameState.enemies.forEach(enemy => {

        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x, enemy.y + enemy.height / 2);
        ctx.closePath();
        ctx.fill();
        

        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = `rgba(255, 0, 0, 0.7)`;
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
        ctx.fillStyle = `rgba(0, 255, 0, 0.7)`;
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 5);
    });
    

    ctx.globalAlpha = 1;
    gameState.particles.forEach(p => {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPlayer() {
    ctx.fillStyle = gameState.player.color;
    

    ctx.beginPath();
    ctx.moveTo(gameState.player.x + gameState.player.width / 2, gameState.player.y);
    ctx.lineTo(gameState.player.x + gameState.player.width, gameState.player.y + gameState.player.height);
    ctx.lineTo(gameState.player.x, gameState.player.y + gameState.player.height);
    ctx.closePath();
    ctx.fill();
    

    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(gameState.player.x + gameState.player.width * 0.3, gameState.player.y + gameState.player.height);
    ctx.lineTo(gameState.player.x + gameState.player.width * 0.5, gameState.player.y + gameState.player.height + 15);
    ctx.lineTo(gameState.player.x + gameState.player.width * 0.7, gameState.player.y + gameState.player.height);
    ctx.closePath();
    ctx.fill();
    

    if (gameState.health > 0) {
        ctx.strokeStyle = `rgba(0, 247, 255, ${gameState.health / 200})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            gameState.player.x + gameState.player.width / 2,
            gameState.player.y + gameState.player.height / 2,
            gameState.player.width * 0.8,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
}


function updateUI() {
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    healthFill.style.width = `${gameState.health}%`;
    specialFill.style.width = `${gameState.special}%`;
    
    if (gameState.health < 30) {
        healthFill.style.backgroundColor = 'var(--health-low)';
    } else {
        healthFill.style.backgroundColor = 'var(--health-color)';
    }
}


function gameLoop() {
    gameState.gameTime++;
    

    updateStars();
    updatePlayer();
    updateProjectiles();
    updateEnemies();
    updateParticles();
    checkCollisions();
    

    drawGame();
    

    const newLevel = Math.floor(gameState.score / 500) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.enemySpawnRate = Math.max(60, 120 - (gameState.level - 1) * 10);
    }
    

    if (gameState.health > 0) {
        gameState.gameLoop = requestAnimationFrame(gameLoop);
    } else {
        gameOver();
    }
}


function initGame() {
    canvas.width = gameScreen.offsetWidth;
    canvas.height = gameScreen.offsetHeight;
    
    gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
    gameState.player.y = canvas.height - gameState.player.height - 20;
    
    generateStars();
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    
    showScreen('start');
}


window.addEventListener('resize', () => {
    if (gameState.screen === 'game') {
        canvas.width = gameScreen.offsetWidth;
        canvas.height = gameScreen.offsetHeight;
        

        gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
        

        if (gameState.player.x < 0) gameState.player.x = 0;
        if (gameState.player.x + gameState.player.width > canvas.width) {
            gameState.player.x = canvas.width - gameState.player.width;
        }
        

        generateStars();
    }
});


window.addEventListener('load', initGame); 