document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');

    const buttons = {
        up: document.getElementById('upButton'),
        down: document.getElementById('downButton'),
        left: document.getElementById('leftButton'),
        right: document.getElementById('rightButton')
    };

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    let snake = [];
    let food = { x: 5, y: 5 };
    let dx = 0, dy = 0, nextDx = 0, nextDy = 0;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameInterval = null;
    let gameSpeed = 100;
    let gameStarted = false;

    // --- Sistema de Som (Web Audio API) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(freq, type, duration) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    }

    function soundEat() { playSound(600, 'sine', 0.1); }
    function soundDie() { playSound(150, 'sawtooth', 0.4); }

    // --- Lógica do Jogo ---

    function generateFood() {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        if (snake.some(part => part.x === food.x && part.y === food.y)) generateFood();
    }

    function draw() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cobra
        snake.forEach((part, index) => {
            ctx.fillStyle = (index === 0) ? '#61dafb' : '#4fa3d7';
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
        });

        // Comida
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);

        // UI de Pontuação
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Score: ${score}`, 10, 25);
        ctx.fillText(`Recorde: ${highScore}`, 10, 45);
    }

    function update() {
        if (!gameStarted || (dx === 0 && dy === 0)) return;

        dx = nextDx; dy = nextDy;
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || 
            snake.some(part => part.x === head.x && part.y === head.y)) {
            return gameOver();
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score++;
            soundEat();
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
            }
            generateFood();
            increaseSpeed();
        } else {
            snake.pop();
        }
    }

    function increaseSpeed() {
        if (gameSpeed > 50) {
            gameSpeed -= 2;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }

    function gameLoop() { update(); draw(); }

    function startGame() {
        if (gameStarted) return;
        if (audioCtx.state === 'suspended') audioCtx.resume(); // Necessário para navegadores modernos

        snake = [{ x: 10, y: 10 }];
        nextDx = dx = 1; nextDy = dy = 0;
        score = 0;
        gameSpeed = 100;
        gameStarted = true;
        startButton.textContent = 'Reiniciar';
        generateFood();
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }

    function gameOver() {
        soundDie();
        gameStarted = false;
        clearInterval(gameInterval);
        alert(`Fim de Jogo! Pontuação: ${score}`);
    }

    function changeDirection(newDx, newDy) {
        if (newDx === -dx && newDx !== 0) return;
        if (newDy === -dy && newDy !== 0) return;
        nextDx = newDx; nextDy = newDy;
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowUp') changeDirection(0, -1);
        if (e.key === 'ArrowDown') changeDirection(0, 1);
        if (e.key === 'ArrowLeft') changeDirection(-1, 0);
        if (e.key === 'ArrowRight') changeDirection(1, 0);
    });

    buttons.up.onclick = () => changeDirection(0, -1);
    buttons.down.onclick = () => changeDirection(0, 1);
    buttons.left.onclick = () => changeDirection(-1, 0);
    buttons.right.onclick = () => changeDirection(1, 0);
    startButton.onclick = startGame;

    draw();
});