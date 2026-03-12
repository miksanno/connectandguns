// ═══════════════════════════════════════════════════
//  Connect 4 & Guns — Game Engine
// ═══════════════════════════════════════════════════

class ConnectFourGuns {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.board = [];
        this.currentPlayer = 1;
        this.gameOver = false;
        this.gunMode = false;
        this.guns = { 1: true, 2: true };
        this.isAnimating = false;
        this.winningCells = [];
        this.winner = 0;
        this.hoverCol = -1;

        // Audio
        this.audioCtx = null;

        // DOM refs
        this.boardEl = document.getElementById('board');
        this.previewsEl = document.getElementById('columnPreviews');
        this.statusBar = document.getElementById('statusBar');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.gunBtn = document.getElementById('gunBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.newBtn = document.getElementById('newBtn');
        this.overlay = document.getElementById('overlay');
        this.modalIcon = document.getElementById('modalIcon');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalSub = document.getElementById('modalSub');
        this.playBtn = document.getElementById('playBtn');
        this.p1Panel = document.getElementById('player1Panel');
        this.p2Panel = document.getElementById('player2Panel');
        this.p1Gun = document.getElementById('p1Gun');
        this.p2Gun = document.getElementById('p2Gun');

        this.cells = []; // 2D array of cell elements

        this.init();
    }

    // ─── Initialization ───
    init() {
        this.resetState();
        this.buildDOM();
        this.bindEvents();
        this.updateUI();
    }

    resetState() {
        this.board = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.gunMode = false;
        this.guns = { 1: true, 2: true };
        this.isAnimating = false;
        this.winningCells = [];
        this.winner = 0;
        this.hoverCol = -1;
    }

    buildDOM() {
        // Column previews
        this.previewsEl.innerHTML = '';
        this.previewCoins = [];
        for (let c = 0; c < this.COLS; c++) {
            const div = document.createElement('div');
            div.className = 'preview-cell';
            div.dataset.col = c;
            const coin = document.createElement('div');
            coin.className = 'preview-coin';
            div.appendChild(coin);
            this.previewsEl.appendChild(div);
            this.previewCoins.push(coin);
        }

        // Board cells
        this.boardEl.innerHTML = '';
        this.boardEl.classList.remove('gun-mode');
        this.cells = [];
        for (let r = 0; r < this.ROWS; r++) {
            this.cells[r] = [];
            for (let c = 0; c < this.COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                const inner = document.createElement('div');
                inner.className = 'cell-inner';
                cell.appendChild(inner);
                this.boardEl.appendChild(cell);
                this.cells[r][c] = cell;
            }
        }
    }

    bindEvents() {
        // Board — mouse
        this.boardEl.addEventListener('click', e => this.handleBoardClick(e));
        this.boardEl.addEventListener('mousemove', e => this.handleHover(e));
        this.boardEl.addEventListener('mouseleave', () => this.clearHover());

        // Board — touch
        this.boardEl.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: false });
        this.boardEl.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
        this.boardEl.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: false });

        // Buttons
        this.gunBtn.addEventListener('click', () => this.toggleGunMode());
        this.cancelBtn.addEventListener('click', () => this.cancelGunMode());
        this.newBtn.addEventListener('click', () => this.newGame());
        this.playBtn.addEventListener('click', () => this.newGame());

        // Preview row clicks
        this.previewsEl.addEventListener('click', e => {
            const cell = e.target.closest('.preview-cell');
            if (cell && !this.gunMode) this.dropCoin(parseInt(cell.dataset.col));
        });
    }

    // ─── Event Handlers ───
    handleBoardClick(e) {
        if (this.isAnimating || this.gameOver) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.gunMode) {
            if (this.board[row][col] !== 0) this.shootCoin(row, col);
        } else {
            this.dropCoin(col);
        }
    }

    handleHover(e) {
        if (this.isAnimating || this.gameOver) return;
        const cell = e.target.closest('.cell');
        if (!cell) { this.clearHover(); return; }
        const col = parseInt(cell.dataset.col);
        if (col === this.hoverCol) return;
        this.setHoverCol(col);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.isAnimating || this.gameOver) return;
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = el?.closest('.cell');
        if (!cell) return;
        const col = parseInt(cell.dataset.col);
        this.setHoverCol(col);
        this._touchCol = col;
        this._touchRow = parseInt(cell.dataset.row);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = el?.closest('.cell');
        if (!cell) { this.clearHover(); this._touchCol = -1; return; }
        const col = parseInt(cell.dataset.col);
        this.setHoverCol(col);
        this._touchCol = col;
        this._touchRow = parseInt(cell.dataset.row);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (this.isAnimating || this.gameOver) return;
        if (this._touchCol < 0) return;

        if (this.gunMode) {
            const r = this._touchRow;
            const c = this._touchCol;
            if (r !== undefined && c >= 0 && this.board[r][c] !== 0) {
                this.shootCoin(r, c);
            }
        } else {
            this.dropCoin(this._touchCol);
        }
        this.clearHover();
        this._touchCol = -1;
    }

    setHoverCol(col) {
        this.clearHover();
        this.hoverCol = col;

        if (this.gunMode) return; // no column highlights in gun mode

        // Highlight column cells
        for (let r = 0; r < this.ROWS; r++) {
            this.cells[r][col].classList.add('col-hover');
        }

        // Show preview coin
        const pc = this.previewCoins[col];
        pc.className = `preview-coin visible p${this.currentPlayer}`;

        // Show ghost coin at landing position
        const targetRow = this.getTargetRow(col);
        if (targetRow >= 0) {
            const inner = this.cells[targetRow][col].querySelector('.cell-inner');
            if (!inner.querySelector('.coin.ghost')) {
                const ghost = document.createElement('div');
                ghost.className = `coin ghost p${this.currentPlayer}`;
                inner.appendChild(ghost);
            }
        }
    }

    clearHover() {
        this.hoverCol = -1;
        // Remove column highlights
        this.boardEl.querySelectorAll('.col-hover').forEach(c => c.classList.remove('col-hover'));
        // Hide previews
        this.previewCoins.forEach(p => p.className = 'preview-coin');
        // Remove ghost coins
        this.boardEl.querySelectorAll('.coin.ghost').forEach(g => g.remove());
    }

    // ─── Game Logic ───
    getTargetRow(col) {
        for (let r = this.ROWS - 1; r >= 0; r--) {
            if (this.board[r][col] === 0) return r;
        }
        return -1;
    }

    dropCoin(col) {
        if (this.isAnimating || this.gameOver || this.gunMode) return;
        const targetRow = this.getTargetRow(col);
        if (targetRow < 0) return; // column full

        this.isAnimating = true;
        this.clearHover();
        this.board[targetRow][col] = this.currentPlayer;

        // Animate
        const inner = this.cells[targetRow][col].querySelector('.cell-inner');
        inner.querySelectorAll('.coin').forEach(c => c.remove()); // clear ghosts
        const coin = document.createElement('div');
        coin.className = `coin p${this.currentPlayer} dropping`;

        // Calculate drop distance
        const cellH = this.cells[0][0].offsetHeight + 4; // + gap
        const dropPx = -(targetRow + 1.5) * cellH;
        const dur = 0.15 + targetRow * 0.06;
        coin.style.setProperty('--drop-from', `${dropPx}px`);
        coin.style.setProperty('--drop-dur', `${dur}s`);
        inner.appendChild(coin);

        this.playDropSound(dur);

        coin.addEventListener('animationend', () => {
            coin.classList.remove('dropping');
            this.playLandSound();

            if (this.checkWin(targetRow, col)) {
                this.handleWin();
            } else if (this.isBoardFull()) {
                this.handleDraw();
            } else {
                this.switchPlayer();
            }
            this.isAnimating = false;
        }, { once: true });
    }

    shootCoin(row, col) {
        if (this.isAnimating || this.gameOver) return;
        if (this.board[row][col] === 0) return;

        this.isAnimating = true;
        this.guns[this.currentPlayer] = false;
        this.gunMode = false;
        this.boardEl.classList.remove('gun-mode');

        const player = this.board[row][col];
        const inner = this.cells[row][col].querySelector('.cell-inner');
        const coin = inner.querySelector('.coin');

        this.playGunFireSound();
        this.spawnParticles(inner, player);

        // Destroy animation
        if (coin) {
            coin.classList.add('destroying');
            coin.addEventListener('animationend', () => {
                coin.remove();
                this.performCollapse(row, col);
            }, { once: true });
        } else {
            this.performCollapse(row, col);
        }
    }

    performCollapse(shotRow, col) {
        // Update the data model: remove shot coin and shift above down
        this.board[shotRow][col] = 0;
        const shifts = [];
        for (let r = shotRow; r > 0; r--) {
            if (this.board[r - 1][col] !== 0) {
                this.board[r][col] = this.board[r - 1][col];
                this.board[r - 1][col] = 0;
                shifts.push({ from: r - 1, to: r, player: this.board[r][col] });
            }
        }

        if (shifts.length === 0) {
            this.finishShot();
            return;
        }

        // Animate collapses
        // First clear all coins in the column above the shot
        for (let r = 0; r <= shotRow; r++) {
            const inner = this.cells[r][col].querySelector('.cell-inner');
            inner.querySelectorAll('.coin').forEach(c => c.remove());
        }

        // Now render coins at their new positions with collapse animation
        let done = 0;
        const cellH = this.cells[0][0].offsetHeight + 4;

        for (const shift of shifts) {
            const inner = this.cells[shift.to][col].querySelector('.cell-inner');
            const coin = document.createElement('div');
            coin.className = `coin p${shift.player} collapsing`;
            coin.style.setProperty('--collapse-from', `${-cellH}px`);
            coin.style.setProperty('--collapse-dur', '0.25s');
            inner.appendChild(coin);

            this.playLandSound(0.05 + done * 0.06);

            coin.addEventListener('animationend', () => {
                coin.classList.remove('collapsing');
                done++;
                if (done >= shifts.length) {
                    this.finishShot();
                }
            }, { once: true });
        }
    }

    finishShot() {
        // Check win for both players (current player gets priority)
        if (this.checkWinFull()) {
            this.handleWin();
        } else if (this.isBoardFull()) {
            this.handleDraw();
        } else {
            this.switchPlayer();
        }
        this.isAnimating = false;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateUI();
    }

    // ─── Win Detection ───
    checkWin(row, col) {
        const player = this.board[row][col];
        if (!player) return false;
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        for (const [dr, dc] of dirs) {
            let cells = [[row, col]];
            for (let d = -1; d <= 1; d += 2) {
                for (let i = 1; i < 4; i++) {
                    const r = row + dr * i * d, c = col + dc * i * d;
                    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
                    if (this.board[r][c] !== player) break;
                    cells.push([r, c]);
                }
            }
            if (cells.length >= 4) {
                this.winningCells = cells;
                this.winner = player;
                return true;
            }
        }
        return false;
    }

    checkWinFull() {
        // Check current player first
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                if (this.board[r][c] === this.currentPlayer && this.checkWin(r, c)) return true;
            }
        }
        const other = this.currentPlayer === 1 ? 2 : 1;
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                if (this.board[r][c] === other && this.checkWin(r, c)) return true;
            }
        }
        return false;
    }

    isBoardFull() {
        return this.board[0].every(cell => cell !== 0);
    }

    // ─── Win / Draw ───
    handleWin() {
        this.gameOver = true;
        // Highlight winning cells
        for (const [r, c] of this.winningCells) {
            const coin = this.cells[r][c].querySelector('.coin');
            if (coin) coin.classList.add('winner');
        }
        this.playWinSound();
        setTimeout(() => this.showModal('win'), 800);
        this.updateUI();
    }

    handleDraw() {
        this.gameOver = true;
        setTimeout(() => this.showModal('draw'), 400);
        this.updateUI();
    }

    showModal(type) {
        this.overlay.classList.remove('hidden');
        this.modalTitle.className = 'modal-title';
        if (type === 'win') {
            this.modalIcon.textContent = '🏆';
            this.modalTitle.textContent = `Player ${this.winner} Wins!`;
            this.modalTitle.classList.add(`p${this.winner}-win`);
            this.modalSub.textContent = this.winner === this.currentPlayer
                ? 'Incredible play!' : 'What a twist!';
        } else {
            this.modalIcon.textContent = '🤝';
            this.modalTitle.textContent = "It's a Draw!";
            this.modalTitle.classList.add('draw');
            this.modalSub.textContent = 'Well matched!';
        }
    }

    newGame() {
        this.overlay.classList.add('hidden');
        this.resetState();
        this.buildDOM();
        this.updateUI();
    }

    // ─── Gun Mode ───
    toggleGunMode() {
        if (this.isAnimating || this.gameOver) return;
        if (!this.guns[this.currentPlayer]) return;
        this.gunMode = true;
        this.boardEl.classList.add('gun-mode');
        this.clearHover();
        this.playGunCockSound();
        this.updateUI();
    }

    cancelGunMode() {
        this.gunMode = false;
        this.boardEl.classList.remove('gun-mode');
        this.updateUI();
    }

    // ─── UI Updates ───
    updateUI() {
        const p = this.currentPlayer;
        // Status bar
        this.statusBar.className = `status-bar p${p}-turn` + (this.gunMode ? ' gun-active' : '');
        this.statusText.textContent = this.gameOver
            ? (this.winner ? `Player ${this.winner} Wins!` : "Draw!")
            : this.gunMode
                ? 'Select a coin to destroy!'
                : `Player ${p}'s Turn`;

        // Player panels
        this.p1Panel.classList.toggle('active', p === 1 && !this.gameOver);
        this.p2Panel.classList.toggle('active', p === 2 && !this.gameOver);

        // Gun statuses
        this.p1Gun.className = 'gun-status' + (this.guns[1] ? '' : ' used');
        this.p1Gun.querySelector('.gun-label').textContent = this.guns[1] ? 'Ready' : 'Used';
        this.p2Gun.className = 'gun-status' + (this.guns[2] ? '' : ' used');
        this.p2Gun.querySelector('.gun-label').textContent = this.guns[2] ? 'Ready' : 'Used';

        // Gun button
        this.gunBtn.classList.toggle('hidden', this.gunMode || this.gameOver || !this.guns[p]);
        this.gunBtn.classList.toggle('p2-active', p === 2);
        this.cancelBtn.classList.toggle('hidden', !this.gunMode);
    }

    // ─── Particles ───
    spawnParticles(container, player) {
        const color = player === 1 ? '#ff2d55' : '#ffd60a';
        for (let i = 0; i < 14; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
            const dist = 30 + Math.random() * 60;
            p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
            p.style.background = color;
            p.style.left = '50%';
            p.style.top = '50%';
            container.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    }

    // ═══════════════════════════════
    //  SOUND EFFECTS (Web Audio API)
    // ═══════════════════════════════
    ensureAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        return this.audioCtx;
    }

    playDropSound(duration = 0.3) {
        const ctx = this.ensureAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    playLandSound(delay = 0) {
        const ctx = this.ensureAudio();
        const t = ctx.currentTime + delay;
        // Thud
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.35, t);
        src.connect(filt);
        filt.connect(g);
        g.connect(ctx.destination);
        src.start(t);

        // Click
        const osc = ctx.createOscillator();
        const og = ctx.createGain();
        osc.connect(og);
        og.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);
        og.gain.setValueAtTime(0.15, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    playGunCockSound() {
        const ctx = this.ensureAudio();
        const t = ctx.currentTime;
        // Click 1
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.connect(g1); g1.connect(ctx.destination);
        o1.type = 'square';
        o1.frequency.setValueAtTime(1800, t);
        o1.frequency.exponentialRampToValueAtTime(200, t + 0.03);
        g1.gain.setValueAtTime(0.2, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        o1.start(t); o1.stop(t + 0.06);
        // Click 2
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'square';
        o2.frequency.setValueAtTime(1400, t + 0.08);
        o2.frequency.exponentialRampToValueAtTime(300, t + 0.12);
        g2.gain.setValueAtTime(0.18, t + 0.08);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        o2.start(t + 0.08); o2.stop(t + 0.15);
    }

    playGunFireSound() {
        const ctx = this.ensureAudio();
        const t = ctx.currentTime;
        // Noise burst (explosion)
        const len = ctx.sampleRate * 0.25;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.setValueAtTime(4000, t);
        filt.frequency.exponentialRampToValueAtTime(200, t + 0.25);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        src.connect(filt); filt.connect(g); g.connect(ctx.destination);
        src.start(t);

        // Sub boom
        const osc = ctx.createOscillator();
        const og = ctx.createGain();
        osc.connect(og); og.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.2);
        og.gain.setValueAtTime(0.4, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t); osc.stop(t + 0.25);
    }

    playWinSound() {
        const ctx = this.ensureAudio();
        const t = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.12;
            g.gain.setValueAtTime(0, start);
            g.gain.linearRampToValueAtTime(0.2, start + 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
            osc.start(start);
            osc.stop(start + 0.55);
        });
    }
}

// ─── Start ───
window.addEventListener('DOMContentLoaded', () => new ConnectFourGuns());
