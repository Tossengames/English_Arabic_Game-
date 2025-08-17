// Game Constants
const TILE_SIZE = 40;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const FOG_OF_WAR = false; // Set to true to enable fog of war

// Terrain Types
const TERRAIN = {
    GRASS: 0,
    MOUNTAIN: 1,
    WATER: 2,
    FOREST: 3,
    WALL: 4,
    CASTLE: 5,
    BASE: 6,
    VILLAGE: 7
};

// Unit Types
const UNIT_TYPES = {
    SOLDIER: {
        name: "Soldier",
        health: 10,
        attack: 4,
        defense: 2,
        movement: 3,
        cost: 100,
        range: 1,
        canCapture: true
    },
    ARCHER: {
        name: "Archer",
        health: 8,
        attack: 3,
        defense: 1,
        movement: 2,
        cost: 150,
        range: 2,
        canCapture: false
    },
    KNIGHT: {
        name: "Knight",
        health: 12,
        attack: 5,
        defense: 1,
        movement: 4,
        cost: 200,
        range: 1,
        canCapture: true
    },
    SCOUT: {
        name: "Scout",
        health: 6,
        attack: 2,
        defense: 0,
        movement: 5,
        cost: 80,
        range: 1,
        canCapture: true
    }
};

// Game State
let gameState = {
    map: [],
    units: [],
    buildings: [],
    currentPlayer: 0, // 0 for player, 1 for AI
    selectedUnit: null,
    gameOver: false,
    visibleTiles: new Set(),
    turn: 1,
    gold: [100, 100], // [player, ai]
    selectedAction: null,
    actionTarget: null,
    victoryCondition: {
        killAll: true,
        captureCastle: true
    },
    log: []
};

// DOM Elements
const canvas = document.getElementById('game-map');
const ctx = canvas.getContext('2d');
const currentPlayerDisplay = document.getElementById('current-player');
const gameStateDisplay = document.getElementById('game-state');
const endTurnButton = document.getElementById('end-turn');
const unitTypeDisplay = document.getElementById('unit-type');
const unitHealthDisplay = document.getElementById('unit-health');
const unitAttackDisplay = document.getElementById('unit-attack');
const unitRangeDisplay = document.getElementById('unit-range');
const unitMovementDisplay = document.getElementById('unit-movement');
const unitActionsContainer = document.getElementById('unit-actions');
const goldAmountDisplay = document.getElementById('gold-amount');
const turnCountDisplay = document.getElementById('turn-count');
const logEntriesContainer = document.getElementById('log-entries');

// Initialize Canvas
canvas.width = MAP_WIDTH * TILE_SIZE;
canvas.height = MAP_HEIGHT * TILE_SIZE;

// Initialize Game
function initGame() {
    // Generate map
    generateMap();
    
    // Place initial buildings
    placeInitialBuildings();
    
    // Place units
    placeInitialUnits();
    
    // Update UI
    updateUI();
    
    // Draw initial state
    drawGame();
    
    // Set up event listeners
    setupEventListeners();
}

// Generate random map with special terrain
function generateMap() {
    gameState.map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Random terrain with different weights
            const rand = Math.random();
            let terrain;
            
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                terrain = TERRAIN.WALL; // Border walls
            } else if (rand < 0.65) {
                terrain = TERRAIN.GRASS;
            } else if (rand < 0.8) {
                terrain = TERRAIN.FOREST;
            } else if (rand < 0.9) {
                terrain = TERRAIN.MOUNTAIN;
            } else if (rand < 0.95) {
                terrain = TERRAIN.WATER;
            } else {
                terrain = TERRAIN.WALL; // Inner walls
            }
            
            row.push(terrain);
        }
        gameState.map.push(row);
    }
}

// Place initial buildings (castles, bases, villages)
function placeInitialBuildings() {
    gameState.buildings = [];
    
    // Player castle
    gameState.buildings.push({
        x: 2,
        y: 2,
        type: 'CASTLE',
        owner: 0,
        health: 20
    });
    gameState.map[2][2] = TERRAIN.CASTLE;
    
    // AI castle
    gameState.buildings.push({
        x: MAP_WIDTH - 3,
        y: MAP_HEIGHT - 3,
        type: 'CASTLE',
        owner: 1,
        health: 20
    });
    gameState.map[MAP_HEIGHT - 3][MAP_WIDTH - 3] = TERRAIN.CASTLE;
    
    // Player base
    gameState.buildings.push({
        x: 4,
        y: 2,
        type: 'BASE',
        owner: 0,
        health: 10
    });
    gameState.map[2][4] = TERRAIN.BASE;
    
    // AI base
    gameState.buildings.push({
        x: MAP_WIDTH - 5,
        y: MAP_HEIGHT - 3,
        type: 'BASE',
        owner: 1,
        health: 10
    });
    gameState.map[MAP_HEIGHT - 3][MAP_WIDTH - 5] = TERRAIN.BASE;
    
    // Villages (neutral)
    for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
        
        if (gameState.map[y][x] === TERRAIN.GRASS) {
            gameState.buildings.push({
                x,
                y,
                type: 'VILLAGE',
                owner: -1,
                health: 5
            });
            gameState.map[y][x] = TERRAIN.VILLAGE;
        }
    }
}

// Place initial units for both players
function placeInitialUnits() {
    gameState.units = [];
    
    // Player units
    gameState.units.push(createUnit(3, 3, 0, UNIT_TYPES.SOLDIER));
    gameState.units.push(createUnit(4, 3, 0, UNIT_TYPES.ARCHER));
    gameState.units.push(createUnit(3, 4, 0, UNIT_TYPES.KNIGHT));
    gameState.units.push(createUnit(5, 3, 0, UNIT_TYPES.SCOUT));
    
    // AI units
    gameState.units.push(createUnit(MAP_WIDTH - 4, MAP_HEIGHT - 4, 1, UNIT_TYPES.SOLDIER));
    gameState.units.push(createUnit(MAP_WIDTH - 5, MAP_HEIGHT - 4, 1, UNIT_TYPES.ARCHER));
    gameState.units.push(createUnit(MAP_WIDTH - 4, MAP_HEIGHT - 5, 1, UNIT_TYPES.KNIGHT));
    gameState.units.push(createUnit(MAP_WIDTH - 6, MAP_HEIGHT - 4, 1, UNIT_TYPES.SCOUT));
}

// Create a unit object
function createUnit(x, y, player, unitType) {
    return {
        x,
        y,
        player,
        type: unitType.name,
        health: unitType.health,
        maxHealth: unitType.health,
        attack: unitType.attack,
        defense: unitType.defense,
        movement: unitType.movement,
        movementLeft: unitType.movement,
        range: unitType.range,
        canCapture: unitType.canCapture,
        hasAttacked: false,
        hasMoved: false,
        isReady: false
    };
}

// Draw the game state
function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw map
    drawMap();
    
    // Draw buildings
    drawBuildings();
    
    // Draw movement/attack highlights
    drawHighlights();
    
    // Draw units
    drawUnits();
    
    // Draw fog of war if enabled
    if (FOG_OF_WAR) {
        drawFogOfWar();
    }
}

// Draw the map tiles
function drawMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Skip if tile is hidden by fog of war
            if (FOG_OF_WAR && !gameState.visibleTiles.has(`${x},${y}`)) {
                continue;
            }
            
            const terrain = gameState.map[y][x];
            ctx.fillStyle = getTerrainColor(terrain);
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            
            // Draw grid lines
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

// Get color for terrain type
function getTerrainColor(terrain) {
    switch (terrain) {
        case TERRAIN.GRASS: return '#27ae60';
        case TERRAIN.MOUNTAIN: return '#7f8c8d';
        case TERRAIN.WATER: return '#3498db';
        case TERRAIN.FOREST: return '#16a085';
        case TERRAIN.WALL: return '#333';
        case TERRAIN.CASTLE: return '#f1c40f';
        case TERRAIN.BASE: return '#9b59b6';
        case TERRAIN.VILLAGE: return '#e67e22';
        default: return '#ecf0f1';
    }
}

// Draw buildings
function drawBuildings() {
    for (const building of gameState.buildings) {
        if (FOG_OF_WAR && !gameState.visibleTiles.has(`${building.x},${building.y}`)) continue;
        
        ctx.fillStyle = getBuildingColor(building);
        ctx.fillRect(
            building.x * TILE_SIZE + 5,
            building.y * TILE_SIZE + 5,
            TILE_SIZE - 10,
            TILE_SIZE - 10
        );
        
        // Draw building health if damaged
        if (building.health < (building.type === 'CASTLE' ? 20 : building.type === 'BASE' ? 10 : 5)) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                building.health.toString(),
                building.x * TILE_SIZE + TILE_SIZE / 2,
                building.y * TILE_SIZE + TILE_SIZE / 2
            );
        }
    }
}

// Get color for building based on owner
function getBuildingColor(building) {
    if (building.owner === 0) return 'rgba(231, 76, 60, 0.7)'; // Player (red)
    if (building.owner === 1) return 'rgba(52, 152, 219, 0.7)'; // AI (blue)
    return 'rgba(241, 196, 15, 0.7)'; // Neutral (yellow)
}

// Draw movement and attack highlights
function drawHighlights() {
    if (!gameState.selectedUnit) return;
    
    const unit = gameState.selectedUnit;
    
    // Draw movement highlights
    if (!gameState.selectedAction || gameState.selectedAction === 'move') {
        const movableTiles = getMovableTiles(unit);
        ctx.fillStyle = 'rgba(241, 196, 15, 0.5)';
        for (const tile of movableTiles) {
            if (FOG_OF_WAR && !gameState.visibleTiles.has(`${tile.x},${tile.y}`)) continue;
            ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    
    // Draw attack highlights
    if (!gameState.selectedAction || gameState.selectedAction === 'attack') {
        const attackableTiles = getAttackableTiles(unit);
        ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
        for (const tile of attackableTiles) {
            if (FOG_OF_WAR && !gameState.visibleTiles.has(`${tile.x},${tile.y}`)) continue;
            ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    
    // Draw capture highlights
    if (unit.canCapture && (!gameState.selectedAction || gameState.selectedAction === 'capture')) {
        const capturableBuildings = getCapturableBuildings(unit);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
        for (const building of capturableBuildings) {
            if (FOG_OF_WAR && !gameState.visibleTiles.has(`${building.x},${building.y}`)) continue;
            ctx.fillRect(building.x * TILE_SIZE, building.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

// Draw all units
function drawUnits() {
    for (const unit of gameState.units) {
        // Skip if unit is hidden by fog of war
        if (FOG_OF_WAR && !gameState.visibleTiles.has(`${unit.x},${unit.y}`)) {
            continue;
        }
        
        ctx.fillStyle = unit.player === 0 ? '#e74c3c' : '#3498db';
        const centerX = unit.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = unit.y * TILE_SIZE + TILE_SIZE / 2;
        const radius = TILE_SIZE / 3;
        
        // Draw unit circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar
        const healthPercent = unit.health / unit.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#2ecc71' : healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
        const healthWidth = TILE_SIZE * 0.6 * healthPercent;
        ctx.fillRect(
            centerX - TILE_SIZE * 0.3,
            centerY - TILE_SIZE * 0.4,
            healthWidth,
            3
        );
        
        // Draw unit type indicator
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        let typeChar;
        switch (unit.type) {
            case 'Soldier': typeChar = 'S'; break;
            case 'Archer': typeChar = 'A'; break;
            case 'Knight': typeChar = 'K'; break;
            case 'Scout': typeChar = 'C'; break;
            default: typeChar = '?';
        }
        ctx.fillText(typeChar, centerX, centerY + 4);
        
        // Draw movement status
        if (unit.hasMoved) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
                centerX - radius,
                centerY - radius,
                radius * 2,
                radius * 2
            );
        }
    }
}

// Draw fog of war
function drawFogOfWar() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (!gameState.visibleTiles.has(`${x},${y}`)) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// Update visible tiles based on fog of war
function updateVisibleTiles() {
    if (!FOG_OF_WAR) return;
    
    gameState.visibleTiles = new Set();
    
    // Add tiles around player units and buildings
    for (const unit of gameState.units) {
        if (unit.player === 0) { // Only player units reveal fog
            revealArea(unit.x, unit.y, 3);
        }
    }
    
    for (const building of gameState.buildings) {
        if (building.owner === 0) { // Only player buildings reveal fog
            revealArea(building.x, building.y, 2);
        }
    }
}

// Reveal area around a point
function revealArea(x, y, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Check if within map bounds
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                // Simple circular check
                if (Math.sqrt(dx*dx + dy*dy) <= radius) {
                    gameState.visibleTiles.add(`${nx},${ny}`);
                }
            }
        }
    }
}

// Get movable tiles for a unit
function getMovableTiles(unit) {
    const movableTiles = [];
    const visited = new Set();
    const queue = [{ x: unit.x, y: unit.y, movesLeft: unit.movementLeft }];
    
    visited.add(`${unit.x},${unit.y}`);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Skip if we've used all movement
        if (current.movesLeft <= 0) continue;
        
        // Check all 4 directions
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        
        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            
            // Check bounds
            if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
            
            // Check if already visited
            if (visited.has(`${nx},${ny}`)) continue;
            
            // Check if tile is passable
            const terrain = gameState.map[ny][nx];
            if (terrain === TERRAIN.MOUNTAIN || terrain === TERRAIN.WATER || terrain === TERRAIN.WALL) continue;
            
            // Check if tile is occupied by another unit
            const unitAtTile = getUnitAt(nx, ny);
            if (unitAtTile) continue;
            
            // Add to movable tiles if not occupied
            movableTiles.push({ x: nx, y: ny });
            
            // Add to queue for further exploration
            let movesCost = 1;
            if (terrain === TERRAIN.FOREST) movesCost = 2;
            if (terrain === TERRAIN.CASTLE || terrain === TERRAIN.BASE || terrain === TERRAIN.VILLAGE) movesCost = 1;
            
            queue.push({
                x: nx,
                y: ny,
                movesLeft: current.movesLeft - movesCost
            });
            
            visited.add(`${nx},${ny}`);
        }
    }
    
    return movableTiles;
}

// Get attackable tiles for a unit
function getAttackableTiles(unit) {
    const attackableTiles = [];
    
    // Check all tiles within attack range
    for (let dy = -unit.range; dy <= unit.range; dy++) {
        for (let dx = -unit.range; dx <= unit.range; dx++) {
            // Skip if out of range (diamond shape)
            if (Math.abs(dx) + Math.abs(dy) > unit.range) continue;
            
            const nx = unit.x + dx;
            const ny = unit.y + dy;
            
            // Check bounds
            if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
            
            // Check if there's an enemy unit at this position
            const targetUnit = getUnitAt(nx, ny);
            if (targetUnit && targetUnit.player !== unit.player) {
                attackableTiles.push({ x: nx, y: ny });
            }
        }
    }
    
    return attackableTiles;
}

// Get capturable buildings adjacent to a unit
function getCapturableBuildings(unit) {
    const capturable = [];
    
    if (!unit.canCapture) return capturable;
    
    // Check adjacent tiles
    const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];
    
    for (const dir of directions) {
        const nx = unit.x + dir.dx;
        const ny = unit.y + dir.dy;
        
        // Check bounds
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
        
        // Check if there's a capturable building
        const building = getBuildingAt(nx, ny);
        if (building && building.owner !== unit.player) {
            capturable.push(building);
        }
    }
    
    return capturable;
}

// Get unit at specific coordinates
function getUnitAt(x, y) {
    return gameState.units.find(unit => unit.x === x && unit.y === y);
}

// Get building at specific coordinates
function getBuildingAt(x, y) {
    return gameState.buildings.find(b => b.x === x && b.y === y);
}

// Check if a move is valid
function isValidMove(unit, x, y) {
    // Check if the destination is within movable tiles
    const movableTiles = getMovableTiles(unit);
    return movableTiles.some(tile => tile.x === x && tile.y === y);
}

// Check if an attack is valid
function isValidAttack(unit, x, y) {
    // Check if the target is within attackable tiles
    const attackableTiles = getAttackableTiles(unit);
    return attackableTiles.some(tile => tile.x === x && tile.y === y);
}

// Check if a capture is valid
function isValidCapture(unit, x, y) {
    if (!unit.canCapture) return false;
    
    // Check adjacent tiles
    const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];
    
    for (const dir of directions) {
        const nx = unit.x + dir.dx;
        const ny = unit.y + dir.dy;
        
        if (nx === x && ny === y) {
            const building = getBuildingAt(x, y);
            return building && building.owner !== unit.player;
        }
    }
    
    return false;
}

// Move a unit to new coordinates with animation
function moveUnit(unit, x, y) {
    // Calculate movement cost
    const terrain = gameState.map[y][x];
    let movesCost = 1;
    if (terrain === TERRAIN.FOREST) movesCost = 2;
    
    // Animate movement
    const startX = unit.x * TILE_SIZE + TILE_SIZE / 2;
    const startY = unit.y * TILE_SIZE + TILE_SIZE / 2;
    const endX = x * TILE_SIZE + TILE_SIZE / 2;
    const endY = y * TILE_SIZE + TILE_SIZE / 2;
    
    // Update unit position immediately for game logic
    const oldX = unit.x;
    const oldY = unit.y;
    unit.x = x;
    unit.y = y;
    unit.movementLeft -= movesCost;
    unit.hasMoved = true;
    
    // Redraw game without the unit at old position
    drawGame();
    
    // Draw unit at intermediate positions
    const steps = 10;
    let step = 0;
    
    function animate() {
        if (step >= steps) {
            // Animation complete
            drawGame();
            
            // Check if we can capture any buildings after moving
            const capturable = getCapturableBuildings(unit);
            if (capturable.length > 0 && !unit.hasAttacked) {
                gameState.selectedUnit = unit;
                gameState.selectedAction = 'capture';
                updateUI();
            } else {
                gameState.selectedUnit = null;
                gameState.selectedAction = null;
            }
            
            // Update fog of war
            if (FOG_OF_WAR) {
                updateVisibleTiles();
            }
            
            return;
        }
        
        step++;
        const progress = step / steps;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;
        
        // Redraw everything
        drawMap();
        drawBuildings();
        drawHighlights();
        
        // Draw all units except the moving one
        for (const u of gameState.units) {
            if (u !== unit) {
                drawSingleUnit(u);
            }
        }
        
        // Draw moving unit at current position
        ctx.save();
        ctx.translate(currentX, currentY);
        drawSingleUnit(unit, true);
        ctx.restore();
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Add to log
    addToLog(`${unit.type} moved from (${oldX},${oldY}) to (${x},${y})`);
}

// Draw a single unit (helper function for animation)
function drawSingleUnit(unit, isMoving = false) {
    ctx.fillStyle = unit.player === 0 ? '#e74c3c' : '#3498db';
    const radius = TILE_SIZE / 3;
    
    // Draw unit circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw health bar
    const healthPercent = unit.health / unit.maxHealth;
    ctx.fillStyle = healthPercent > 0.6 ? '#2ecc71' : healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
    const healthWidth = TILE_SIZE * 0.6 * healthPercent;
    ctx.fillRect(
        -TILE_SIZE * 0.3,
        -TILE_SIZE * 0.4,
        healthWidth,
        3
    );
    
    // Draw unit type indicator
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    let typeChar;
    switch (unit.type) {
        case 'Soldier': typeChar = 'S'; break;
        case 'Archer': typeChar = 'A'; break;
        case 'Knight': typeChar = 'K'; break;
        case 'Scout': typeChar = 'C'; break;
        default: typeChar = '?';
    }
    ctx.fillText(typeChar, 0, 4);
    
    // Draw movement status
    if (unit.hasMoved && !isMoving) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
            -radius,
            -radius,
            radius * 2,
            radius * 2
        );
    }
}

// Attack another unit with animation
function attackUnit(attacker, defender) {
    // Calculate damage
    const terrainDefense = gameState.map[defender.y][defender.x] === TERRAIN.FOREST ? 1 : 0;
    const defense = defender.defense + terrainDefense;
    const damage = Math.max(1, attacker.attack - defense);
    
    // Animate attack
    const attackerX = attacker.x * TILE_SIZE + TILE_SIZE / 2;
    const attackerY = attacker.y * TILE_SIZE + TILE_SIZE / 2;
    const defenderX = defender.x * TILE_SIZE + TILE_SIZE / 2;
    const defenderY = defender.y * TILE_SIZE + TILE_SIZE / 2;
    
    // Mark attacker as having attacked
    attacker.hasAttacked = true;
    
    let animationStep = 0;
    const totalSteps = 10;
    
    function animateAttack() {
        if (animationStep >= totalSteps) {
            // Animation complete
            drawGame();
            
            // Apply damage
            defender.health -= damage;
            
            // Show damage number
            showDamage(defenderX, defenderY, damage);
            
            // Check if defender is dead
            if (defender.health <= 0) {
                gameState.units = gameState.units.filter(u => u !== defender);
                addToLog(`${attacker.type} destroyed enemy ${defender.type}!`);
            } else {
                addToLog(`${attacker.type} attacked ${defender.type} for ${damage} damage`);
            }
            
            // Check victory conditions
            checkVictory();
            
            // Reset selection
            gameState.selectedUnit = null;
            gameState.selectedAction = null;
            updateUI();
            
            return;
        }
        
        animationStep++;
        
        // Calculate animation progress (back and forth)
        let progress;
        if (animationStep < totalSteps / 2) {
            progress = animationStep / (totalSteps / 2);
        } else {
            progress = 2 - animationStep / (totalSteps / 2);
        }
        
        // Calculate current positions
        const currentAttackerX = attackerX + (defenderX - attackerX) * 0.2 * progress;
        const currentAttackerY = attackerY + (defenderY - attackerY) * 0.2 * progress;
        
        // Redraw everything
        drawMap();
        drawBuildings();
        drawHighlights();
        
        // Draw all units except attacker and defender
        for (const unit of gameState.units) {
            if (unit !== attacker && unit !== defender) {
                drawSingleUnit(unit);
            }
        }
        
        // Draw defender
        ctx.save();
        ctx.translate(defenderX, defenderY);
        if (animationStep > totalSteps / 2) {
            ctx.scale(1.0 + 0.1 * (1 - progress), 1.0 + 0.1 * (1 - progress));
        }
        drawSingleUnit(defender);
        ctx.restore();
        
        // Draw attacker
        ctx.save();
        ctx.translate(currentAttackerX, currentAttackerY);
        drawSingleUnit(attacker);
        ctx.restore();
        
        requestAnimationFrame(animateAttack);
    }
    
    animateAttack();
}

// Show damage number animation
function showDamage(x, y, amount) {
    const damageElement = document.createElement('div');
    damageElement.className = 'damage-effect';
    damageElement.textContent = `-${amount}`;
    damageElement.style.left = `${x}px`;
    damageElement.style.top = `${y}px`;
    document.body.appendChild(damageElement);
    
    setTimeout(() => {
        damageElement.remove();
    }, 1000);
}

// Capture a building
function captureBuilding(unit, building) {
    // Animate capture
    addToLog(`${unit.type} is capturing ${building.type}...`);
    
    // Reduce building health
    building.health -= 2;
    
    // Check if building is captured
    if (building.health <= 0) {
        building.owner = unit.player;
        building.health = building.type === 'CASTLE' ? 20 : building.type === 'BASE' ? 10 : 5;
        addToLog(`${unit.type} captured ${building.type}!`);
        
        // Add gold for capturing
        if (building.type === 'VILLAGE') {
            gameState.gold[unit.player] += 50;
            addToLog(`+50 gold for capturing village!`);
        }
    } else {
        addToLog(`${building.type} health: ${building.health}/${building.type === 'CASTLE' ? 20 : building.type === 'BASE' ? 10 : 5}`);
    }
    
    // Mark unit as having attacked
    unit.hasAttacked = true;
    
    // Update UI
    updateUI();
    drawGame();
    
    // Check victory conditions
    checkVictory();
}

// Check victory conditions
function checkVictory() {
    const playerUnits = gameState.units.filter(u => u.player === 0);
    const enemyUnits = gameState.units.filter(u => u.player === 1);
    const playerCastle = gameState.buildings.find(b => b.type === 'CASTLE' && b.owner === 0);
    const enemyCastle = gameState.buildings.find(b => b.type === 'CASTLE' && b.owner === 1);
    
    // Check kill all condition
    if (gameState.victoryCondition.killAll && enemyUnits.length === 0) {
        gameState.gameOver = true;
        gameStateDisplay.textContent = "Victory! All enemy units are destroyed.";
        addToLog("Player achieved victory by defeating all enemies!");
        return;
    }
    
    if (gameState.victoryCondition.killAll && playerUnits.length === 0) {
        gameState.gameOver = true;
        gameStateDisplay.textContent = "Defeat! All your units are destroyed.";
        addToLog("Player was defeated - all units lost!");
        return;
    }
    
    // Check capture castle condition
    if (gameState.victoryCondition.captureCastle) {
        if (!enemyCastle) {
            gameState.gameOver = true;
            gameStateDisplay.textContent = "Victory! Enemy castle captured.";
            addToLog("Player achieved victory by capturing the enemy castle!");
            return;
        }
        
        if (!playerCastle) {
            gameState.gameOver = true;
            gameStateDisplay.textContent = "Defeat! Your castle was captured.";
            addToLog("Player was defeated - castle captured!");
            return;
        }
    }
}

// End current turn
function endTurn() {
    if (gameState.gameOver) return;
    
    gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
    gameState.turn++;
    
    // Reset all player units for new turn
    for (const unit of gameState.units.filter(u => u.player === gameState.currentPlayer)) {
        unit.movementLeft = unit.movement;
        unit.hasMoved = false;
        unit.hasAttacked = false;
    }
    
    // Add income
    if (gameState.currentPlayer === 0) {
        // Player income
        const bases = gameState.buildings.filter(b => b.owner === 0 && (b.type === 'BASE' || b.type === 'CASTLE'));
        const villages = gameState.buildings.filter(b => b.owner === 0 && b.type === 'VILLAGE');
        
        const income = bases.length * 50 + villages.length * 20;
        gameState.gold[0] += income;
        
        if (income > 0) {
            addToLog(`Player received ${income} gold (${bases.length} bases, ${villages.length} villages)`);
        }
    } else {
        // AI income
        const bases = gameState.buildings.filter(b => b.owner === 1 && (b.type === 'BASE' || b.type === 'CASTLE'));
        const villages = gameState.buildings.filter(b => b.owner === 1 && b.type === 'VILLAGE');
        
        gameState.gold[1] += bases.length * 50 + villages.length * 20;
    }
    
    // Update UI
    updateUI();
    drawGame();
    
    // If it's AI's turn, execute AI moves
    if (gameState.currentPlayer === 1) {
        setTimeout(executeAITurn, 1000);
    }
}

// AI turn logic
function executeAITurn() {
    if (gameState.gameOver) return;
    
    addToLog("Enemy turn begins...");
    
    // Simple AI: move toward nearest player unit/castle and attack if possible
    for (const aiUnit of gameState.units.filter(u => u.player === 1)) {
        if (aiUnit.health <= 0) continue;
        
        // Find nearest target (player unit or castle)
        let nearestTarget = null;
        let minDistance = Infinity;
        let targetIsCastle = false;
        
        // Check player units
        for (const playerUnit of gameState.units.filter(u => u.player === 0)) {
            const distance = Math.abs(aiUnit.x - playerUnit.x) + Math.abs(aiUnit.y - playerUnit.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTarget = playerUnit;
                targetIsCastle = false;
            }
        }
        
        // Check player castle
        const playerCastle = gameState.buildings.find(b => b.type === 'CASTLE' && b.owner === 0);
        if (playerCastle) {
            const distance = Math.abs(aiUnit.x - playerCastle.x) + Math.abs(aiUnit.y - playerCastle.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTarget = playerCastle;
                targetIsCastle = true;
            }
        }
        
        if (!nearestTarget) continue;
        
        // Try to attack if in range
        if (!targetIsCastle) {
            const attackableTiles = getAttackableTiles(aiUnit);
            const canAttack = attackableTiles.some(tile => 
                tile.x === nearestTarget.x && tile.y === nearestTarget.y
            );
            
            if (canAttack) {
                attackUnit(aiUnit, nearestTarget);
                continue;
            }
        }
        
        // Try to capture if adjacent to castle
        if (targetIsCastle && aiUnit.canCapture) {
            const capturable = getCapturableBuildings(aiUnit);
            const canCapture = capturable.some(b => b === nearestTarget);
            
            if (canCapture) {
                captureBuilding(aiUnit, nearestTarget);
                continue;
            }
        }
        
        // Otherwise move toward the target
        const movableTiles = getMovableTiles(aiUnit);
        let bestMove = null;
        let bestMoveDistance = Infinity;
        
        for (const move of movableTiles) {
            const distance = Math.abs(move.x - nearestTarget.x) + Math.abs(move.y - nearestTarget.y);
            if (distance < bestMoveDistance) {
                bestMoveDistance = distance;
                bestMove = move;
            }
        }
        
        if (bestMove) {
            // For AI, move immediately without animation
            aiUnit.x = bestMove.x;
            aiUnit.y = bestMove.y;
            
            // Deduct movement points based on terrain
            const terrain = gameState.map[bestMove.y][bestMove.x];
            aiUnit.movementLeft -= terrain === TERRAIN.FOREST ? 2 : 1;
            aiUnit.hasMoved = true;
            
            // Try to attack after moving if possible
            if (!targetIsCastle) {
                const newAttackableTiles = getAttackableTiles(aiUnit);
                const newCanAttack = newAttackableTiles.some(tile => 
                    tile.x === nearestTarget.x && tile.y === nearestTarget.y
                );
                
                if (newCanAttack) {
                    attackUnit(aiUnit, nearestTarget);
                }
            }
            
            // Try to capture after moving if possible
            if (targetIsCastle && aiUnit.canCapture) {
                const capturable = getCapturableBuildings(aiUnit);
                const canCapture = capturable.some(b => b === nearestTarget);
                
                if (canCapture) {
                    captureBuilding(aiUnit, nearestTarget);
                }
            }
        }
    }
    
    // End AI turn
    addToLog("Enemy turn ends.");
    endTurn();
}

// Add message to game log
function addToLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${timeString}] ${message}`;
    logEntriesContainer.appendChild(logEntry);
    logEntriesContainer.scrollTop = logEntriesContainer.scrollHeight;
    
    // Keep only the last 50 log entries
    while (logEntriesContainer.children.length > 50) {
        logEntriesContainer.removeChild(logEntriesContainer.firstChild);
    }
    
    // Add to game state log
    gameState.log.push(message);
}

// Update UI elements
function updateUI() {
    // Update current player display
    currentPlayerDisplay.textContent = gameState.currentPlayer === 0 ? "Player Turn" : "Enemy Turn";
    currentPlayerDisplay.style.color = gameState.currentPlayer === 0 ? "#e74c3c" : "#3498db";
    
    // Update turn count
    turnCountDisplay.textContent = gameState.turn;
    
    // Update gold amount
    goldAmountDisplay.textContent = gameState.gold[0];
    
    // Update game state display
    if (gameState.gameOver) {
        gameStateDisplay.textContent = gameStateDisplay.textContent; // Keep previous message
    } else if (gameState.selectedUnit) {
        gameStateDisplay.textContent = `Selected: ${gameState.selectedUnit.type}`;
        if (gameState.selectedAction) {
            gameStateDisplay.textContent += ` (${gameState.selectedAction})`;
        }
    } else {
        gameStateDisplay.textContent = "Select a unit";
    }
    
    // Update unit info panel
    if (gameState.selectedUnit) {
        const unit = gameState.selectedUnit;
        unitTypeDisplay.textContent = unit.type;
        unitHealthDisplay.textContent = `${unit.health}/${unit.maxHealth}`;
        unitAttackDisplay.textContent = unit.attack;
        unitRangeDisplay.textContent = unit.range;
        unitMovementDisplay.textContent = `${unit.movementLeft}/${unit.movement}`;
        
        // Update unit actions
        updateUnitActions(unit);
    } else {
        unitTypeDisplay.textContent = "-";
        unitHealthDisplay.textContent = "-";
        unitAttackDisplay.textContent = "-";
        unitRangeDisplay.textContent = "-";
        unitMovementDisplay.textContent = "-";
        unitActionsContainer.innerHTML = "";
    }
}

// Update available actions for selected unit
function updateUnitActions(unit) {
    unitActionsContainer.innerHTML = "";
    
    if (unit.player !== 0 || gameState.currentPlayer !== 0) return;
    
    // Move action
    const moveBtn = document.createElement('button');
    moveBtn.className = 'action-btn';
    moveBtn.textContent = 'Move';
    moveBtn.disabled = unit.hasMoved;
    moveBtn.addEventListener('click', () => {
        gameState.selectedAction = 'move';
        updateUI();
        drawGame();
    });
    unitActionsContainer.appendChild(moveBtn);
    
    // Attack action
    const attackBtn = document.createElement('button');
    attackBtn.className = 'action-btn';
    attackBtn.textContent = 'Attack';
    attackBtn.disabled = unit.hasAttacked || getAttackableTiles(unit).length === 0;
    attackBtn.addEventListener('click', () => {
        gameState.selectedAction = 'attack';
        updateUI();
        drawGame();
    });
    unitActionsContainer.appendChild(attackBtn);
    
    // Capture action (if unit can capture)
    if (unit.canCapture) {
        const captureBtn = document.createElement('button');
        captureBtn.className = 'action-btn';
        captureBtn.textContent = 'Capture';
        captureBtn.disabled = unit.hasAttacked || getCapturableBuildings(unit).length === 0;
        captureBtn.addEventListener('click', () => {
            gameState.selectedAction = 'capture';
            updateUI();
            drawGame();
        });
        unitActionsContainer.appendChild(captureBtn);
    }
    
    // Wait action
    const waitBtn = document.createElement('button');
    waitBtn.className = 'action-btn';
    waitBtn.textContent = 'Wait';
    waitBtn.addEventListener('click', () => {
        unit.hasMoved = true;
        unit.hasAttacked = true;
        gameState.selectedUnit = null;
        gameState.selectedAction = null;
        updateUI();
        drawGame();
        addToLog(`${unit.type} waited and ended turn`);
    });
    unitActionsContainer.appendChild(waitBtn);
    
    // Cancel action
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'action-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        gameState.selectedUnit = null;
        gameState.selectedAction = null;
        updateUI();
        drawGame();
    });
    unitActionsContainer.appendChild(cancelBtn);
}

// Set up event listeners
function setupEventListeners() {
    // Canvas click handler
    canvas.addEventListener('click', (e) => {
        if (gameState.currentPlayer !== 0 || gameState.gameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
        
        // Check bounds
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
        
        // Check if a unit is selected
        if (gameState.selectedUnit) {
            const selectedUnit = gameState.selectedUnit;
            
            // Check if clicking on the selected unit itself (cancel selection)
            if (selectedUnit.x === x && selectedUnit.y === y) {
                gameState.selectedUnit = null;
                gameState.selectedAction = null;
                updateUI();
                drawGame();
                return;
            }
            
            // Check action type
            if (!gameState.selectedAction || gameState.selectedAction === 'move') {
                // Check if clicking on a movable tile
                if (isValidMove(selectedUnit, x, y)) {
                    moveUnit(selectedUnit, x, y);
                    return;
                }
            }
            
            if (!gameState.selectedAction || gameState.selectedAction === 'attack') {
                // Check if clicking on an attackable enemy
                const targetUnit = getUnitAt(x, y);
                if (targetUnit && targetUnit.player !== selectedUnit.player && isValidAttack(selectedUnit, x, y)) {
                    attackUnit(selectedUnit, targetUnit);
                    return;
                }
            }
            
            if ((!gameState.selectedAction || gameState.selectedAction === 'capture') && selectedUnit.canCapture) {
                // Check if clicking on a capturable building
                const building = getBuildingAt(x, y);
                if (building && building.owner !== selectedUnit.player && isValidCapture(selectedUnit, x, y)) {
                    captureBuilding(selectedUnit, building);
                    return;
                }
            }
        } else {
            // Try to select a unit
            const unit = getUnitAt(x, y);
            if (unit && unit.player === 0 && (!unit.hasMoved || !unit.hasAttacked)) {
                gameState.selectedUnit = unit;
                gameState.selectedAction = null;
                updateUI();
                drawGame();
            }
        }
    });
    
    // End turn button
    endTurnButton.addEventListener('click', endTurn);
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    initGame();
    if (FOG_OF_WAR) updateVisibleTiles();
    addToLog("Game started. Good luck, commander!");
});