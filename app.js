class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3;
        this.initialized = false;
    }

    resume() {
        if (!this.initialized || this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this.initialized = true;
            });
        }
    }

    playTone(freq, type, duration) {
        if (this.ctx.state === 'suspended') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playJump() {
        this.playTone(400, 'sine', 0.1);
    }

    playCollect() {
        this.playTone(800, 'square', 0.1);
        setTimeout(() => this.playTone(1200, 'square', 0.2), 100);
    }

    playCoin() {
        this.playTone(1000, 'sine', 0.05);
        setTimeout(() => this.playTone(1500, 'sine', 0.1), 50);
    }

    playMilestone() {
        this.playTone(600, 'sine', 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(1000, 'sine', 0.2), 200);
    }

    playRocket() {
        if (this.ctx.state === 'suspended') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 1.0);
        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }

    playCrash() {
        if (this.ctx.state === 'suspended') {
            this.resume();
        }
        if (this.ctx.state === 'running') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
        }
    }
}

class Bull {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 50;
        this.height = 35;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.gravity = 0.6;
        this.baseJumpStrength = -10;
        this.jumpStrength = this.baseJumpStrength;
        this.color = '#ffd700';
        this.rotation = 0;

        this.hasShield = false;
        this.isLeveraged = false;
        this.leverageTimer = 0;

        this.isRocketing = false;
        this.rocketTimer = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        let targetRotation = Math.min(Math.max(this.velocity * 0.05, -0.4), 0.4);
        if (this.isRocketing) targetRotation = -0.6;
        this.rotation += (targetRotation - this.rotation) * 0.2;

        ctx.rotate(this.rotation);

        if (this.hasShield) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.isRocketing) {
            ctx.shadowColor = '#ff4500';
            ctx.shadowBlur = 30;
            ctx.fillStyle = `rgba(255, ${Math.random() * 100 + 100}, 0, 0.8)`;
            ctx.beginPath();
            ctx.moveTo(-15, 5);
            ctx.lineTo(-35 - Math.random() * 10, 10);
            ctx.lineTo(-15, 15);
            ctx.fill();
        }

        ctx.fillStyle = (this.isLeveraged && !this.isRocketing) ? '#ff4500' : this.color;
        if (!this.hasShield && !this.isRocketing && !this.isLeveraged) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 12, 0, 0, Math.PI * 2);

        ctx.moveTo(15, 0);
        ctx.lineTo(25, -5);
        ctx.lineTo(25, 5);
        ctx.lineTo(15, 10);

        ctx.moveTo(15, -5);
        ctx.quadraticCurveTo(20, -15, 25, -20);
        ctx.lineTo(22, -22);
        ctx.quadraticCurveTo(15, -15, 12, -5);

        ctx.moveTo(10, 15);
        ctx.lineTo(15, 25);
        ctx.lineTo(10, 25);
        ctx.moveTo(-10, 15);
        ctx.lineTo(-15, 25);
        ctx.lineTo(-20, 25);

        ctx.moveTo(-18, 0);
        ctx.quadraticCurveTo(-25, -5, -28, 5);

        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(18, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(19, -2, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    update(inflationFactor) {
        if (this.isRocketing) {
            this.velocity = -2;
            this.y += this.velocity;
            this.rocketTimer--;
            if (this.rocketTimer <= 0) this.deactivateRocket();

            if (this.y < 0) this.y = 0;
            return false;
        }

        const currentGravity = this.gravity * inflationFactor;
        this.velocity += currentGravity;
        this.y += this.velocity;

        if (this.isLeveraged) {
            this.leverageTimer--;
            if (this.leverageTimer <= 0) this.deactivateLeverage();
        }

        if (this.y + this.height / 2 > this.canvas.height) {
            this.y = this.canvas.height - this.height / 2;
            return true;
        }

        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        return false;
    }

    jump() {
        if (!this.isRocketing) {
            this.velocity = this.jumpStrength;
        }
    }

    activateShield() {
        this.hasShield = true;
    }

    activateLeverage() {
        this.isLeveraged = true;
        this.jumpStrength = this.baseJumpStrength * 1.5;
        this.leverageTimer = 300;
    }

    deactivateLeverage() {
        this.isLeveraged = false;
        this.jumpStrength = this.baseJumpStrength;
    }

    activateRocket() {
        this.isRocketing = true;
        this.rocketTimer = 180;
        this.hasShield = true;
    }

    deactivateRocket() {
        this.isRocketing = false;
        this.hasShield = false;
        this.velocity = -5;
    }
}

class Obstacle {
    constructor(canvas, x, isMoving) {
        this.canvas = canvas;
        this.x = x;
        this.width = 40;
        this.gap = 220;
        this.speed = 3;
        this.color = '#ff3333';

        const minHeight = 50;
        const maxPos = canvas.height - minHeight - this.gap;
        const minPos = minHeight;
        this.gapY = Math.random() * (maxPos - minPos) + minPos;
        this.passed = false;

        this.isMoving = isMoving;
        this.moveSpeed = 2;
        this.initialGapY = this.gapY;
        this.moveOffset = 0;
        this.moveRange = 50;
    }

    draw(ctx) {
        const grad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        grad.addColorStop(0, '#cc0000');
        grad.addColorStop(0.5, '#ff3333');
        grad.addColorStop(1, '#cc0000');

        ctx.fillStyle = grad;
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 10;

        const currentGapY = this.gapY;

        ctx.fillRect(this.x, 0, this.width, currentGapY);
        ctx.fillRect(this.x + this.width / 2 - 2, currentGapY - 20, 4, 20);

        ctx.fillRect(this.x, currentGapY + this.gap, this.width, this.canvas.height - (currentGapY + this.gap));
        ctx.fillRect(this.x + this.width / 2 - 2, currentGapY + this.gap, 4, 20);
    }

    update() {
        this.x -= this.speed;

        if (this.isMoving) {
            this.moveOffset += 0.05;
            const movement = Math.sin(this.moveOffset) * this.moveRange;
            let newGapY = this.initialGapY + movement;
            if (newGapY < 50) newGapY = 50;
            if (newGapY > this.canvas.height - 50 - this.gap) newGapY = this.canvas.height - 50 - this.gap;
            this.gapY = newGapY;
        }
    }

    collidesWith(bull) {
        const bx = bull.x + 10;
        const by = bull.y + 10;
        const bw = bull.width - 20;
        const bh = bull.height - 20;

        if (bx < this.x + this.width &&
            bx + bw > this.x &&
            by < this.gapY &&
            by + bh > 0) return true;

        if (bx < this.x + this.width &&
            bx + bw > this.x &&
            by + bh > this.gapY + this.gap &&
            by < this.canvas.height) return true;

        return false;
    }
}

class PowerUp {
    constructor(canvas, x, type) {
        this.canvas = canvas;
        this.x = x;
        this.y = Math.random() * (canvas.height - 100) + 50;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.speed = 3;
        this.active = true;
        this.oscillationIndex = Math.random() * 10;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.shadowBlur = 15;
        this.oscillationIndex += 0.1;
        const offset = Math.sin(this.oscillationIndex) * 5;

        // Colors
        if (this.type === 'shield') {
            ctx.fillStyle = '#2d9d00';
            ctx.shadowColor = '#2d9d00';
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 15 + offset, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 15 + offset, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('S', this.x + 11, this.y + 19 + offset);

        } else if (this.type === 'leverage') {
            ctx.fillStyle = '#fed210';
            ctx.shadowColor = '#fed210';
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y + offset);
            ctx.lineTo(this.x + 10, this.y + 18 + offset);
            ctx.lineTo(this.x + 18, this.y + 18 + offset);
            ctx.lineTo(this.x + 8, this.y + 30 + offset);
            ctx.lineTo(this.x + 22, this.y + 12 + offset);
            ctx.lineTo(this.x + 14, this.y + 12 + offset);
            ctx.fill();

        } else if (this.type === 'rocket') {
            ctx.fillStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(this.x + 15, this.y + offset);
            ctx.lineTo(this.x + 30, this.y + 30 + offset);
            ctx.lineTo(this.x, this.y + 30 + offset);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SQ', this.x + 15, this.y + 25 + offset);
        }

        ctx.restore();
    }

    update(speed) {
        this.x -= speed;
    }

    collidesWith(bull) {
        if (!this.active) return false;
        return (bull.x < this.x + this.width &&
            bull.x + bull.width > this.x &&
            bull.y < this.y + this.height &&
            bull.y + bull.height > this.y);
    }
}

class Coin {
    constructor(canvas, x) {
        this.canvas = canvas;
        this.x = x;
        this.y = Math.random() * (canvas.height - 100) + 50;
        this.width = 20;
        this.height = 20;
        this.active = true;
        this.oscillationIndex = Math.random() * 10;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        this.oscillationIndex += 0.2;
        const squish = Math.abs(Math.sin(this.oscillationIndex));

        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y + 10, 10 * squish, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    update(speed) {
        this.x -= speed;
    }

    collidesWith(bull) {
        if (!this.active) return false;
        return (bull.x < this.x + this.width &&
            bull.x + bull.width > this.x &&
            bull.y < this.y + this.height &&
            bull.y + bull.height > this.y);
    }
}

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // Reverted to smaller size as requested
        this.size = Math.random() * 1.5;
        this.speedX = Math.random() * -0.5; // Slower, subtler
        this.alpha = Math.random() * 0.5 + 0.1;
    }

    update(gameSpeed) {
        // Less dramatic parallax
        this.x += this.speedX - (gameSpeed * 0.1);
        if (this.x < 0) {
            this.x = this.canvas.width;
            this.y = Math.random() * this.canvas.height;
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// High Score Manager
class HighScoreManager {
    constructor() {
        this.scores = JSON.parse(localStorage.getItem('dailyBullHighScores')) || [
            { name: 'Satoshi', score: 12.50 },
            { name: 'HODLer', score: 8.00 },
            { name: 'PaperHand', score: 3.50 }
        ];
    }

    getScores() {
        return this.scores.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    isHighScore(score) {
        const tops = this.getScores();
        if (tops.length < 3) return true;
        return score > tops[tops.length - 1].score;
    }

    addScore(name, score) {
        this.scores.push({ name: name || 'Anon', score: parseFloat(score) });
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 3);
        localStorage.setItem('dailyBullHighScores', JSON.stringify(this.scores));
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();
        this.highScoreManager = new HighScoreManager();
        this.resize();

        this.bull = new Bull(this.canvas);
        this.obstacles = [];
        this.powerUps = [];
        this.coins = [];
        this.particles = [];
        for (let i = 0; i < 100; i++) this.particles.push(new Particle(this.canvas));

        this.score = 0;
        this.obstacleCounter = 0;
        this.yieldRate = 0.01;
        this.baseSpeed = 3;
        this.gameSpeed = this.baseSpeed;

        this.inflationFactor = 1.0;
        this.inflationTimer = 0;
        this.isInflationActive = false;

        this.isRunning = false;
        this.animationId = null;
        this.hasContinue = false;

        // Elements
        this.scoreElement = document.getElementById('score-value');
        this.finalScoreElement = document.getElementById('final-score');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.quoteText = document.getElementById('quote-text');
        this.continueBtn = document.getElementById('continue-btn');

        this.highScoreList = document.getElementById('high-score-list');
        this.newRecordForm = document.getElementById('new-record-form');
        this.playerNameInput = document.getElementById('player-name');
        this.submitScoreBtn = document.getElementById('submit-score-btn');

        this.quotes = [
            "The market can remain irrational longer than you can remain solvent.",
            "Buy high, sell low.",
            "Liquidity crunch!",
            "Rug pulled.",
            "HODL didn't work this time.",
            "Pigs get slaughtered."
        ];

        this.updateLeaderboardUI();

        window.addEventListener('resize', () => this.resize());

        this.handleInput = (e) => {
            this.audio.resume();

            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return; // Don't jump if typing

            if (e.type === 'keydown' && e.code !== 'Space') return;
            if (e.type === 'touchstart') e.preventDefault();
            if (this.isRunning) {
                this.bull.jump();
                if (!this.bull.isRocketing) this.audio.playJump();
            }
        };

        window.addEventListener('keydown', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput, { passive: false });
        this.canvas.addEventListener('mousedown', this.handleInput);

        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.addEventListener('click', (e) => {
            this.audio.resume();
            this.start();
        });

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => {
            this.audio.resume();
            this.restart();
        });

        if (this.continueBtn) this.continueBtn.addEventListener('click', () => {
            this.audio.resume();
            this.continueGame();
        });

        if (this.submitScoreBtn) this.submitScoreBtn.addEventListener('click', () => {
            const name = this.playerNameInput.value.toUpperCase().substring(0, 10);
            this.highScoreManager.addScore(name, this.score);
            this.updateLeaderboardUI();
            // Return to menu
            this.gameOverScreen.classList.add('hidden');
            this.gameOverScreen.classList.remove('active');
            this.startScreen.classList.remove('hidden');
            this.startScreen.classList.add('active');
        });
    }

    updateLeaderboardUI() {
        this.highScoreList.innerHTML = '';
        const scores = this.highScoreManager.getScores();
        scores.forEach((entry, index) => {
            const li = document.createElement('li');
            li.innerText = `${index + 1}. ${entry.name} : ${entry.score.toFixed(2)}%`;
            this.highScoreList.appendChild(li);
        });
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.score = 0;
        this.obstacleCounter = 0;
        this.yieldRate = 0.01;
        this.gameSpeed = this.baseSpeed;
        this.obstacles = [];
        this.powerUps = [];
        this.coins = [];
        this.bull = new Bull(this.canvas);
        this.hasContinue = true;

        this.inflationFactor = 1.0;
        this.isInflationActive = false;

        this.audio.resume();

        this.startScreen.classList.add('hidden');
        this.startScreen.classList.remove('active');
        this.gameOverScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('active');

        this.lastTime = performance.now();
        this.spawnTimer = 0;

        this.loop(performance.now());
    }

    restart() {
        this.start();
    }

    continueGame() {
        this.isRunning = true;
        this.gameOverScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('active');
        this.hasContinue = false;

        this.bull.y = this.canvas.height / 2;
        this.bull.velocity = 0;
        this.bull.activateShield();

        this.obstacles = this.obstacles.filter(obs => obs.x > 300);
        this.audio.playCollect();

        this.lastTime = performance.now();
        this.loop(performance.now());
    }

    gameOver() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        this.audio.playCrash();

        if (this.finalScoreElement) this.finalScoreElement.innerText = this.score.toFixed(2);

        const quote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        if (this.quoteText) this.quoteText.innerText = `"${quote}"`;

        // Check High Score
        if (this.highScoreManager.isHighScore(this.score)) {
            this.newRecordForm.classList.remove('hidden');
            this.playerNameInput.value = '';
            // Hide standard buttons while entering name
            document.querySelector('.button-container').style.display = 'none';
        } else {
            this.newRecordForm.classList.add('hidden');
            document.querySelector('.button-container').style.display = 'flex';
        }

        // Only show Continue if NOT a high score entry flow (simplify UI)
        // OR show it anyway? Let's say if you bail out you can still get high score later.
        if (this.score > 50 && this.hasContinue && !this.highScoreManager.isHighScore(this.score)) {
            this.continueBtn.classList.remove('hidden');
            this.continueBtn.style.display = 'block';
        } else {
            this.continueBtn.classList.add('hidden');
            this.continueBtn.style.display = 'none';
        }

        this.gameOverScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('active');
    }

    spawnObstacle() {
        const x = this.canvas.width;
        this.obstacleCounter++;
        const isMoving = (this.obstacleCounter % 4 === 0);
        this.obstacles.push(new Obstacle(this.canvas, x, isMoving));

        if (this.obstacleCounter % (3 + Math.floor(Math.random() * 2)) === 0) {
            setTimeout(() => this.spawnPowerUp(x + 150), 100);
        }

        if (Math.random() > 0.3) {
            this.spawnCoin(x + 100);
            if (Math.random() > 0.5) setTimeout(() => this.spawnCoin(x + 150), 200);
        }
    }

    spawnPowerUp(x) {
        const rand = Math.random();
        let type = 'shield';
        if (rand > 0.5) type = 'leverage';
        if (rand > 0.85) type = 'rocket';
        this.powerUps.push(new PowerUp(this.canvas, x, type));
    }

    spawnCoin(x) {
        this.coins.push(new Coin(this.canvas, x));
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Particles
        this.particles.forEach(p => {
            p.update(this.gameSpeed);
            p.draw(this.ctx);
        });

        // Inflation
        if (Math.random() < 0.001 && !this.isInflationActive) {
            this.isInflationActive = true;
            this.inflationTimer = 300;
        }

        if (this.isInflationActive) {
            this.inflationFactor = 1.3;
            this.inflationTimer--;

            this.ctx.fillStyle = 'rgba(254, 210, 16, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fed210';
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 40px Share Tech Mono';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText("⚠ INFLATION ⚠", this.canvas.width / 2, 100);
            this.ctx.shadowBlur = 0;

            if (this.inflationTimer <= 0) {
                this.isInflationActive = false;
                this.inflationFactor = 1.0;
            }
        } else {
            this.inflationFactor = 1.0;
        }

        if (this.bull.update(this.inflationFactor)) {
            this.gameOver();
            return;
        }
        this.bull.draw(this.ctx);

        // Difficulty
        let currentYieldRate = this.yieldRate;
        if (this.bull.isLeveraged) {
            this.gameSpeed = this.baseSpeed * 1.5;
            currentYieldRate *= 2;
        } else if (this.bull.isRocketing) {
            this.gameSpeed = this.baseSpeed * 3.0;
            currentYieldRate *= 5;
        } else {
            this.gameSpeed = this.baseSpeed + (this.score * 0.005);
            currentYieldRate = 0.01 + (this.score * 0.001);
        }

        // Milestone
        if (Math.floor(this.score) > 0 && Math.floor(this.score) % 100 === 0 && (this.score - Math.floor(this.score) < currentYieldRate)) {
            this.ctx.fillStyle = '#2d9d00';
            this.ctx.font = 'bold 36px Share Tech Mono';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("ATH BREAKOUT!", this.canvas.width / 2, 150);
            this.audio.playMilestone();
        }

        this.spawnTimer++;
        const spawnInterval = Math.max(40, Math.floor(300 / this.gameSpeed));
        if (this.spawnTimer > spawnInterval) {
            if (Math.random() > 0.3 && !this.bull.isRocketing) {
                this.spawnObstacle();
                this.spawnTimer = 0;
            } else if (this.bull.isRocketing && Math.random() > 0.1) {
                this.spawnObstacle();
                this.spawnTimer = 0;
            }
        }

        // --- COINS UPDATE ---
        for (let i = this.coins.length - 1; i >= 0; i--) {
            let c = this.coins[i];
            c.update(this.gameSpeed);
            c.draw(this.ctx);
            if (c.collidesWith(this.bull)) {
                this.audio.playCoin();
                this.score += 2.0;
                this.coins.splice(i, 1);
                continue;
            }
            if (c.x < -50) this.coins.splice(i, 1);
        }

        // --- POWERUPS UPDATE ---
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let p = this.powerUps[i];
            p.update(this.gameSpeed);
            p.draw(this.ctx);
            if (p.collidesWith(this.bull)) {
                this.audio.playCollect();
                if (p.type === 'shield') this.bull.activateShield();
                if (p.type === 'leverage') this.bull.activateLeverage();
                if (p.type === 'rocket') {
                    this.bull.activateRocket();
                    this.audio.playRocket();
                }
                this.powerUps.splice(i, 1);
                continue;
            }
            if (p.x + p.width < 0) this.powerUps.splice(i, 1);
        }

        // --- OBSTACLES UPDATE ---
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.speed = this.gameSpeed;
            obs.update();
            obs.draw(this.ctx);

            if (obs.collidesWith(this.bull)) {
                if (this.bull.isRocketing) {
                    this.obstacles.splice(i, 1);
                    this.score += 5;
                    continue;
                }
                if (this.bull.hasShield) {
                    this.bull.hasShield = false;
                    this.obstacles.splice(i, 1);
                    this.audio.playCollect();
                    continue;
                } else {
                    this.gameOver();
                    return;
                }
            }

            if (!obs.passed && obs.x + obs.width < this.bull.x) {
                this.score += 1.5;
                obs.passed = true;
            }

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        this.score += currentYieldRate;
        if (this.scoreElement) this.scoreElement.innerText = this.score.toFixed(2);

        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }
}

window.onload = () => {
    const game = new Game();
};
