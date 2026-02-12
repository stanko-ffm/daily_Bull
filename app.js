class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3;
    }

    playTone(freq, type, duration) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
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

    playMilestone() {
        this.playTone(600, 'sine', 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(1000, 'sine', 0.2), 200);
    }

    playCrash() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
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

class Bull {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 40;
        this.height = 30;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.gravity = 0.6;
        this.baseJumpStrength = -10;
        this.jumpStrength = this.baseJumpStrength;
        this.color = '#ffd700'; // Gold
        this.rotation = 0;

        this.hasShield = false;
        this.isLeveraged = false;
        this.leverageTimer = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        this.rotation = Math.min(Math.max(this.velocity * 0.05, -0.5), 0.5);
        ctx.rotate(this.rotation);

        if (this.hasShield) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
        }

        ctx.fillStyle = this.isLeveraged ? '#ff4500' : this.color;
        ctx.shadowColor = ctx.fillStyle;
        if (!this.hasShield && !this.isLeveraged) ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(15, 10);
        ctx.lineTo(15, -5);
        ctx.lineTo(5, -5);
        ctx.lineTo(5, -15);
        ctx.lineTo(15, -20);
        ctx.lineTo(0, -10);
        ctx.lineTo(-15, -20);
        ctx.lineTo(-5, -15);
        ctx.lineTo(-15, -5);
        ctx.lineTo(-15, 10);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(5, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    update(inflationFactor) {
        const currentGravity = this.gravity * inflationFactor;
        this.velocity += currentGravity;
        this.y += this.velocity;

        if (this.isLeveraged) {
            this.leverageTimer--;
            if (this.leverageTimer <= 0) this.deactivateLeverage();
        }

        if (this.y + this.height > this.canvas.height) {
            this.y = this.canvas.height - this.height;
            return true;
        }

        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        return false;
    }

    jump() {
        this.velocity = this.jumpStrength;
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
}

class Obstacle {
    constructor(canvas, x) {
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
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        ctx.fillRect(this.x, 0, this.width, this.gapY);
        ctx.fillRect(this.x + this.width / 2 - 2, this.gapY - 20, 4, 20); // Wick

        ctx.fillRect(this.x, this.gapY + this.gap, this.width, this.canvas.height - (this.gapY + this.gap));
        ctx.fillRect(this.x + this.width / 2 - 2, this.gapY + this.gap, 4, 20); // Wick
    }

    update() {
        this.x -= this.speed;
    }

    collidesWith(bull) {
        if (bull.x < this.x + this.width &&
            bull.x + bull.width > this.x &&
            bull.y < this.gapY &&
            bull.y + bull.height > 0) return true;

        if (bull.x < this.x + this.width &&
            bull.x + bull.width > this.x &&
            bull.y + bull.height > this.gapY + this.gap &&
            bull.y < this.canvas.height) return true;

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
        this.oscillationIndex = 0;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.shadowBlur = 15;
        this.oscillationIndex += 0.1;
        const offset = Math.sin(this.oscillationIndex) * 5;

        if (this.type === 'shield') {
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 15 + offset, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', this.x + 15, this.y + 15 + offset);
        } else if (this.type === 'leverage') {
            ctx.fillStyle = '#ff8c00';
            ctx.shadowColor = '#ff8c00';
            ctx.beginPath();
            ctx.moveTo(this.x + 15, this.y + offset);
            ctx.lineTo(this.x + 30, this.y + 15 + offset);
            ctx.lineTo(this.x + 15, this.y + 30 + offset);
            ctx.lineTo(this.x, this.y + 15 + offset);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('L', this.x + 15, this.y + 15 + offset);
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

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();
        this.resize();

        this.bull = new Bull(this.canvas);
        this.obstacles = [];
        this.powerUps = [];
        this.score = 0;
        this.yieldRate = 0.01;
        this.baseSpeed = 3;
        this.gameSpeed = this.baseSpeed;

        this.inflationFactor = 1.0;
        this.inflationTimer = 0;
        this.isInflationActive = false;

        this.isRunning = false;
        this.animationId = null;
        this.hasContinue = false;

        this.scoreElement = document.getElementById('score-value');
        this.finalScoreElement = document.getElementById('final-score');
        this.highScoreElement = document.getElementById('high-score');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.quoteText = document.getElementById('quote-text');
        this.continueBtn = document.getElementById('continue-btn');

        this.highScore = localStorage.getItem('dailyBullHighScore') || 0;
        if (this.highScoreElement) this.highScoreElement.innerText = parseFloat(this.highScore).toFixed(2);

        this.quotes = [
            "The market can remain irrational longer than you can remain solvent.",
            "Buy high, sell low. Functioning as intended.",
            "It's not a loss until you sell... or hit the floor.",
            "Liquidity crunch!",
            "Rug pulled.",
            "This is financial advice: Don't crash.",
            "HODL didn't work this time.",
            "Pigs get slaughtered."
        ];

        window.addEventListener('resize', () => this.resize());

        this.handleInput = (e) => {
            if (e.type === 'keydown' && e.code !== 'Space') return;
            if (e.type === 'touchstart') e.preventDefault();
            if (this.isRunning) {
                this.bull.jump();
                this.audio.playJump();
            }
        };

        window.addEventListener('keydown', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput, { passive: false });
        this.canvas.addEventListener('mousedown', this.handleInput);

        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.addEventListener('click', () => this.start());

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => this.restart());

        if (this.continueBtn) this.continueBtn.addEventListener('click', () => this.continueGame());
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.score = 0;
        this.yieldRate = 0.01;
        this.gameSpeed = this.baseSpeed;
        this.obstacles = [];
        this.powerUps = [];
        this.bull = new Bull(this.canvas);
        this.hasContinue = true;

        this.inflationFactor = 1.0;
        this.isInflationActive = false;

        // Resume Audio Context
        if (this.audio.ctx.state === 'suspended') this.audio.ctx.resume();

        this.startScreen.classList.add('hidden');
        this.startScreen.classList.remove('active');
        this.gameOverScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('active');

        this.lastTime = performance.now();
        this.spawnTimer = 0;
        this.powerUpSpawnTimer = 0;

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

        this.audio.playCollect(); // Sound effect for revive

        this.lastTime = performance.now();
        this.loop(performance.now());
    }

    gameOver() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        this.audio.playCrash();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dailyBullHighScore', this.highScore);
            if (this.highScoreElement) this.highScoreElement.innerText = this.highScore.toFixed(2);
        }

        if (this.finalScoreElement) this.finalScoreElement.innerText = this.score.toFixed(2);

        const quote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        if (this.quoteText) this.quoteText.innerText = `"${quote}"`;

        if (this.score > 50 && this.hasContinue) {
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
        this.obstacles.push(new Obstacle(this.canvas, x));
    }

    spawnPowerUp() {
        const x = this.canvas.width;
        const type = Math.random() > 0.5 ? 'shield' : 'leverage';
        this.powerUps.push(new PowerUp(this.canvas, x, type));
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Inflation
        if (Math.random() < 0.001 && !this.isInflationActive) {
            this.isInflationActive = true;
            this.inflationTimer = 300;
        }

        if (this.isInflationActive) {
            this.inflationFactor = 1.3;
            this.inflationTimer--;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.textAlign = 'left';
            this.ctx.font = '20px Share Tech Mono';
            this.ctx.fillText("INFLATION WIND!", 20, 80);

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

        // Difficulty & Checkpoints
        let currentYieldRate = this.yieldRate;
        if (this.bull.isLeveraged) {
            this.gameSpeed = this.baseSpeed * 1.5;
            currentYieldRate *= 2;
        } else {
            this.gameSpeed = this.baseSpeed + (this.score * 0.005);
            currentYieldRate = 0.01 + (this.score * 0.001);
        }

        // Milestone handling
        if (Math.floor(this.score) > 0 && Math.floor(this.score) % 100 === 0 && (this.score - Math.floor(this.score) < currentYieldRate)) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '30px Share Tech Mono';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("ATH BREAKOUT!", this.canvas.width / 2, 150);
            this.audio.playMilestone();
        }

        this.spawnTimer++;
        const spawnInterval = Math.max(40, Math.floor(300 / this.gameSpeed));
        if (this.spawnTimer > spawnInterval) {
            if (Math.random() > 0.3) {
                this.spawnObstacle();
                this.spawnTimer = 0;
            }
        }

        this.powerUpSpawnTimer++;
        if (this.powerUpSpawnTimer > 600) {
            if (Math.random() < 0.5) {
                this.spawnPowerUp();
                this.powerUpSpawnTimer = 0;
            }
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let p = this.powerUps[i];
            p.update(this.gameSpeed);
            p.draw(this.ctx);
            if (p.collidesWith(this.bull)) {
                this.audio.playCollect();
                if (p.type === 'shield') this.bull.activateShield();
                if (p.type === 'leverage') this.bull.activateLeverage();
                this.powerUps.splice(i, 1);
                continue;
            }
            if (p.x + p.width < 0) this.powerUps.splice(i, 1);
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.speed = this.gameSpeed;
            obs.update();
            obs.draw(this.ctx);

            if (obs.collidesWith(this.bull)) {
                if (this.bull.hasShield) {
                    this.bull.hasShield = false;
                    this.obstacles.splice(i, 1);
                    this.audio.playCollect(); // Shield break sound (reused)
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
