// Game Constants
const MAP_SIZE = 12; // Slightly smaller for mobile
const TERRAIN_TYPES = {
    PLAIN: { moveCost: 1, defense: 0, color: '#8bc34a' },
    FOREST: { moveCost: 2, defense: 1, color: '#4CAF50' },
    MOUNTAIN: { moveCost: 3, defense: 2, color: '#795548' },
    BASE: { moveCost: 1, defense: 5, color: '#8B4513', heal: 10, income: 50 },
    CASTLE: { moveCost: 1, defense: 10, color: '#000', heal: 15, income: 100 }
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
    castle: null,
    movementRange: [],
    attackRange: []
};

// Initialize Game
function initGame() {
    createBoard();
    placeUnits();
    renderBoard();
    setupEventListeners();
}

// Create Game Board with better procedural generation
function createBoard() {
    gameState.board = [];
    gameState.bases = [];
    
    // Create empty board
    for (let y = 0; y < MAP_SIZE; y++) {
        const row = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            row.push({ 
                terrain: TERRAIN_TYPES.PLAIN, 
                unit: null 
            });
        }
        gameState.board.push(row);
    }
    
    // Place castle in a strategic position (not exactly center)
    const castleX = Math.floor(MAP_SIZE * 0.6);
    const castleY = Math.floor(MAP_SIZE * 0.6);
    gameState.board[castleY][castleX].terrain = TERRAIN_TYPES.CASTLE;
    gameState.castle = { x: castleX, y: castleY, owner: null };
    
    // Place bases in strategic positions
    const basePositions = [
        {x: 2, y: 2},
        {x: MAP_SIZE-3, y: 2},
        {x: 2, y: MAP_SIZE-3},
        {x: MAP_SIZE-3, y: MAP_SIZE-3}
    ];
    
    basePositions.forEach(pos => {
        gameState.board[pos.y][pos.x].terrain = TERRAIN_TYPES.BASE;
        gameState.bases.push({ ...pos, owner: null });
    });
    
    // Add some random terrain features
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            // Skip castle and bases
            if ((x === castleX && y === castleY) || 
                basePositions.some(p => p.x === x && p.y === y)) continue;
                
            const rand = Math.random();
            if (rand < 0.2) {
                gameState.board[y][x].terrain = TERRAIN_TYPES.FOREST;
            } else if (rand < 0.25) {
                gameState.board[y][x].terrain = TERRAIN_TYPES.MOUNTAIN;
            }
        }
    }
}

// Place Initial Units
function placeUnits() {
    // Clear existing units
    gameState.playerUnits = [];
    gameState.enemyUnits = [];
    
    // Player starting units (top-left area)
    placeUnit(new Unit('Rikimaru', 1, 1, true));
    placeUnit(new Unit('Ayame', 2, 1, true));
    placeUnit(new Unit('Tissu', 1, 2, true));
    
    // Enemy starting units (near castle)
    const castleX = gameState.castle.x;
    const castleY = gameState.castle.y;
    
    // Place enemies around the castle
    const enemyPositions = [
        {x: castleX-1, y: castleY},
        {x: castleX+1, y: castleY},
        {x: castleX, y: castleY-1}
    ];
    
    const enemyTypes = ['Samurai', 'Archer', 'SpearSamurai'];
    enemyPositions.forEach((pos, i) => {
        if (pos.x >= 0 && pos.x < MAP_SIZE && pos.y >= 0 && pos.y < MAP_SIZE) {
            placeUnit(new Unit(enemyTypes[i % enemyTypes.length], pos.x, pos.y, false));
        }
    });
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
            
            // Highlight movement and attack ranges
            if (gameState.movementRange.some(pos => pos.x === x && pos.y === y)) {
                cellElement.classList.add('movement-range');
            }
            if (gameState.attackRange.some(pos => pos.x === x && pos.y === y)) {
                cellElement.classList.add('attack-range');
            }
            
            if (cell.unit) {
                const unitElement = document.createElement('div');
                unitElement.className = `unit ${cell.unit.isPlayer ? 'player-unit' : 'enemy-unit'}`;
                unitElement.textContent = cell.unit.type.charAt(0);
                
                // Highlight selected unit
                if (gameState.selectedUnit === cell.unit) {
                    unitElement.classList.add('selected-unit');
                }
                
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

// Calculate Movement Range
function calculateMovementRange(unit) {
    const movementRange = [];
    const attackRange = [];
    const visited = Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill(false));
    
    // Simple BFS for movement range
    const queue = [{x: unit.x, y: unit.y, movesLeft: unit.move}];
    visited[unit.y][unit.x] = true;
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Add to movement range if it's not the unit's current position
        if (!(current.x === unit.x && current.y === unit.y)) {
            movementRange.push({x: current.x, y: current.y});
        }
        
        // Check adjacent cells
        const directions = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
        
        for (const dir of directions) {
            const newX = current.x + dir.x;
            const newY = current.y + dir.y;
            
            if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE && !visited[newY][newX]) {
                const cell = gameState.board[newY][newX];
                const moveCost = cell.terrain.moveCost;
                
                if (current.movesLeft >= moveCost && !cell.unit) {
                    visited[newY][newX] = true;
                    queue.push({x: newX, y: newY, movesLeft: current.movesLeft - moveCost});
                }
            }
        }
    }
    
    // Calculate attack range
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const distance = Math.abs(x - unit.x) + Math.abs(y - unit.y);
            if (distance >= unit.minRange && distance <= unit.maxRange) {
                attackRange.push({x, y});
            }
        }
    }
    
    gameState.movementRange = movementRange;
    gameState.attackRange = attackRange;
}

// Show Action Menu
function showActionMenu(unit, x, y) {
    const menu = document.getElementById('action-menu');
    menu.innerHTML = '';
    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    // Stay option
    const stayBtn = document.createElement('button');
    stayBtn.className = 'action-btn';
    stayBtn.textContent = 'Stay';
    stayBtn.onclick = () => {
        unit.moved = true;
        hideActionMenu();
        renderBoard();
    };
    menu.appendChild(stayBtn);
    
    // Attack option (if enemies in range)
    const enemiesInRange = getEnemiesInAttackRange(unit);
    if (enemiesInRange.length > 0 && unit.canAttack()) {
        const attackBtn = document.createElement('button');
        attackBtn.className = 'action-btn';
        attackBtn.textContent = 'Attack';
        attackBtn.onclick = () => {
            showEnemyTargets(unit, enemiesInRange);
            hideActionMenu();
        };
        menu.appendChild(attackBtn);
    }
    
    // Occupy option (if on base/castle not owned)
    const cell = gameState.board[unit.y][unit.x];
    if ((cell.terrain === TERRAIN_TYPES.BASE || cell.terrain === TERRAIN_TYPES.CASTLE) && 
        !(cell.terrain === TERRAIN_TYPES.CASTLE && gameState.castle.owner === 'player') &&
        !(cell.terrain === TERRAIN_TYPES.BASE && gameState.bases.some(b => b.x === unit.x && b.y === unit.y && b.owner === 'player'))) {
        const occupyBtn = document.createElement('button');
        occupyBtn.className = 'action-btn';
        occupyBtn.textContent = 'Occupy';
        occupyBtn.onclick = () => {
            occupyBuilding(unit);
            hideActionMenu();
            renderBoard();
        };
        menu.appendChild(occupyBtn);
    }
    
    // Cancel option
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'action-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = hideActionMenu;
    menu.appendChild(cancelBtn);
}

function hideActionMenu() {
    document.getElementById('action-menu').style.display = 'none';
}

function getEnemiesInAttackRange(unit) {
    const enemies = [];
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const cell = gameState.board[y][x];
            if (cell.unit && !cell.unit.isPlayer && cell.unit.currentHp > 0) {
                const distance = Math.abs(x - unit.x) + Math.abs(y - unit.y);
                if (distance >= unit.minRange && distance <= unit.maxRange) {
                    enemies.push(cell.unit);
                }
            }
        }
    }
    return enemies;
}

function showEnemyTargets(unit, enemies) {
    // Highlight enemy targets
    gameState.attackRange = [];
    enemies.forEach(enemy => {
        gameState.attackRange.push({x: enemy.x, y: enemy.y});
    });
    renderBoard();
    
    // Set up click handler for enemy selection
    const board = document.getElementById('game-board');
    const handler = (e) => {
        const cellElement = e.target.closest('.cell');
        if (!cellElement) return;
        
        const x = parseInt(cellElement.dataset.x);
        const y = parseInt(cellElement.dataset.y);
        const cell = gameState.board[y][x];
        
        if (cell.unit && !cell.unit.isPlayer && enemies.includes(cell.unit)) {
            tryAttack(unit, cell.unit);
            board.removeEventListener('click', handler);
            gameState.attackRange = [];
            renderBoard();
        }
    };
    
    board.addEventListener('click', handler);
}

function occupyBuilding(unit) {
    const cell = gameState.board[unit.y][unit.x];
    
    if (cell.terrain === TERRAIN_TYPES.CASTLE) {
        gameState.castle.owner = 'player';
        checkGameEnd();
    } else if (cell.terrain === TERRAIN_TYPES.BASE) {
        const base = gameState.bases.find(b => b.x === unit.x && b.y === unit.y);
        if (base) base.owner = 'player';
    }
    
    unit.moved = true;
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('game-board').addEventListener('click', handleCellClick);
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    
    // Hide action menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#action-menu') && !e.target.closest('.unit')) {
            hideActionMenu();
        }
    });
}

function handleCellClick(e) {
    if (gameState.currentPlayer !== 'player') return;
    
    const cellElement = e.target.closest('.cell');
    if (!cellElement) return;
    
    const x = parseInt(cellElement.dataset.x);
    const y = parseInt(cellElement.dataset.y);
    const cell = gameState.board[y][x];
    
    // If we have movement range shown (after selecting a unit)
    if (gameState.movementRange.length > 0) {
        // Check if clicked on a movement range cell
        const inMovementRange = gameState.movementRange.some(pos => pos.x === x && pos.y === y);
        
        if (inMovementRange && !cell.unit) {
            // Move the unit
            const unit = gameState.selectedUnit;
            gameState.board[unit.y][unit.x].unit = null;
            unit.x = x;
            unit.y = y;
            gameState.board[y][x].unit = unit;
            unit.moved = true;
            
            // Clear ranges and selection
            gameState.movementRange = [];
            gameState.attackRange = [];
            renderBoard();
            
            // Show action menu
            const rect = cellElement.getBoundingClientRect();
            showActionMenu(unit, rect.left, rect.top);
            return;
        }
    }
    
    // If clicking on a player unit
    if (cell.unit && cell.unit.isPlayer && cell.unit.currentHp > 0) {
        gameState.selectedUnit = cell.unit;
        calculateMovementRange(cell.unit);
        renderBoard();
        updateUnitInfo(cell.unit);
        return;
    }
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
        <p>Status: ${unit.moved ? 'Already moved' : 'Can move'}</p>
    `;
}

function tryAttack(attacker, defender) {
    // Calculate damage with terrain defense
    const terrainDefense = gameState.board[defender.y][defender.x].terrain.defense;
    const damage = Math.max(1, attacker.attack - (defender.defense + terrainDefense));
    
    // Apply damage
    const killed = defender.takeDamage(damage);
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
    gameState.movementRange = [];
    gameState.attackRange = [];
    document.getElementById('unit-info').textContent = "Enemy turn...";
    renderBoard();
    
    // Process enemy AI
    setTimeout(enemyTurn, 1000);
}

function enemyTurn() {
    // Simple but smarter AI
    gameState.enemyUnits.forEach(unit => {
        if (unit.currentHp <= 0) return;
        
        // Try to heal if low on health
        if (unit.currentHp < unit.maxHp * 0.4) {
            // Find nearest friendly base/castle
            let nearestHeal = null;
            let minDistance = Infinity;
            
            // Check castle
            if (gameState.castle.owner === 'enemy' || gameState.castle.owner === null) {
                const dist = Math.abs(unit.x - gameState.castle.x) + Math.abs(unit.y - gameState.castle.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestHeal = gameState.castle;
                }
            }
            
            // Check bases
            gameState.bases.forEach(base => {
                if (base.owner === 'enemy' || base.owner === null) {
                    const dist = Math.abs(unit.x - base.x) + Math.abs(unit.y - base.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestHeal = base;
                    }
                }
            });
            
            // Move toward healing spot
            if (nearestHeal && minDistance > 0) {
                const dx = nearestHeal.x - unit.x;
                const dy = nearestHeal.y - unit.y;
                
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
                        
                        // Occupy if reached
                        if (moveX === nearestHeal.x && moveY === nearestHeal.y) {
                            if (nearestHeal === gameState.castle) {
                                gameState.castle.owner = 'enemy';
                            } else {
                                const base = gameState.bases.find(b => b.x === moveX && b.y === moveY);
                                if (base) base.owner = 'enemy';
                            }
                        }
                    }
                }
            }
        }
        
        // If didn't move yet, try to attack or capture
        if (!unit.moved) {
            // Find closest player unit or base
            let target = null;
            let minDistance = Infinity;
            let isBase = false;
            
            // Check player units
            gameState.playerUnits.forEach(player => {
                if (player.currentHp <= 0) return;
                
                const dist = Math.abs(unit.x - player.x) + Math.abs(unit.y - player.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    target = player;
                    isBase = false;
                }
            });
            
            // Check player bases/castle if they're closer
            if (gameState.castle.owner === 'player') {
                const dist = Math.abs(unit.x - gameState.castle.x) + Math.abs(unit.y - gameState.castle.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    target = gameState.castle;
                    isBase = true;
                }
            }
            
            gameState.bases.forEach(base => {
                if (base.owner === 'player') {
                    const dist = Math.abs(unit.x - base.x) + Math.abs(unit.y - base.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        target = base;
                        isBase = true;
                    }
                }
            });
            
            if (target) {
                if (isBase) {
                    // Move toward base/castle
                    const dx = target.x - unit.x;
                    const dy = target.y - unit.y;
                    
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
                } else {
                    // Check if in attack range
                    const distance = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
                    if (distance >= unit.minRange && distance <= unit.maxRange) {
                        tryAttack(unit, target);
                    } else {
                        // Move toward player unit
                        const dx = target.x - unit.x;
                        const dy = target.y - unit.y;
                        
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
                    }
                }
            }
        }
    });
    
    // End enemy turn
    gameState.enemyUnits.forEach(unit => unit.resetTurn());
    gameState.currentPlayer = 'player';
    document.getElementById('unit-info').textContent = "Your turn. Select a unit.";
    renderBoard();
    checkGameEnd();
}

function checkGameEnd() {
    // Check if player has no units left
    if (gameState.playerUnits.every(unit => unit.currentHp <= 0)) {
        setTimeout(() => alert("Game Over! You were defeated."), 100);
        return;
    }
    
    // Check if enemy has no units left
    if (gameState.enemyUnits.every(unit => unit.currentHp <= 0)) {
        setTimeout(() => alert("Victory! You defeated all enemies."), 100);
        return;
    }
    
    // Check if player captured the castle
    if (gameState.castle.owner === 'player') {
        setTimeout(() => alert("Victory! You captured the castle!"), 100);
        return;
    }
    
    // Check if enemy captured the castle
    if (gameState.castle.owner === 'enemy') {
        setTimeout(() => alert("Defeat! The enemy captured your castle!"), 100);
        return;
    }
}

// Start the game
initGame();