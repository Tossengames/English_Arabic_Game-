// Game Constants
const MAP_SIZE = 15;
const TERRAIN_TYPES = {
    PLAIN: { moveCost: 1, defense: 0, color: '#8bc34a' },
    FOREST: { moveCost: 2, defense: 1, color: '#4CAF50' },
    MOUNTAIN: { moveCost: 3, defense: 2, color: '#795548' },
    BASE: { moveCost: 1, defense: 5, color: '#ff9800', heal: 10, income: 50 },
    CASTLE: { moveCost: 1, defense: 10, color: '#f44336', heal: 15, income: 100 }
};

// Unit Classes
class Unit {
    constructor(type, x, y, isPlayer) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;
        this.moved = false;
        this.attacked = false;
        this.updateStats();
        this.currentHp = this.maxHp;
    }

    updateStats() {
        const units = {
            // Player units
            Rikimaru: { move: 3, minRange: 1, maxRange: 2, maxHp: 120, attack: 25, defense: 20 },
            Ayame: { move: 5, minRange: 1, maxRange: 1, maxHp: 80, attack: 15, defense: 10 },
            Tissu: { move: 3, minRange: 1, maxRange: 3, maxHp: 100, attack: 20, defense: 15 },
            Rin: { move: 4, minRange: 1, maxRange: 2, maxHp: 90, attack: 18, defense: 12 },
            Tatsumaru: { move: 4, minRange: 1, maxRange: 1, maxHp: 110, attack: 22, defense: 18 },
            
            // Enemy units
            Samurai: { move: 4, minRange: 1, maxRange: 1, maxHp: 100, attack: 20, defense: 15 },
            Archer: { move: 3, minRange: 3, maxRange: 3, maxHp: 60, attack: 18, defense: 5 },
            SpearSamurai: { move: 3, minRange: 1, maxRange: 2, maxHp: 70, attack: 22, defense: 8 }
        };
        
        Object.assign(this, units[this.type]);
    }

    canMove() {
        return !this.moved;
    }

    canAttack() {
        return !this.attacked;
    }

    resetTurn() {
        this.moved = false;
        this.attacked = false;
    }

    takeDamage(damage) {
        this.currentHp -= damage;
        if (this.currentHp <= 0) {
            this.currentHp = 0;
            return true; // Unit died
        }
        return false;
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    }
}

// Game State
const gameState = {
    board: [],
    playerUnits: [],
    enemyUnits: [],
    selectedUnit: null,
    currentPlayer: 'player',
    playerGold: 500,
    enemyGold: 500,
    bases: [],
    castle: null
};

// Initialize Game
function initGame() {
    createBoard();
    placeUnits();
    renderBoard();
    setupEventListeners();
}

// Create Game Board
function createBoard() {
    gameState.board = [];
    gameState.bases = [];
    
    for (let y = 0; y < MAP_SIZE; y++) {
        const row = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            // Random terrain (simplified - you'll want better procedural generation)
            let terrain;
            const rand = Math.random();
            
            if (rand < 0.7) terrain = TERRAIN_TYPES.PLAIN;
            else if (rand < 0.9) terrain = TERRAIN_TYPES.FOREST;
            else terrain = TERRAIN_TYPES.MOUNTAIN;
            
            // Place castle in center
            if (x === Math.floor(MAP_SIZE/2) && y === Math.floor(MAP_SIZE/2)) {
                terrain = TERRAIN_TYPES.CASTLE;
                gameState.castle = { x, y, owner: null };
            }
            // Place some bases
            else if ((x === 3 && y === 3) || (x === MAP_SIZE-4 && y === 3) || 
                     (x === 3 && y === MAP_SIZE-4) || (x === MAP_SIZE-4 && y === MAP_SIZE-4)) {
                terrain = TERRAIN_TYPES.BASE;
                gameState.bases.push({ x, y, owner: null });
            }
            
            row.push({ terrain, unit: null });
        }
        gameState.board.push(row);
    }
}

// Place Initial Units
function placeUnits() {
    // Player starting units (top-left area)
    placeUnit(new Unit('Rikimaru', 1, 1, true));
    placeUnit(new Unit('Ayame', 2, 1, true));
    placeUnit(new Unit('Tissu', 1, 2, true));
    
    // Enemy starting units (bottom-right area)
    placeUnit(new Unit('Samurai', MAP_SIZE-2, MAP_SIZE-2, false));
    placeUnit(new Unit('Archer', MAP_SIZE-3, MAP_SIZE-2, false));
    placeUnit(new Unit('SpearSamurai', MAP_SIZE-2, MAP_SIZE-3, false));
}

function placeUnit(unit) {
    const cell = gameState.board[unit.y][unit.x];
    cell.unit = unit;
    if (unit.isPlayer) {
        gameState.playerUnits.push(unit);
    } else {
        gameState.enemyUnits.push(unit);
    }
}

// Render Board
function renderBoard() {
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${MAP_SIZE}, 40px)`;
    boardElement.style.gridTemplateRows = `repeat(${MAP_SIZE}, 40px)`;
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const cell = gameState.board[y][x];
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            cellElement.style.backgroundColor = cell.terrain.color;
            
            if (cell.terrain === TERRAIN_TYPES.BASE) cellElement.classList.add('base');
            if (cell.terrain === TERRAIN_TYPES.CASTLE) cellElement.classList.add('castle');
            
            if (cell.unit) {
                const unitElement = document.createElement('div');
                unitElement.className = `unit ${cell.unit.isPlayer ? 'player-unit' : 'enemy-unit'}`;
                unitElement.textContent = cell.unit.type.charAt(0);
                
                // HP display
                const hpElement = document.createElement('div');
                hpElement.className = 'hp-display';
                hpElement.textContent = cell.unit.currentHp;
                unitElement.appendChild(hpElement);
                
                cellElement.appendChild(unitElement);
            }
            
            cellElement.dataset.x = x;
            cellElement.dataset.y = y;
            boardElement.appendChild(cellElement);
        }
    }
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('game-board').addEventListener('click', handleCellClick);
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
}

function handleCellClick(e) {
    if (gameState.currentPlayer !== 'player') return;
    
    const cellElement = e.target.closest('.cell');
    if (!cellElement) return;
    
    const x = parseInt(cellElement.dataset.x);
    const y = parseInt(cellElement.dataset.y);
    const cell = gameState.board[y][x];
    
    // If a unit is selected
    if (gameState.selectedUnit) {
        const unit = gameState.selectedUnit;
        
        // If clicking on another unit
        if (cell.unit) {
            // If it's an enemy, try to attack
            if (!cell.unit.isPlayer && unit.canAttack()) {
                tryAttack(unit, cell.unit);
            }
            // Select the unit if it's ours
            else if (cell.unit.isPlayer) {
                selectUnit(cell.unit);
            }
        } 
        // If clicking on empty cell, try to move
        else if (unit.canMove()) {
            tryMove(unit, x, y);
        }
    } 
    // Select a unit if it's ours
    else if (cell.unit && cell.unit.isPlayer) {
        selectUnit(cell.unit);
    }
}

function selectUnit(unit) {
    gameState.selectedUnit = unit;
    updateUnitInfo(unit);
    highlightMovementRange(unit);
}

function updateUnitInfo(unit) {
    const infoElement = document.getElementById('unit-info');
    infoElement.innerHTML = `
        <h3>${unit.type}</h3>
        <p>HP: ${unit.currentHp}/${unit.maxHp}</p>
        <p>Attack: ${unit.attack}</p>
        <p>Defense: ${unit.defense}</p>
        <p>Move: ${unit.move}</p>
        <p>Range: ${unit.minRange}-${unit.maxRange}</p>
    `;
}

function highlightMovementRange(unit) {
    // TODO: Implement movement range highlighting
}

function tryMove(unit, targetX, targetY) {
    // TODO: Implement pathfinding and movement validation
    // For now, just move directly if adjacent
    if (Math.abs(unit.x - targetX) + Math.abs(unit.y - targetY) === 1) {
        // Clear old position
        gameState.board[unit.y][unit.x].unit = null;
        
        // Update unit position
        unit.x = targetX;
        unit.y = targetY;
        unit.moved = true;
        
        // Set new position
        gameState.board[targetY][targetX].unit = unit;
        
        // Check if standing on base/castle for defense
        const terrain = gameState.board[targetY][targetX].terrain;
        if (terrain === TERRAIN_TYPES.BASE || terrain === TERRAIN_TYPES.CASTLE) {
            // Defense bonus is applied during combat calculation
        }
        
        renderBoard();
        gameState.selectedUnit = null;
    }
}

function tryAttack(attacker, defender) {
    // Calculate damage
    const terrainDefense = gameState.board[defender.y][defender.x].terrain.defense;
    const damage = Math.max(1, attacker.attack - (defender.defense + terrainDefense));
    
    // Apply damage
    const killed = defender.takeDamage(damage);
    
    // Mark attacker as having attacked
    attacker.attacked = true;
    
    // Update UI
    renderBoard();
    updateUnitInfo(attacker);
    
    // Remove unit if killed
    if (killed) {
        if (defender.isPlayer) {
            gameState.playerUnits = gameState.playerUnits.filter(u => u !== defender);
        } else {
            gameState.enemyUnits = gameState.enemyUnits.filter(u => u !== defender);
        }
        gameState.board[defender.y][defender.x].unit = null;
    }
    
    // Check win/lose conditions
    checkGameEnd();
}

function endTurn() {
    // Reset all player units
    gameState.playerUnits.forEach(unit => unit.resetTurn());
    
    // Switch to enemy turn
    gameState.currentPlayer = 'enemy';
    gameState.selectedUnit = null;
    document.getElementById('unit-info').textContent = "Enemy turn...";
    
    // Process enemy AI (simplified)
    setTimeout(enemyTurn, 1000);
}

function enemyTurn() {
    // Simple AI: Move toward nearest player unit and attack
    gameState.enemyUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        
        // Find closest player unit
        let closestPlayer = null;
        let minDistance = Infinity;
        
        gameState.playerUnits.forEach(player => {
            if (player.currentHp <= 0) return;
            
            const dist = Math.abs(unit.x - player.x) + Math.abs(unit.y - player.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestPlayer = player;
            }
        });
        
        if (closestPlayer) {
            // Try to move toward player
            const dx = closestPlayer.x - unit.x;
            const dy = closestPlayer.y - unit.y;
            
            let moveX = unit.x;
            let moveY = unit.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                moveX += dx > 0 ? 1 : -1;
            } else {
                moveY += dy > 0 ? 1 : -1;
            }
            
            // Validate move
            if (moveX >= 0 && moveX < MAP_SIZE && moveY >= 0 && moveY < MAP_SIZE) {
                const targetCell = gameState.board[moveY][moveX];
                if (!targetCell.unit) {
                    // Move
                    gameState.board[unit.y][unit.x].unit = null;
                    unit.x = moveX;
                    unit.y = moveY;
                    gameState.board[moveY][moveX].unit = unit;
                    unit.moved = true;
                }
            }
            
            // Try to attack if in range
            const distAfterMove = Math.abs(unit.x - closestPlayer.x) + Math.abs(unit.y - closestPlayer.y);
            if (distAfterMove >= unit.minRange && distAfterMove <= unit.maxRange) {
                tryAttack(unit, closestPlayer);
            }
        }
    });
    
    // End enemy turn
    gameState.enemyUnits.forEach(unit => unit.resetTurn());
    gameState.currentPlayer = 'player';
    document.getElementById('unit-info').textContent = "Your turn. Select a unit.";
    renderBoard();
}

function checkGameEnd() {
    // Check if player has no units left
    if (gameState.playerUnits.every(unit => unit.currentHp <= 0)) {
        alert("Game Over! You were defeated.");
        return;
    }
    
    // Check if enemy has no units left
    if (gameState.enemyUnits.every(unit => unit.currentHp <= 0)) {
        alert("Victory! You defeated all enemies.");
        return;
    }
    
    // Check if player captured the castle
    const castleCell = gameState.board[gameState.castle.y][gameState.castle.x];
    if (castleCell.unit && castleCell.unit.isPlayer) {
        alert("Victory! You captured the castle!");
        return;
    }
}

// Start the game
initGame();