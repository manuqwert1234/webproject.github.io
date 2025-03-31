const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 400;
canvas.height = 600;

// Game variables
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;

// Bird properties
const bird = {
    x: canvas.width / 4,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.5,
    jumpForce: -8
};

// Pipe properties
const pipeWidth = 60;
const pipeGap = 150;
const pipeSpacing = 200;
let pipes = [];

// Colors
const colors = {
    bird: '#f1c40f',
    pipe: '#2ecc71',
    background: '#2c3e50'
};

// Game state management
function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    generatePipes();
    update();
}

function endGame() {
    gameOver = true;
    gameStarted = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
    }
    document.getElementById('final-score').textContent = `Score: ${score}`;
    document.getElementById('high-score').textContent = `High Score: ${highScore}`;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Game mechanics
function generatePipes() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: height,
        bottomHeight: canvas.height - height - pipeGap,
        passed: false
    });
}

function updatePipes() {
    if (pipes.length === 0 || canvas.width - pipes[pipes.length - 1].x >= pipeSpacing) {
        generatePipes();
    }

    pipes.forEach(pipe => {
        pipe.x -= 2;

        // Score point when passing pipe
        if (!pipe.passed && bird.x > pipe.x + pipeWidth) {
            pipe.passed = true;
            score++;
            document.getElementById('score').textContent = `Score: ${score}`;
        }

        // Check collision
        if (checkCollision(pipe)) {
            endGame();
        }
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function checkCollision(pipe) {
    const birdRight = bird.x + bird.width;
    const birdBottom = bird.y + bird.height;

    // Collision with top pipe
    if (birdRight > pipe.x && bird.x < pipe.x + pipeWidth &&
        bird.y < pipe.topHeight) {
        return true;
    }

    // Collision with bottom pipe
    if (birdRight > pipe.x && bird.x < pipe.x + pipeWidth &&
        birdBottom > canvas.height - pipe.bottomHeight) {
        return true;
    }

    // Collision with canvas boundaries
    if (bird.y < 0 || birdBottom > canvas.height) {
        return true;
    }

    return false;
}

// Drawing functions
function drawBird() {
    ctx.fillStyle = colors.bird;
    ctx.beginPath();
    ctx.ellipse(bird.x + bird.width/2, bird.y + bird.height/2, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawPipes() {
    ctx.fillStyle = colors.pipe;
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        // Bottom pipe
        ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight);
    });
}

function draw() {
    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawPipes();
    drawBird();
}

// Game loop
function update() {
    if (!gameStarted || gameOver) return;

    // Update bird position
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    updatePipes();
    draw();
    requestAnimationFrame(update);
}

// Event listeners
function handleInput() {
    if (gameOver) return;
    if (!gameStarted) {
        startGame();
    }
    bird.velocity = bird.jumpForce;
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        handleInput();
    }
});

canvas.addEventListener('click', handleInput);
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', startGame);

// Initial setup
draw();