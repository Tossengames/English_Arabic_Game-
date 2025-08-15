// Game Constants
const MAP_SIZE = 10;
const TERRAIN_TYPES = {
    PLAIN: 'plain',
    FOREST: 'forest',
    RIVER: 'river',
    CASTLE: 'castle'
};

// Unit Definitions
const UNIT_TYPES = {
    RIKIMARU: {
        name: 'Rikimaru',
        char: 'R',
        color: '#3498db',
        movement: 2,
        attackRange: 2,
        health: 10,
        attack: 5,
        defense: 5,
        cost: 0
    },
    AYAME: {
        name: 'Ayame',
        char: 'A',
        color: '#e91e63',
        movement: 4,
        attackRange: 1,
        health: 6,
        attack: 2,
        defense: 2,
        cost: 0
    },
    TISSU: {
        name: 'Tissu',
        char: 'T',
        color: '#9c27b0',
        movement: 2,
        attackRange: [1, 3],
        health: 8,
        attack: 3,
        defense: 3,
        cost: 0
    },
    RIN: {
        name: 'Rin',
        char: 'N',
        color: '#ff9800',
        movement: 3,
        attackRange: 2,
        health: 7,
        attack: 4,
        defense: 3,
        cost: 0
    },
    TATSUMARU: {
        name: 'Tatsumaru',
        char: 'S',
        color: '#4caf50',
        movement: 4,
        attackRange: 1,
        health: 9,
        attack: 5,
        defense: 4,
        cost: 0
    },
    SAMURAI: {
        name: 'Samurai',
        char: 'S',
        color: '#f44336',
        movement: 2,
        attackRange: 1,
        health: 5,
        attack: 3,
        defense: 3,
        cost: 0
    },
    ARCHER: {
        name: 'Archer',
        char: 'A',
        color: '#795548',
        movement: 2,
        attackRange: 3,
        health: 3,
        attack: 2,
        defense: 1,
        cost: 0
    },
    SPEAR_SAMURAI: {
        name: 'Spear Samurai',
        char: 'P',
        color: '#607d8b',
        movement: 2,
        attackRange: 2,
        health: 4,
        attack: 3,
        defense: 2,
        cost: 0
    }
};

// Game State
let gameState = {
    map: [],
    units: [],
    selectedUnit: null,
    currentPlayer: 'player',
    gold: 0,
    turn: 1
};

// Initialize Game
function initGame() {
    generateMap();
    placeInitialUnits();
    renderMap();
    updateUI();
}

// Generate Random Map
function generateMap() {
    gameState.map = [];
    for (let y = 0; y < MAP_SIZE; y++) {
        const row = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            // Weighted random terrain
            const rand = Math.random();
            if (rand < 0.7) row.push(TERRAIN_TYPES.PLAIN);
            else if (rand < 0.85) row.push(TERRAIN_TYPES.FOREST);
            else if (rand < 0.95) row.push(TERRAIN_TYPES.RIVER);
            else row.push(TERRAIN_TYPES.CASTLE);
        }
        gameState.map.push(row);
    }
    
    // Ensure at least 2 castles
    let castleCount = 0;
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (gameState.map[y][x] === TERRAIN_TYPES.CASTLE) castleCount++;
        }
    }
    
    while (castleCount < 2) {
        const x = Math.floor(Math.random() * MAP_SIZE);
        const y = Math.floor(Math.random() * MAP_SIZE);
        if (gameState.map[y][x] !== TERRAIN_TYPES.CASTLE) {
            gameState.map[y][x] = TERRAIN_TYPES.CASTLE;
            castleCount++;
        }
    }
}

// Place Initial Units
function placeInitialUnits() {
    gameState.units = [];
    
    // Player units
    const playerUnits = [
        UNIT_TYPES.RIKIMARU,
        UNIT_TYPES.AYAME,
        UNIT_TYPES.TISSU,
        UNIT_TYPES.RIN,
        UNIT_TYPES.TATSUMARU
    ];
    
    const randomPlayerUnit = playerUnits[Math.floor(Math.random() * playerUnits.length)];
    placeUnit(randomPlayerUnit, 'player');
    
    // Enemy units
    const enemyTypes = [UNIT_TYPES.SAMURAI, UNIT_TYPES.ARCHER, UNIT_TYPES.SPEAR_SAMURAI];
    for (let i = 0; i < 3; i++) {
        const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        placeUnit(randomEnemy, 'enemy');
    }
}

function placeUnit(unitType, faction) {
    let x, y;
    do {
        x = Math.floor(Math.random() * MAP_SIZE);
        y = Math.floor(Math.random() * MAP_SIZE);
    } while (
        gameState.map[y][x] === TERRAIN_TYPES.RIVER || 
        gameState.units.some(u => u.x === x && u.y === y)
    );
    
    gameState.units.push({
        ...unitType,
        x,
        y,
        faction,
        hasMoved: false,
        hasAttacked: false
    });
}

// Render Map
function renderMap() {
    const mapElement = document.getElementById('map');
    mapElement.innerHTML = '';
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = document.createElement('div');
            tile.className = `tile ${gameState.map[y][x]}`;
            tile.dataset.x = x;
            tile.dataset.y = y;
            tile.addEventListener('click', () => handleTileClick(x, y));
            mapElement.appendChild(tile);
        }
    }
    
    // Render units
    gameState.units.forEach(unit => {
        const tile = document.querySelector(`.tile[data-x="${unit.x}"][data-y="${unit.y}"]`);
        if (tile) {
            const unitElement = document.createElement('div');
            unitElement.className = `unit ${unit.faction}-unit`;
            unitElement.style.backgroundColor = unit.color;
            unitElement.textContent = unit.char;
            unitElement.dataset.unitId = gameState.units.indexOf(unit);
            tile.appendChild(unitElement);
        }
    });
}

// Handle Tile Clicks
function handleTileClick(x, y) {
    const clickedUnit = getUnitAt(x, y);
    
    if (!gameState.selectedUnit) {
        // Select a unit
        if (clickedUnit && clickedUnit.faction === gameState.currentPlayer) {
            gameState.selectedUnit = clickedUnit;
            highlightMovement();
            updateUI();
        }
    } else {
        // Already have a selected unit
        if (clickedUnit === gameState.selectedUnit) {
            // Deselect
            gameState.selectedUnit = null;
            clearHighlights();
            updateUI();
        } else if (clickedUnit && clickedUnit.faction === gameState.currentPlayer) {
            // Select another unit
            gameState.selectedUnit = clickedUnit;
            highlightMovement();
            updateUI();
        } else {
            // Try to move or attack
            const isMove = !clickedUnit && isInMovementRange(x, y);
            const isAttack = clickedUnit && 
                           clickedUnit.faction !== gameState.currentPlayer && 
                           isInAttackRange(x, y);
            
            if (isMove) {
                moveUnit(gameState.selectedUnit, x, y);
            } else if (isAttack) {
                attackUnit(gameState.selectedUnit, clickedUnit);
            }
        }
    }
}

// Movement and Attack Helpers
function isInMovementRange(x, y) {
    if (!gameState.selectedUnit) return false;
    
    const dx = Math.abs(x - gameState.selectedUnit.x);
    const dy = Math.abs(y - gameState.selectedUnit.y);
    const distance = dx + dy;
    
    // Check if tile is passable
    if (gameState.map[y][x] === TERRAIN_TYPES.RIVER) return false;
    
    return distance <= gameState.selectedUnit.movement && 
           !gameState.units.some(u => u.x === x && u.y === y);
}

function isInAttackRange(x, y) {
    if (!gameState.selectedUnit) return false;
    
    const dx = Math.abs(x - gameState.selectedUnit.x);
    const dy = Math.abs(y - gameState.selectedUnit.y);
    const distance = dx + dy;
    
    // Handle Tissu's special attack range
    if (gameState.selectedUnit.name === 'Tissu') {
        const ranges = Array.isArray(gameState.selectedUnit.attackRange) ? 
                       gameState.selectedUnit.attackRange : 
                       [gameState.selectedUnit.attackRange];
        return ranges.includes(distance);
    }
    
    return distance <= gameState.selectedUnit.attackRange;
}

function highlightMovement() {
    if (!gameState.selectedUnit) return;
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
            if (isInMovementRange(x, y)) {
                tile.classList.add('highlight-move');
            }
            if (isInAttackRange(x, y) && getUnitAt(x, y) && 
                getUnitAt(x, y).faction !== gameState.currentPlayer) {
                tile.classList.add('highlight-attack');
            }
        }
    }
}

function clearHighlights() {
    document.querySelectorAll('.highlight-move, .highlight-attack').forEach(el => {
        el.classList.remove('highlight-move', 'highlight-attack');
    });
}

function moveUnit(unit, x, y) {
    unit.x = x;
    unit.y = y;
    unit.hasMoved = true;
    gameState.selectedUnit = null;
    clearHighlights();
    renderMap();
    updateUI();
}

function attackUnit(attacker, defender) {
    // Simple combat calculation
    const damage = Math.max(1, attacker.attack - defender.defense);
    defender.health -= damage;
    
    if (defender.health <= 0) {
        // Remove dead unit
        gameState.units = gameState.units.filter(u => u !== defender);
        
        // Check if castle was captured
        if (gameState.map[defender.y][defender.x] === TERRAIN_TYPES.CASTLE) {
            gameState.gold += 5;
        }
    }
    
    attacker.hasAttacked = true;
    gameState.selectedUnit = null;
    clearHighlights();
    renderMap();
    updateUI();
    
    // Check win condition
    checkGameEnd();
}

function getUnitAt(x, y) {
    return gameState.units.find(u => u.x === x && u.y === y);
}

// UI Updates
function updateUI() {
    document.getElementById('selected-unit').textContent = 
        gameState.selectedUnit ? gameState.selectedUnit.name : 'None';
    
    document.getElementById('current-action').textContent = 
        gameState.selectedUnit ? 
        (gameState.selectedUnit.hasMoved ? 'Select attack target' : 'Select move target') : 
        'Select a unit';
    
    document.getElementById('gold').textContent = gameState.gold;
}

function checkGameEnd() {
    const playerUnits = gameState.units.filter(u => u.faction === 'player');
    const enemyUnits = gameState.units.filter(u => u.faction === 'enemy');
    
    if (playerUnits.length === 0) {
        alert('Game Over! You lost!');
        initGame();
    } else if (enemyUnits.length === 0) {
        alert('Victory! All enemies defeated!');
        initGame();
    }
}

// Start the game
window.onload = initGame;