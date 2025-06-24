// Game state using a single object for better organization
const gameState = {
    board: Array.from({ length: 4 }, () => Array(4).fill(0)),
    score: 0,
    bestScore: localStorage.getItem('bestScore') || 0
};

// Cache DOM elements for better performance
const elements = {
    score: document.getElementById('score'),
    finalScore: document.getElementById('final-score'),
    bestScore: document.getElementById('best-score'),
    gameOver: document.getElementById('gameover'),
    soundToggle: document.getElementById('soundToggle')
};

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    setupGame();
    newGame();
});

function setupGame() {
    setupTouchControls();
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('newGameButton').addEventListener('click', newGame);
    document.getElementById('retry-button').addEventListener('click', newGame);
    elements.soundToggle.addEventListener('click', toggleSound);
    updateBestScore();
    updateSoundIcon();
}

// Touch controls
function setupTouchControls() {
    const hammer = new Hammer(document.getElementById('grid-container'));
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
    
    const swipeHandlers = {
        swipeleft: () => handleMove('left'),
        swiperight: () => handleMove('right'),
        swipeup: () => handleMove('up'),
        swipedown: () => handleMove('down')
    };
    
    Object.entries(swipeHandlers).forEach(([event, handler]) => 
        hammer.on(event, handler));
}

// Unified move handler for both keyboard and touch
function handleMove(direction) {
    const moveMap = {
        up: () => move((i, j) => ({row: i, col: j})),
        down: () => move((i, j) => ({row: 3-i, col: j})),
        left: () => move((i, j) => ({row: j, col: i})),
        right: () => move((i, j) => ({row: j, col: 3-i}))
    };
    
    const moved = moveMap[direction]();
    if (moved) afterMove();
}

function handleKeyPress(event) {
    const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
    };
    
    const direction = keyMap[event.key];
    if (direction) {
        event.preventDefault();
        handleMove(direction);
    }
}

function newGame() {
    gameState.board = Array.from({ length: 4 }, () => Array(4).fill(0));
    gameState.score = 0;
    elements.gameOver.style.display = 'none';
    updateScore();
    generateNewNumber(2);
    updateBoard();
    soundManager?.loaded && soundManager.playSound('newGame');
}

function afterMove() {
    generateNewNumber();
    updateBoard();
    if (isGameOver()) showGameOver();
}

function generateNewNumber(count = 1) {
    const emptyCells = [];
    gameState.board.forEach((row, i) => 
        row.forEach((cell, j) => {
            if (!cell) emptyCells.push({ x: i, y: j });
        }));
    
    while (count-- > 0 && emptyCells.length) {
        const index = Math.floor(Math.random() * emptyCells.length);
        const { x, y } = emptyCells.splice(index, 1)[0];
        gameState.board[x][y] = Math.random() < 0.9 ? 2 : 4;
        
        const cell = document.getElementById(`grid-cell-${x}-${y}`);
        cell.classList.add('pop');
        setTimeout(() => cell.classList.remove('pop'), 150);
    }
}

function updateBoard() {
    gameState.board.forEach((row, i) => 
        row.forEach((value, j) => {
            const cell = document.getElementById(`grid-cell-${i}-${j}`);
            cell.textContent = value || '';
            cell.setAttribute('data-value', value);
        }));
}

function move(positionTransform) {
    let moved = false;
    let merged = false;
    
    for (let i = 0; i < 4; i++) {
        const line = [];
        const positions = [];
        
        // Extract and merge line
        for (let j = 0; j < 4; j++) {
            const pos = positionTransform(j, i);
            const value = gameState.board[pos.row][pos.col];
            if (value) {
                if (line.length && line[line.length - 1] === value) {
                    line[line.length - 1] *= 2;
                    gameState.score += line[line.length - 1];
                    merged = true;
                    handleMergeAnimation(positions[positions.length - 1]);
                } else {
                    line.push(value);
                    positions.push(pos);
                }
            }
        }
        
        // Write back
        for (let j = 0; j < 4; j++) {
            const pos = positionTransform(j, i);
            const newValue = line[j] || 0;
            if (gameState.board[pos.row][pos.col] !== newValue) {
                moved = true;
                gameState.board[pos.row][pos.col] = newValue;
            }
        }
    }
    
    if (moved) {
        updateScore();
        if (!merged && soundManager?.loaded) {
            soundManager.playSound('move');
        }
    }
    
    return moved;
}

function handleMergeAnimation(pos) {
    const cell = document.getElementById(`grid-cell-${pos.row}-${pos.col}`);
    cell.classList.add('merge');
    setTimeout(() => cell.classList.remove('merge'), 200);
    soundManager?.loaded && soundManager.playSound('merge');
}

function updateScore() {
    elements.score.textContent = gameState.score;
    elements.finalScore.textContent = gameState.score;
    
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem('bestScore', gameState.bestScore);
        updateBestScore();
    }
}

function updateBestScore() {
    elements.bestScore.textContent = gameState.bestScore;
}

function toggleSound() {
    if (window.soundManager) {
        soundManager.toggleMute();
        updateSoundIcon();
    }
}

function updateSoundIcon() {
    const icon = elements.soundToggle.querySelector('i');
    const isMuted = window.soundManager?.isMuted();
    
    icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    elements.soundToggle.classList.toggle('muted', isMuted);
}

function showGameOver() {
    elements.gameOver.style.display = 'block';
    soundManager?.loaded && soundManager.playSound('gameOver');
}

function isGameOver() {
    // Check for empty cells
    if (gameState.board.some(row => row.some(cell => !cell))) return false;
    
    // Check for possible merges
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            if (gameState.board[i][j] === gameState.board[i][j + 1] ||
                gameState.board[j][i] === gameState.board[j + 1][i]) {
                return false;
            }
        }
    }
    
    return true;
}
