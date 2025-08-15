// Game Constants
const MAP_SIZE = 10;
const TERRAIN_TYPES = {
    PLAIN: 'plain',
    FOREST: 'forest',
    RIVER: 'river',
    BASE: 'base',
    HQ: 'HQ'
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
        maxHealth: 10,
        attack: 5,
        defense: 5,
        cost: 0,
        description: "Slow but powerful. Can attack 2 squares away."
    },
    AYAME: {
        name: 'Ayame',
        char: 'A',
        color: '#e91e63',
        movement: 4,
        attackRange: 1,
        health: 6,
        maxHealth: 6,
        attack: 2,
        defense: 2,
        cost: 0,
        description: "Fast but weak. Only attacks adjacent squares."
    },
    TISSU: {
        name: 'Tissu',
        char: 'T',
        color: '#9c27b0',
        movement: 2,
        attackRange: [1, 3],
        health: 8,
        maxHealth: 8,
        attack: 3,
        defense: 3,
        cost: 0,
        description: "Versatile attacker. Can attack 1 or 3 squares away."
    },
    RIN: {
        name: 'Rin',
        char: 'N',
        color: '#ff9800',
        movement: 3,
        attackRange: 2,
        health: 7,
        maxHealth: 7,
        attack: 4,
        defense: 3,
        cost: 0,
        description: "Balanced fighter. Can attack 2 squares away."
    },
    TATSUMARU: {
        name: 'Tatsumaru',
        char: 'S',
        color: '#4caf50',
        movement: 4,
        attackRange: 1,
        health: 9,
        maxHealth: 9,
        attack: 5,
        defense: 4,
        cost: 0,
        description: "Strong and fast. Only attacks adjacent squares."
    },
    SAMURAI: {
        name: 'Samurai',
        char: 'S',
        color: '#f44336',
        movement: 2,
        attackRange: 1,
        health: 5,
        maxHealth: 5,
        attack: 3,
        defense: 3,
        cost: 0,
        description: "Standard enemy unit."
    },
    ARCHER: {
        name: 'Archer',
        char: 'A',
        color: '#795548',
        movement: 2,
        attackRange: 3,
        health: 3,
        maxHealth: 3,
        attack: 2,
        defense: 1,
        cost: 0,
        description: "Ranged attacker with low health."
    },
    SPEAR_SAMURAI: {
        name: 'Spear Samurai',
        char: 'P',
        color: '#607d8b',
        movement: 2,
        attackRange: 2,
        health: 4,
        maxHealth: 4,
        attack: 3,
        defense: 2,
        cost: 0,
        description: "Can attack 2 squares away."
    }
};

// Game State
const gameState = {
    map: [],
    units: [],
    selectedUnit: null,
    currentPlayer: 'player',
    gold: 0,
    turn: 1,
    gamePhase: 'playerTurn',
    combatLog: [],
    difficulty: 'normal',
    playerBases: 0,
    enemyBases: 0,
    hqControlledBy: 'enemy',
    enemySpawnTimer: 0,
    enemySpawnInterval: 3,
    hqPosition: { x: 0, y: 0 }
};

// DOM Elements
const elements = {
    map: null,
    turnCounter: null,
    goldDisplay: null,
    gamePhaseDisplay: null,
    selectedUnitInfo: null,
    endTurnBtn: null,
    buyUnitBtn: null,
    logEntries: null,
    difficultySelector: null
};

// Initialize Game
function initGame() {
    // Initialize DOM references
    elements.map = document.getElementById('map');
    elements.turnCounter = document.getElementById('turn-counter');
    elements.goldDisplay = document.getElementById('gold');
    elements.gamePhaseDisplay = document.getElementById('game-phase');
    elements.selectedUnitInfo = document.getElementById('selected-unit-info');
    elements.endTurnBtn = document.getElementById('end-turn-btn');
    elements.buyUnitBtn = document.getElementById('buy-unit-btn');
    elements.logEntries = document.getElementById('log-entries');
    elements.difficultySelector = document.getElementById('difficulty-selector');

    // Set up event listeners
    elements.endTurnBtn.addEventListener('click', endTurn);
    elements.buyUnitBtn.addEventListener('click', buyUnit);

    // Set up difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.difficulty = btn.dataset.difficulty;
            setDifficulty();
            elements.difficultySelector.style.display = 'none';
            startGame();
        });
    });
}

function setDifficulty() {
    switch(gameState.difficulty) {
        case 'easy':
            gameState.enemySpawnInterval = 5;
            break;
        case 'normal':
            gameState.enemySpawnInterval = 3;
            break;
        case 'hard':
            gameState.enemySpawnInterval = 2;
            break;
    }
}

function startGame() {
    // Generate game world
    generateMap();
    placeInitialUnits();
    
    // Start the game
    renderMap();
    updateUI();
    addToLog("Game started! Defeat the enemy HQ to win!");
    addToLog(`Difficulty: ${gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1)}`);
}

// Generate Random Map
function generateMap() {
    gameState.map = [];
    
    // Initialize all tiles as plain
    for (let y = 0; y < MAP_SIZE; y++) {
        const row = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            row.push(TERRAIN_TYPES.PLAIN);
        }
        gameState.map.push(row);
    }

    // Place bases (1x1 with H)
    const baseCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < baseCount; i++) {
        const x = Math.floor(Math.random() * MAP_SIZE);
        const y = Math.floor(Math.random() * MAP_SIZE);
        
        if (gameState.map[y][x] === TERRAIN_TYPES.PLAIN) {
            gameState.map[y][x] = TERRAIN_TYPES.BASE;
        }
    }

    // Place HQ (1x1 with Q)
    const hqX = Math.floor(Math.random() * MAP_SIZE);
    const hqY = Math.floor(Math.random() * MAP_SIZE);
    gameState.map[hqY][hqX] = TERRAIN_TYPES.HQ;
    gameState.hqPosition = { x: hqX, y: hqY };

    // Add forests and rivers
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (gameState.map[y][x] === TERRAIN_TYPES.PLAIN) {
                const rand = Math.random();
                if (rand < 0.1) gameState.map[y][x] = TERRAIN_TYPES.FOREST;
                else if (rand < 0.15) gameState.map[y][x] = TERRAIN_TYPES.RIVER;
            }
        }
    }
}

// Place Initial Units
function placeInitialUnits() {
    gameState.units = [];
    gameState.gold = 0;
    gameState.playerBases = 0;
    gameState.enemyBases = 0;
    gameState.hqControlledBy = 'enemy';
    gameState.enemySpawnTimer = 0;
    
    // Player units - start with one random unit
    const playerUnits = [
        UNIT_TYPES.RIKIMARU,
        UNIT_TYPES.AYAME,
        UNIT_TYPES.TISSU,
        UNIT_TYPES.RIN,
        UNIT_TYPES.TATSUMARU
    ];
    
    const randomPlayerUnit = playerUnits[Math.floor(Math.random() * playerUnits.length)];
    placeUnit(randomPlayerUnit, 'player');
    addToLog(`Your starting unit is ${randomPlayerUnit.name}!`);
    
    // Enemy units - place near HQ
    const enemyTypes = [UNIT_TYPES.SAMURAI, UNIT_TYPES.ARCHER, UNIT_TYPES.SPEAR_SAMURAI];
    
    // Place 2-4 enemy units around HQ
    const enemyCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < enemyCount; i++) {
        const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        placeUnitNearHQ(randomEnemy, 'enemy');
    }
}

function placeUnitNearHQ(unitType, faction) {
    let x, y;
    let attempts = 0;
    
    do {
        // Get random position in 5x5 area around HQ
        const offsetX = Math.floor(Math.random() * 5) - 2;
        const offsetY = Math.floor(Math.random() * 5) - 2;
        x = gameState.hqPosition.x + offsetX;
        y = gameState.hqPosition.y + offsetY;
        attempts++;
        
        // If we can't find a spot after many attempts, just place randomly
        if (attempts > 20) {
            x = Math.floor(Math.random() * MAP_SIZE);
            y = Math.floor(Math.random() * MAP_SIZE);
        }
    } while (
        x < 0 || x >= MAP_SIZE || 
        y < 0 || y >= MAP_SIZE ||
        gameState.map[y][x] === TERRAIN_TYPES.RIVER || 
        gameState.units.some(u => u.x === x && u.y === y) ||
        (faction === 'player' && gameState.map[y][x] === TERRAIN_TYPES.HQ)
    );
    
    const unit = {
        ...unitType,
        x,
        y,
        faction,
        hasMoved: false,
        hasAttacked: false
    };
    
    gameState.units.push(unit);
    return unit;
}

function placeUnit(unitType, faction) {
    let x, y;
    let attempts = 0;
    
    do {
        // For player units, try to place near the edge
        if (faction === 'player' && attempts < 20) {
            const edge = Math.floor(Math.random() * 4);
            switch (edge) {
                case 0: // top
                    x = Math.floor(Math.random() * MAP_SIZE);
                    y = Math.floor(Math.random() * 2);
                    break;
                case 1: // right
                    x = MAP_SIZE - 1 - Math.floor(Math.random() * 2);
                    y = Math.floor(Math.random() * MAP_SIZE);
                    break;
                case 2: // bottom
                    x = Math.floor(Math.random() * MAP_SIZE);
                    y = MAP_SIZE - 1 - Math.floor(Math.random() * 2);
                    break;
                case 3: // left
                    x = Math.floor(Math.random() * 2);
                    y = Math.floor(Math.random() * MAP_SIZE);
                    break;
            }
        } else {
            x = Math.floor(Math.random() * MAP_SIZE);
            y = Math.floor(Math.random() * MAP_SIZE);
        }
        
        attempts++;
    } while (
        x < 0 || x >= MAP_SIZE || 
        y < 0 || y >= MAP_SIZE ||
        gameState.map[y][x] === TERRAIN_TYPES.RIVER || 
        gameState.units.some(u => u.x === x && u.y === y) ||
        (faction === 'player' && gameState.map[y][x] === TERRAIN_TYPES.HQ)
    );
    
    const unit = {
        ...unitType,
        x,
        y,
        faction,
        hasMoved: false,
        hasAttacked: false
    };
    
    gameState.units.push(unit);
    return unit;
}

// Render Map
function renderMap() {
    elements.map.innerHTML = '';
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = document.createElement('div');
            let tileType = gameState.map[y][x];
            
            // Check if base/HQ is controlled by player or enemy
            if (tileType === TERRAIN_TYPES.BASE) {
                const unitOnBase = gameState.units.find(u => u.x === x && u.y === y);
                if (unitOnBase) {
                    tileType = unitOnBase.faction === 'player' ? 'player-base' : 'enemy-base';
                }
            } else if (tileType === TERRAIN_TYPES.HQ) {
                if (gameState.hqControlledBy === 'player') {
                    tileType = 'player-HQ';
                }
            }
            
            tile.className = `tile ${tileType}`;
            tile.dataset.x = x;
            tile.dataset.y = y;
            
            // Add letter for base/HQ
            if (gameState.map[y][x] === TERRAIN_TYPES.BASE) {
                tile.textContent = 'H';
            } else if (gameState.map[y][x] === TERRAIN_TYPES.HQ) {
                tile.textContent = 'Q';
            }
            
            tile.addEventListener('click', () => handleTileClick(x, y));
            elements.map.appendChild(tile);
        }
    }
    
    // Render units
    gameState.units.forEach((unit, index) => {
        const tile = document.querySelector(`.tile[data-x="${unit.x}"][data-y="${unit.y}"]`);
        if (tile) {
            const unitElement = document.createElement('div');
            unitElement.className = `unit ${unit.faction}-unit`;
            unitElement.style.backgroundColor = unit.color;
            unitElement.textContent = unit.char;
            unitElement.dataset.unitId = index;
            
            // Add HP bar
            const hpBar = document.createElement('div');
            hpBar.className = 'hp-bar';
            const hpFill = document.createElement('div');
            hpFill.className = 'hp-fill';
            hpFill.style.width = `${(unit.health / unit.maxHealth) * 100}%`;
            
            hpBar.appendChild(hpFill);
            unitElement.appendChild(hpBar);
            tile.appendChild(unitElement);
            
            // Highlight selected unit
            if (gameState.selectedUnit === unit) {
                tile.classList.add('highlight-selected');
            }
        }
    });
    
    // Highlight movement and attack ranges
    highlightMovementAndAttack();
}

// Handle Tile Clicks
function handleTileClick(x, y) {
    const clickedUnit = getUnitAt(x, y);
    
    if (gameState.gamePhase !== 'playerTurn') return;
    
    if (!gameState.selectedUnit) {
        // Select a unit
        if (clickedUnit && clickedUnit.faction === 'player' && !clickedUnit.hasMoved) {
            gameState.selectedUnit = clickedUnit;
            addToLog(`Selected ${clickedUnit.name}`);
            updateUI();
            renderMap();
        }
    } else {
        // Already have a selected unit
        if (clickedUnit === gameState.selectedUnit) {
            // Deselect
            gameState.selectedUnit = null;
            updateUI();
            renderMap();
        } else if (clickedUnit && clickedUnit.faction === 'player') {
            // Select another player unit
            gameState.selectedUnit = clickedUnit;
            addToLog(`Selected ${clickedUnit.name}`);
            updateUI();
            renderMap();
        } else {
            // Try to move or attack
            const isMove = !clickedUnit && isInMovementRange(x, y);
            const isAttack = clickedUnit && 
                           clickedUnit.faction === 'enemy' && 
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
    if (gameState.selectedUnit.hasMoved) return false;
    
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
    if (gameState.selectedUnit.hasAttacked) return false;
    
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

function highlightMovementAndAttack() {
    if (!gameState.selectedUnit) return;
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
            if (!tile) continue;
            
            if (isInMovementRange(x, y)) {
                tile.classList.add('highlight-move');
            }
            
            const unit = getUnitAt(x, y);
            if (unit && unit.faction === 'enemy' && isInAttackRange(x, y)) {
                tile.classList.add('highlight-attack');
            }
        }
    }
}

function moveUnit(unit, x, y) {
    // Check if the unit can move
    if (unit.hasMoved) {
        addToLog(`${unit.name} has already moved this turn!`);
        return;
    }
    
    // Check if path is blocked by other units
    if (gameState.units.some(u => u.x === x && u.y === y)) {
        addToLog("Cannot move to a tile occupied by another unit!");
        return;
    }
    
    // Check if destination is valid
    if (!isInMovementRange(x, y)) {
        addToLog("Cannot move that far or to that terrain!");
        return;
    }
    
    // Add smoke effect
    const oldTile = document.querySelector(`.tile[data-x="${unit.x}"][data-y="${unit.y}"]`);
    if (oldTile) {
        const smoke = document.createElement('div');
        smoke.className = 'smoke-effect';
        oldTile.appendChild(smoke);
        setTimeout(() => smoke.remove(), 500);
    }
    
    // Move the unit with leap animation
    const unitElement = document.querySelector(`.unit[data-unit-id="${gameState.units.indexOf(unit)}"]`);
    if (unitElement) {
        unitElement.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            unitElement.style.transform = '';
        }, 300);
    }
    
    const oldX = unit.x;
    const oldY = unit.y;
    unit.x = x;
    unit.y = y;
    unit.hasMoved = true;
    
    addToLog(`${unit.name} moved from (${oldX},${oldY}) to (${x},${y})`);
    
    // Check if we captured a base or HQ
    if (gameState.map[y][x] === TERRAIN_TYPES.BASE) {
        // Check if there's an enemy unit on the base
        const enemyOnBase = gameState.units.find(u => u.x === x && u.y === y && u.faction === 'enemy');
        if (!enemyOnBase) {
            // Capture base
            addToLog(`Captured base at (${x},${y})! +1 gold per turn`);
            gameState.playerBases++;
        }
    } else if (gameState.map[y][x] === TERRAIN_TYPES.HQ) {
        // Capture HQ
        gameState.hqControlledBy = 'player';
        addToLog(`Captured enemy HQ at (${x},${y})!`);
        
        // Add capture effect
        const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
        if (tile) {
            const captureEffect = document.createElement('div');
            captureEffect.className = 'capture-effect';
            tile.appendChild(captureEffect);
            setTimeout(() => captureEffect.remove(), 500);
        }
    }
    
    gameState.selectedUnit = null;
    updateUI();
    renderMap();
}

function attackUnit(attacker, defender) {
    // Check if attacker can attack
    if (attacker.hasAttacked) {
        addToLog(`${attacker.name} has already attacked this turn!`);
        return;
    }
    
    // Check if defender is in range
    if (!isInAttackRange(defender.x, defender.y)) {
        addToLog(`${defender.name} is not in attack range!`);
        return;
    }
    
    // Calculate damage
    const damage = Math.max(1, attacker.attack - defender.defense);
    defender.health -= damage;
    
    // Add blood effect
    const defenderTile = document.querySelector(`.tile[data-x="${defender.x}"][data-y="${defender.y}"]`);
    if (defenderTile) {
        const blood = document.createElement('div');
        blood.className = 'blood-effect';
        defenderTile.appendChild(blood);
        setTimeout(() => blood.remove(), 300);
    }
    
    // Add shake effect
    const defenderElement = document.querySelector(`.unit[data-unit-id="${gameState.units.indexOf(defender)}"]`);
    if (defenderElement) {
        defenderElement.style.animation = 'shake 0.3s';
        setTimeout(() => {
            defenderElement.style.animation = '';
        }, 300);
    }
    
    addToLog(`${attacker.name} attacks ${defender.name} for ${damage} damage!`);
    
    if (defender.health <= 0) {
        // Remove dead unit
        gameState.units = gameState.units.filter(u => u !== defender);
        addToLog(`${defender.name} was defeated!`);
        
        // Check if we killed an enemy on a base
        if (gameState.map[defender.y][defender.x] === TERRAIN_TYPES.BASE) {
            gameState.playerBases++;
            addToLog(`Captured base at (${defender.x},${defender.y})! +1 gold per turn`);
        }
    }
    
    attacker.hasAttacked = true;
    gameState.selectedUnit = null;
    updateUI();
    renderMap();
    
    // Check win/lose conditions
    checkGameEnd();
}

function getUnitAt(x, y) {
    return gameState.units.find(u => u.x === x && u.y === y);
}

// Turn Management
function endTurn() {
    if (gameState.gamePhase !== 'playerTurn') return;
    
    addToLog("Ending player turn...");
    gameState.gamePhase = 'enemyTurn';
    gameState.selectedUnit = null;
    updateUI();
    renderMap();
    
    // Process enemy turn after a short delay
    setTimeout(processEnemyTurn, 1000);
}

function processEnemyTurn() {
    const enemyUnits = gameState.units.filter(u => u.faction === 'enemy');
    
    if (enemyUnits.length === 0) {
        addToLog("No enemy units left!");
        startPlayerTurn();
        return;
    }
    
    // Process each enemy unit
    let i = 0;
    const processNextEnemy = () => {
        if (i >= enemyUnits.length) {
            // All enemies have moved
            startPlayerTurn();
            return;
        }
        
        const enemy = enemyUnits[i];
        enemy.hasMoved = false;
        enemy.hasAttacked = false;
        
        // Simple AI: Find closest player unit and move toward it
        const playerUnits = gameState.units.filter(u => u.faction === 'player');
        if (playerUnits.length === 0) {
            i++;
            processNextEnemy();
            return;
        }
        
        // Find closest player unit
        let closestPlayer = null;
        let closestDistance = Infinity;
        
        playerUnits.forEach(player => {
            const dx = Math.abs(player.x - enemy.x);
            const dy = Math.abs(player.y - enemy.y);
            const distance = dx + dy;
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = player;
            }
        });
        
        if (closestPlayer) {
            // Try to attack if in range
            const attackRange = Array.isArray(enemy.attackRange) ? 
                Math.max(...enemy.attackRange) : enemy.attackRange;
                
            if (closestDistance <= attackRange) {
                // Attack
                attackUnit(enemy, closestPlayer);
                i++;
                setTimeout(processNextEnemy, 500);
                return;
            } else {
                // Move toward player
                let bestX = enemy.x;
                let bestY = enemy.y;
                let bestDistance = closestDistance;
                
                // Check all possible moves
                for (let y = 0; y < MAP_SIZE; y++) {
                    for (let x = 0; x < MAP_SIZE; x++) {
                        const dx = Math.abs(x - enemy.x);
                        const dy = Math.abs(y - enemy.y);
                        const moveDistance = dx + dy;
                        
                        if (moveDistance <= enemy.movement && 
                            !gameState.units.some(u => u.x === x && u.y === y) &&
                            gameState.map[y][x] !== TERRAIN_TYPES.RIVER) {
                            
                            const newDx = Math.abs(closestPlayer.x - x);
                            const newDy = Math.abs(closestPlayer.y - y);
                            const newDistance = newDx + newDy;
                            
                            if (newDistance < bestDistance) {
                                bestDistance = newDistance;
                                bestX = x;
                                bestY = y;
                            }
                        }
                    }
                }
                
                // Move to best position
                if (bestX !== enemy.x || bestY !== enemy.y) {
                    // Add smoke effect
                    const oldTile = document.querySelector(`.tile[data-x="${enemy.x}"][data-y="${enemy.y}"]`);
                    if (oldTile) {
                        const smoke = document.createElement('div');
                        smoke.className = 'smoke-effect';
                        oldTile.appendChild(smoke);
                        setTimeout(() => smoke.remove(), 500);
                    }
                    
                    enemy.x = bestX;
                    enemy.y = bestY;
                    enemy.hasMoved = true;
                    addToLog(`Enemy ${enemy.name} moves toward your units.`);
                    
                    // Check if enemy captured a base
                    if (gameState.map[bestY][bestX] === TERRAIN_TYPES.BASE) {
                        // Check if there's a player unit on the base
                        const playerOnBase = gameState.units.find(u => u.x === bestX && u.y === bestY && u.faction === 'player');
                        if (!playerOnBase) {
                            // Enemy captures base
                            gameState.enemyBases++;
                            addToLog(`Enemy captured base at (${bestX},${bestY})!`);
                        }
                    }
                    
                    renderMap();
                }
            }
        }
        
        i++;
        setTimeout(processNextEnemy, 500);
    };
    
    processNextEnemy();
}

function startPlayerTurn() {
    gameState.turn++;
    gameState.gamePhase = 'playerTurn';
    
    // Reset player units' movement and attack
    gameState.units.forEach(unit => {
        if (unit.faction === 'player') {
            unit.hasMoved = false;
            unit.hasAttacked = false;
        }
    });
    
    // Generate gold from controlled bases
    const goldGenerated = gameState.playerBases;
    if (goldGenerated > 0) {
        gameState.gold += goldGenerated;
        addToLog(`Generated ${goldGenerated} gold from controlled bases!`);
    }
    
    // Spawn new enemies if HQ is not controlled by player
    if (gameState.hqControlledBy !== 'player') {
        gameState.enemySpawnTimer++;
        if (gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
            spawnNewEnemies();
            gameState.enemySpawnTimer = 0;
        }
    }
    
    addToLog(`Player Turn ${gameState.turn} begins!`);
    updateUI();
    renderMap();
}

function spawnNewEnemies() {
    const enemyTypes = [UNIT_TYPES.SAMURAI, UNIT_TYPES.ARCHER, UNIT_TYPES.SPEAR_SAMURAI];
    const enemiesToSpawn = 1 + Math.floor(Math.random() * 2); // 1-2 enemies
    
    for (let i = 0; i < enemiesToSpawn; i++) {
        const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        placeUnitNearHQ(randomEnemy, 'enemy');
        addToLog(`New enemy ${randomEnemy.name} has appeared near the HQ!`);
    }
    
    renderMap();
}

// Unit Purchasing
function buyUnit() {
    if (gameState.gamePhase !== 'playerTurn') {
        addToLog("You can only buy units during your turn!");
        return;
    }
    
    if (gameState.gold < 5) {
        addToLog("Not enough gold! Units cost 5 gold.");
        return;
    }
    
    // Find a random position away from HQ
    let x, y;
    let attempts = 0;
    const hqX = gameState.hqPosition.x;
    const hqY = gameState.hqPosition.y;
    
    do {
        // Try to place near the edge (away from HQ)
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: // top
                x = Math.floor(Math.random() * MAP_SIZE);
                y = Math.floor(Math.random() * 2);
                break;
            case 1: // right
                x = MAP_SIZE - 1 - Math.floor(Math.random() * 2);
                y = Math.floor(Math.random() * MAP_SIZE);
                break;
            case 2: // bottom
                x = Math.floor(Math.random() * MAP_SIZE);
                y = MAP_SIZE - 1 - Math.floor(Math.random() * 2);
                break;
            case 3: // left
                x = Math.floor(Math.random() * 2);
                y = Math.floor(Math.random() * MAP_SIZE);
                break;
        }
        
        attempts++;
        
        // If we can't find a spot after many attempts, just place randomly
        if (attempts > 20) {
            x = Math.floor(Math.random() * MAP_SIZE);
            y = Math.floor(Math.random() * MAP_SIZE);
        }
    } while (
        x < 0 || x >= MAP_SIZE || 
        y < 0 || y >= MAP_SIZE ||
        gameState.map[y][x] === TERRAIN_TYPES.RIVER || 
        gameState.units.some(u => u.x === x && u.y === y) ||
        (Math.abs(x - hqX) < 3 && Math.abs(y - hqY) < 3) // Don't spawn too close to HQ
    );
    
    // Deduct gold
    gameState.gold -= 5;
    
    // Create random unit (excluding Tatsumaru for balance)
    const availableUnits = [
        UNIT_TYPES.RIKIMARU,
        UNIT_TYPES.AYAME,
        UNIT_TYPES.TISSU,
        UNIT_TYPES.RIN
    ];
    const randomUnitType = availableUnits[Math.floor(Math.random() * availableUnits.length)];
    
    const newUnit = {
        ...randomUnitType,
        x,
        y,
        faction: 'player',
        hasMoved: true, // Can't move after buying
        hasAttacked: false
    };
    
    gameState.units.push(newUnit);
    
    // Add spawn effect
    const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
    if (tile) {
        const smoke = document.createElement('div');
        smoke.className = 'smoke-effect';
        tile.appendChild(smoke);
        setTimeout(() => smoke.remove(), 500);
    }
    
    addToLog(`Purchased new ${newUnit.name} for 5 gold at (${x},${y})`);
    
    updateUI();
    renderMap();
}

// Game State Checks
function checkGameEnd() {
    const playerUnits = gameState.units.filter(u => u.faction === 'player');
    const enemyUnits = gameState.units.filter(u => u.faction === 'enemy');
    
    // Win condition: Control HQ and no enemy units left
    if (gameState.hqControlledBy === 'player' && enemyUnits.length === 0) {
        addToLog("Victory! You've captured the HQ and defeated all enemies!");
        setTimeout(() => alert("Victory! You've captured the HQ and defeated all enemies!"), 500);
        return;
    }
    
    // Lose condition: No player units left
    if (playerUnits.length === 0) {
        addToLog("Game Over! All your units were defeated!");
        setTimeout(() => alert("Defeat! All your units were defeated!"), 500);
        return;
    }
}

// UI Updates
function updateUI() {
    // Update game info
    elements.turnCounter.textContent = gameState.turn;
    elements.goldDisplay.textContent = gameState.gold;
    elements.gamePhaseDisplay.textContent = 
        gameState.gamePhase === 'playerTurn' ? 'Player Turn' : 'Enemy Turn';
    
    // Update selected unit info
    if (gameState.selectedUnit) {
        const unit = gameState.selectedUnit;
        elements.selectedUnitInfo.innerHTML = `
            <strong>${unit.name}</strong><br>
            HP: <div class="hp-bar"><div class="hp-fill" style="width: ${(unit.health / unit.maxHealth) * 100}%"></div></div>
            Attack: ${unit.attack}<br>
            Defense: ${unit.defense}<br>
            Movement: ${unit.movement}<br>
            Range: ${Array.isArray(unit.attackRange) ? unit.attackRange.join('/') : unit.attackRange}<br>
            <em>${unit.description}</em>
        `;
    } else {
        elements.selectedUnitInfo.textContent = 'None selected';
    }
    
    // Update button states
    elements.endTurnBtn.disabled = gameState.gamePhase !== 'playerTurn';
    elements.buyUnitBtn.disabled = gameState.gold < 5 || gameState.gamePhase !== 'playerTurn';
}

// Combat Log
function addToLog(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[Turn ${gameState.turn}] ${message}`;
    elements.logEntries.appendChild(entry);
    elements.logEntries.scrollTop = elements.logEntries.scrollHeight;
    
    // Keep log to 100 entries max
    if (elements.logEntries.children.length > 100) {
        elements.logEntries.removeChild(elements.logEntries.children[0]);
    }
    
    gameState.combatLog.push(message);
}

// Start the game when page loads
window.onload = initGame;