// Game state
let currentMission = 0;
let gameState = {
    board: [],
    units: [],
    selectedUnit: null,
    currentPlayer: 'player',
    turn: 1
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const unitInfo = document.getElementById('unit-info');
const missionTitle = document.getElementById('mission-title');
const missionObjective = document.getElementById('mission-objective');
const turnIndicator = document.getElementById('turn-indicator');
const endTurnBtn = document.getElementById('end-turn-btn');
const restartBtn = document.getElementById('restart-btn');

// Initialize the game
function initGame() {
    loadMission(currentMission);
    renderBoard();
    updateUI();
    
    // Event listeners
    endTurnBtn.addEventListener('click', endTurn);
    restartBtn.addEventListener('click', () => {
        loadMission(currentMission);
        renderBoard();
        updateUI();
    });
}

// Load mission data
function loadMission(missionIndex) {
    const mission = missions[missionIndex];
    gameState = {
        board: mission.map,
        units: [],
        selectedUnit: null,
        currentPlayer: 'player',
        turn: 1
    };
    
    // Add player units
    mission.playerUnits.forEach(unit => {
        gameState.units.push({
            ...unitData[unit.type],
            x: unit.x,
            y: unit.y,
            player: 'player',
            hasMoved: false,
            hasAttacked: false
        });
    });
    
    // Add enemy units
    mission.enemyUnits.forEach(unit => {
        gameState.units.push({
            ...unitData[unit.type],
            x: unit.x,
            y: unit.y,
            player: 'enemy',
            hasMoved: false,
            hasAttacked: false
        });
    });
    
    // Update mission info
    missionTitle.textContent = `Mission ${mission.id}: ${mission.title}`;
    missionObjective.textContent = `Objective: ${mission.objective}`;
}

// Render the game board
function renderBoard() {
    gameBoard.innerHTML = '';
    
    for (let y = 0; y < gameState.board.length; y++) {
        for (let x = 0; x < gameState.board[y].length; x++) {
            const tile = document.createElement('div');
            tile.className = `tile ${gameState.board[y][x]}`;
            tile.dataset.x = x;
            tile.dataset.y = y;
            
            // Add click handler
            tile.addEventListener('click', () => handleTileClick(x, y));
            
            // Add unit if present
            const unit = getUnitAt(x, y);
            if (unit) {
                const unitElement = document.createElement('div');
                unitElement.className = `unit ${unit.type} ${unit.player}`;
                unitElement.textContent = unit.symbol;
                
                if (gameState.selectedUnit && gameState.selectedUnit.x === x && gameState.selectedUnit.y === y) {
                    unitElement.classList.add('selected');
                }
                
                tile.appendChild(unitElement);
            }
            
            gameBoard.appendChild(tile);
        }
    }
}

// Handle tile clicks
function handleTileClick(x, y) {
    const unit = getUnitAt(x, y);
    
    if (gameState.currentPlayer === 'player') {
        // If clicking on a selected unit, deselect it
        if (gameState.selectedUnit && gameState.selectedUnit.x === x && gameState.selectedUnit.y === y) {
            gameState.selectedUnit = null;
            clearHighlights();
            renderBoard();
            updateUnitInfo(null);
            return;
        }
        
        // If clicking on a player unit, select it
        if (unit && unit.player === 'player') {
            gameState.selectedUnit = unit;
            clearHighlights();
            highlightMovement(unit);
            renderBoard();
            updateUnitInfo(unit);
            return;
        }
        
        // If a unit is selected and clicking on a highlighted tile, move or attack
        if (gameState.selectedUnit) {
            const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
            
            if (tile.classList.contains('highlight-move')) {
                moveUnit(gameState.selectedUnit, x, y);
            } else if (tile.classList.contains('highlight-attack')) {
                attackUnit(gameState.selectedUnit, x, y);
            } else if (tile.classList.contains('highlight-special')) {
                useSpecialAbility(gameState.selectedUnit, x, y);
            }
        }
    }
}

// Highlight movement and attack options
function highlightMovement(unit) {
    const moves = getPossibleMoves(unit);
    
    moves.forEach(move => {
        const tile = document.querySelector(`.tile[data-x="${move.x}"][data-y="${move.y}"]`);
        if (tile) {
            if (move.type === 'move') {
                tile.classList.add('highlight-move');
            } else if (move.type === 'attack') {
                tile.classList.add('highlight-attack');
            } else if (move.type === 'special') {
                tile.classList.add('highlight-special');
            }
        }
    });
}

// Clear all highlights
function clearHighlights() {
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.remove('highlight-move', 'highlight-attack', 'highlight-special');
    });
}

// Get possible moves for a unit
function getPossibleMoves(unit) {
    const moves = [];
    const { x, y } = unit;
    
    if (unit.player === 'player' && (unit.hasMoved && unit.hasAttacked)) {
        return moves;
    }
    
    // Movement patterns based on unit type
    if (unit.name === 'Rikimaru') {
        // Knight (L-shape) movement
        const knightMoves = [
            {x: x+1, y: y+2}, {x: x-1, y: y+2},
            {x: x+1, y: y-2}, {x: x-1, y: y-2},
            {x: x+2, y: y+1}, {x: x-2, y: y+1},
            {x: x+2, y: y-1}, {x: x-2, y: y-1}
        ];
        
        knightMoves.forEach(pos => {
            if (isValidPosition(pos.x, pos.y) && !getUnitAt(pos.x, pos.y)) {
                moves.push({...pos, type: 'move'});
            }
        });
        
        // Attack adjacent
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                const target = getUnitAt(nx, ny);
                
                if (isValidPosition(nx, ny) {
                    if (target && target.player === 'enemy') {
                        moves.push({x: nx, y: ny, type: 'attack'});
                    }
                }
            }
        }
    }
    else if (unit.name === 'Ayame') {
        // Rook movement (straight lines)
        const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0},
            {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
        
        directions.forEach(dir => {
            for (let i = 1; i <= 3; i++) {
                const nx = x + dir.dx * i;
                const ny = y + dir.dy * i;
                
                if (!isValidPosition(nx, ny)) break;
                
                const target = getUnitAt(nx, ny);
                if (target) {
                    if (target.player === 'enemy' && i <= 2) {
                        moves.push({x: nx, y: ny, type: 'attack'});
                    }
                    break;
                }
                
                moves.push({x: nx, y: ny, type: 'move'});
            }
        });
        
        // Grappling Hook (jump over 1 obstacle)
        directions.forEach(dir => {
            const nx = x + dir.dx * 2;
            const ny = y + dir.dy * 2;
            const midX = x + dir.dx;
            const midY = y + dir.dy;
            
            if (isValidPosition(nx, ny) && isValidPosition(midX, midY)) {
                const midTile = gameState.board[midY][midX];
                if (midTile === 'wall' || getUnitAt(midX, midY)) {
                    if (!getUnitAt(nx, ny)) {
                        moves.push({x: nx, y: ny, type: 'special'});
                    }
                }
            }
        });
    }
    // Other units' movement patterns would be implemented similarly
    
    return moves;
}

// Move a unit to a new position
function moveUnit(unit, newX, newY) {
    if (!unit.hasMoved) {
        unit.x = newX;
        unit.y = newY;
        unit.hasMoved = true;
        
        clearHighlights();
        renderBoard();
        updateUI();
    }
}

// Attack another unit
function attackUnit(attacker, targetX, targetY) {
    const target = getUnitAt(targetX, targetY);
    
    if (target && !attacker.hasAttacked) {
        // Simple combat - attacker always wins for now
        gameState.units = gameState.units.filter(u => !(u.x === target.x && u.y === target.y));
        attacker.hasAttacked = true;
        
        clearHighlights();
        renderBoard();
        updateUI();
        
        // Check win condition
        checkWinConditions();
    }
}

// Use special ability
function useSpecialAbility(unit, targetX, targetY) {
    if (unit.name === 'Ayame' && !unit.hasMoved) {
        // Grappling Hook
        unit.x = targetX;
        unit.y = targetY;
        unit.hasMoved = true;
        
        clearHighlights();
        renderBoard();
        updateUI();
    }
    // Other special abilities would be implemented here
}

// End current player's turn
function endTurn() {
    if (gameState.currentPlayer === 'player') {
        gameState.currentPlayer = 'enemy';
        gameState.turn++;
        
        // Reset player units' movement flags
        gameState.units.forEach(unit => {
            if (unit.player === 'player') {
                unit.hasMoved = false;
                unit.hasAttacked = false;
            }
        });
        
        // Process enemy AI
        processEnemyTurn();
    } else {
        gameState.currentPlayer = 'player';
    }
    
    gameState.selectedUnit = null;
    clearHighlights();
    renderBoard();
    updateUI();
}

// Simple enemy AI
function processEnemyTurn() {
    const enemyUnits = gameState.units.filter(u => u.player === 'enemy');
    
    enemyUnits.forEach(unit => {
        // Simple AI: move toward nearest player unit or attack if in range
        const playerUnits = gameState.units.filter(u => u.player === 'player');
        if (playerUnits.length === 0) return;
        
        // Find closest player unit
        let closest = playerUnits[0];
        let minDist = distance(unit, closest);
        
        for (let i = 1; i < playerUnits.length; i++) {
            const dist = distance(unit, playerUnits[i]);
            if (dist < minDist) {
                closest = playerUnits[i];
                minDist = dist;
            }
        }
        
        // Try to attack if adjacent
        if (minDist <= 1.5) {
            attackUnit(unit, closest.x, closest.y);
        } else {
            // Move toward closest player
            const dx = closest.x - unit.x;
            const dy = closest.y - unit.y;
            
            let moveX = unit.x;
            let moveY = unit.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                moveX += dx > 0 ? 1 : -1;
            } else {
                moveY += dy > 0 ? 1 : -1;
            }
            
            if (isValidPosition(moveX, moveY) && !getUnitAt(moveX, moveY)) {
                unit.x = moveX;
                unit.y = moveY;
            }
        }
    });
    
    // After all enemies moved, switch back to player
    setTimeout(() => {
        gameState.currentPlayer = 'player';
        renderBoard();
        updateUI();
        checkWinConditions();
    }, 1000);
}

// Check win/lose conditions
function checkWinConditions() {
    const playerUnits = gameState.units.filter(u => u.player === 'player');
    const enemyUnits = gameState.units.filter(u => u.player === 'enemy');
    
    if (enemyUnits.length === 0) {
        alert('Mission accomplished!');
        // Load next mission or restart
    } else if (playerUnits.length === 0) {
        alert('Mission failed!');
        // Restart mission
    }
}

// Helper functions
function getUnitAt(x, y) {
    return gameState.units.find(u => u.x === x && u.y === y);
}

function isValidPosition(x, y) {
    return x >= 0 && y >= 0 && y < gameState.board.length && x < gameState.board[0].length && 
           gameState.board[y][x] !== 'wall';
}

function distance(unit1, unit2) {
    return Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2));
}

function updateUI() {
    turnIndicator.textContent = gameState.currentPlayer === 'player' ? 'Your Turn' : 'Enemy Turn';
    turnIndicator.style.backgroundColor = gameState.currentPlayer === 'player' ? '#c62828' : '#2e7d32';
}

function updateUnitInfo(unit) {
    const infoContent = document.querySelector('.unit-info-content');
    
    if (!unit) {
        infoContent.innerHTML = '<p>Select a unit to see details</p>';
        return;
    }
    
    let html = `
        <h3>${unit.name}</h3>
        <p>${unit.description}</p>
        <div class="unit-stats">
            <div><strong>Type:</strong></div>
            <div>${unit.type === 'ninja' ? 'Ninja' : 'Enemy'}</div>
            <div><strong>Movement:</strong></div>
            <div>${unit.movement}</div>
            <div><strong>Attack:</strong></div>
            <div>${unit.attack}</div>
            <div><strong>Special:</strong></div>
            <div>${unit.special}</div>
        </div>
    `;
    
    infoContent.innerHTML = html;
}

// Start the game
initGame();