// Game Constants
const TILE_SIZE = 40;
const MAP_WIDTH = 15;
const MAP_HEIGHT = 10;
const FOG_OF_WAR_RADIUS = 3;

// Terrain Types
const TERRAIN = {
    GRASS: 0,
    MOUNTAIN: 1,
    WATER: 2,
    FOREST: 3
};

// Unit Types
const UNIT_TYPES = {
    SOLDIER: {
        name: "Soldier",
        health: 10,
        attack: 3,
        defense: 2,
        movement: 3,
        cost: 100,
        range: 1
    },
    ARCHER: {
        name: "Archer",
        health: 8,
        attack: 4,
        defense: 1,
        movement: 2,
        cost: 150,
        range: 2
    },
    CAVALRY: {
        name: "Cavalry",
        health: 12,
        attack: 4,
        defense: 1,
        movement: 4,
        cost: 200,
        range: 1
    }
};

// Game State
let gameState = {
    map: [],
    units: [],
    currentPlayer: 0, // 0 for player, 1 for AI
    selectedUnit: null,
    gameOver: false,
    fogOfWar: true,
    visibleTiles: new Set(),
    turn: 1
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
const unitMovementDisplay = document.getElementById('unit-movement');
const unitActionsContainer = document.getElementById('unit-actions');

// Initialize Canvas
canvas.width = MAP_WIDTH * TILE_SIZE;
canvas.height = MAP_HEIGHT * TILE_SIZE;

// Initialize Game
function initGame() {
    // Generate map
    generateMap();
    
    // Place units
    placeInitialUnits();
    
    // Update UI
    updateUI();
    
    // Draw initial state
    drawGame();
    
    // Set up event listeners
    setupEventListeners();
}

// Generate random map
function generateMap() {
    gameState.map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Random terrain with different weights
            const rand = Math.random();
            let terrain;
            
            if (rand < 0.7) terrain = TERRAIN.GRASS;
            else if (rand < 0.85) terrain = TERRAIN.FOREST;
            else if (rand < 0.95) terrain = TERRAIN.MOUNTAIN;
            else terrain = TERRAIN.WATER;
            
            row.push(terrain);
        }
        gameState.map.push(row);
    }
}

// Place initial units for both players
function placeInitialUnits() {
    gameState.units = [];
    
    // Player units
    gameState.units.push(createUnit(2, 2, 0, UNIT_TYPES.SOLDIER));
    gameState.units.push(createUnit(3, 2, 0, UNIT_TYPES.ARCHER));
    gameState.units.push(createUnit(4, 2, 0, UNIT_TYPES.CAVALRY));
    
    // AI units
    gameState.units.push(createUnit(MAP_WIDTH - 3, MAP_HEIGHT - 3, 1, UNIT_TYPES.SOLDIER));
    gameState.units.push(createUnit(MAP_WIDTH - 4, MAP_HEIGHT - 3, 1, UNIT_TYPES.ARCHER));
    gameState.units.push(createUnit(MAP_WIDTH - 5, MAP_HEIGHT - 3, 1, UNIT_TYPES.CAVALRY));
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
        hasAttacked: false,
        hasMoved: false
    };
}

// Draw the game state
function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw map
    drawMap();
    
    // Draw movement/attack highlights
    drawHighlights();
    
    // Draw units
    drawUnits();
    
    // Draw fog of war if enabled
    if (gameState.fogOfWar) {
        drawFogOfWar();
    }
}

// Draw the map tiles
function drawMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Skip if tile is hidden by fog of war
            if (gameState.fogOfWar && !gameState.visibleTiles.has(`${x},${y}`)) {
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
        default: return '#ecf0f1';
    }
}

// Draw movement and attack highlights
function drawHighlights() {
    if (!gameState.selectedUnit) return;
    
    const unit = gameState.selectedUnit;
    const movableTiles = getMovableTiles(unit);
    const attackableTiles = getAttackableTiles(unit);
    
    // Draw movement highlights
    ctx.fillStyle = 'rgba(241, 196, 15, 0.5)';
    for (const tile of movableTiles) {
        if (gameState.fogOfWar && !gameState.visibleTiles.has(`${tile.x},${tile.y}`)) continue;
        ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    
    // Draw attack highlights
    ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    for (const tile of attackableTiles) {
        if (gameState.fogOfWar && !gameState.visibleTiles.has(`${tile.x},${tile.y}`)) continue;
        ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

// Draw all units
function drawUnits() {
    for (const unit of gameState.units) {
        // Skip if unit is hidden by fog of war
        if (gameState.fogOfWar && !gameState.visibleTiles.has(`${unit.x},${unit.y}`)) {
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
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        let typeChar;
        switch (unit.type) {
            case 'Soldier': typeChar = 'S'; break;
            case 'Archer': typeChar = 'A'; break;
            case 'Cavalry': typeChar = 'C'; break;
            default: typeChar = '?';
        }
        ctx.fillText(typeChar, centerX, centerY + 3);
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
    if (!gameState.fogOfWar) return;
    
    gameState.visibleTiles = new Set();
    
    // Add tiles around player units
    for (const unit of gameState.units) {
        if (unit.player === 0) { // Only player units reveal fog
            for (let dy = -FOG_OF_WAR_RADIUS; dy <= FOG_OF_WAR_RADIUS; dy++) {
                for (let dx = -FOG_OF_WAR_RADIUS; dx <= FOG_OF_WAR_RADIUS; dx++) {
                    const x = unit.x + dx;
                    const y = unit.y + dy;
                    
                    // Check if within map bounds
                    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                        // Simple circular check
                        if (Math.sqrt(dx*dx + dy*dy) <= FOG_OF_WAR_RADIUS) {
                            gameState.visibleTiles.add(`${x},${y}`);
                        }
                    }
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
            if (terrain === TERRAIN.MOUNTAIN || terrain === TERRAIN.WATER) continue;
            
            // Check if tile is occupied by another unit
            const unitAtTile = getUnitAt(nx, ny);
            if (unitAtTile && unitAtTile.player !== unit.player) continue;
            
            // Add to movable tiles if not occupied
            if (!unitAtTile) {
                movableTiles.push({ x: nx, y: ny });
            }
            
            // Add to queue for further exploration
            const movesCost = terrain === TERRAIN.FOREST ? 2 : 1;
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

// Get unit at specific coordinates
function getUnitAt(x, y) {
    return gameState.units.find(unit => unit.x === x && unit.y === y);
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

// Move a unit to new coordinates
function moveUnit(unit, x, y) {
    unit.x = x;
    unit.y = y;
    
    // Deduct movement points based on terrain
    const terrain = gameState.map[y][x];
    unit.movementLeft -= terrain === TERRAIN.FOREST ? 2 : 1;
    unit.hasMoved = true;
    
    // Update fog of war
    if (gameState.fogOfWar) {
        updateVisibleTiles();
    }
    
    // Update UI
    updateUI();
    drawGame();
}

// Attack another unit
function attackUnit(attacker, defender) {
    // Calculate damage
    const terrainDefense = gameState.map[defender.y][defender.x] === TERRAIN.FOREST ? 1 : 0;
    const defense = defender.defense + terrainDefense;
    const damage = Math.max(1, attacker.attack - defense);
    
    // Apply damage
    defender.health -= damage;
    
    // Mark attacker as having attacked
    attacker.hasAttacked = true;
    
    // Check if defender is dead
    if (defender.health <= 0) {
        gameState.units = gameState.units.filter(u => u !== defender);
    }
    
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
    
    if (playerUnits.length === 0) {
        gameState.gameOver = true;
        gameStateDisplay.textContent = "Defeat! All your units are destroyed.";
    } else if (enemyUnits.length === 0) {
        gameState.gameOver = true;
        gameStateDisplay.textContent = "Victory! All enemy units are destroyed.";
    }
}

// AI turn logic
function executeAITurn() {
    if (gameState.gameOver) return;
    
    // Simple AI: move toward nearest player unit and attack if possible
    for (const aiUnit of gameState.units.filter(u => u.player === 1)) {
        if (aiUnit.health <= 0) continue;
        
        // Reset movement for new turn
        aiUnit.movementLeft = aiUnit.movement;
        aiUnit.hasMoved = false;
        aiUnit.hasAttacked = false;
        
        // Find nearest player unit
        let nearestPlayerUnit = null;
        let minDistance = Infinity;
        
        for (const playerUnit of gameState.units.filter(u => u.player === 0)) {
            const distance = Math.abs(aiUnit.x - playerUnit.x) + Math.abs(aiUnit.y - playerUnit.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPlayerUnit = playerUnit;
            }
        }
        
        if (!nearestPlayerUnit) continue;
        
        // Try to attack if in range
        const attackableTiles = getAttackableTiles(aiUnit);
        const canAttack = attackableTiles.some(tile => 
            tile.x === nearestPlayerUnit.x && tile.y === nearestPlayerUnit.y
        );
        
        if (canAttack) {
            attackUnit(aiUnit, nearestPlayerUnit);
            continue;
        }
        
        // Otherwise move toward the player unit
        const movableTiles = getMovableTiles(aiUnit);
        let bestMove = null;
        let bestMoveDistance = Infinity;
        
        for (const move of movableTiles) {
            const distance = Math.abs(move.x - nearestPlayerUnit.x) + Math.abs(move.y - nearestPlayerUnit.y);
            if (distance < bestMoveDistance) {
                bestMoveDistance = distance;
                bestMove = move;
            }
        }
        
        if (bestMove) {
            moveUnit(aiUnit, bestMove.x, bestMove.y);
            
            // Try to attack after moving if possible
            const newAttackableTiles = getAttackableTiles(aiUnit);
            const newCanAttack = newAttackableTiles.some(tile => 
                tile.x === nearestPlayerUnit.x && tile.y === nearestPlayerUnit.y
            );
            
            if (newCanAttack) {
                attackUnit(aiUnit, nearestPlayerUnit);
            }
        }
    }
    
    // End AI turn
    endTurn();
}

// End current turn
function endTurn() {
    if (gameState.gameOver) return;
    
    gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
    gameState.turn++;
    
    // Reset all player units for new turn
    if (gameState.currentPlayer === 0) {
        for (const unit of gameState.units.filter(u => u.player === 0)) {
            unit.movementLeft = unit.movement;
            unit.hasMoved = false;
            unit.hasAttacked = false;
        }
    }
    
    // Update UI
    updateUI();
    drawGame();
    
    // If it's AI's turn, execute AI moves
    if (gameState.currentPlayer === 1) {
        setTimeout(executeAITurn, 1000);
    }
}

// Update UI elements
function updateUI() {
    // Update current player display
    currentPlayerDisplay.textContent = gameState.currentPlayer === 0 ? "Player Turn" : "Enemy Turn";
    currentPlayerDisplay.style.color = gameState.currentPlayer === 0 ? "#e74c3c" : "#3498db";
    
    // Update game state display
    if (gameState.gameOver) {
        gameStateDisplay.textContent = gameStateDisplay.textContent; // Keep previous message
    } else if (gameState.selectedUnit) {
        gameStateDisplay.textContent = "Selected: " + gameState.selectedUnit.type;
    } else {
        gameStateDisplay.textContent = "Select a unit";
    }
    
    // Update unit info panel
    if (gameState.selectedUnit) {
        const unit = gameState.selectedUnit;
        unitTypeDisplay.textContent = unit.type;
        unitHealthDisplay.textContent = `${unit.health}/${unit.maxHealth}`;
        unitAttackDisplay.textContent = unit.attack;
        unitMovementDisplay.textContent = `${unit.movementLeft}/${unit.movement}`;
        
        // Update unit actions
        updateUnitActions(unit);
    } else {
        unitTypeDisplay.textContent = "-";
        unitHealthDisplay.textContent = "-";
        unitAttackDisplay.textContent = "-";
        unitMovementDisplay.textContent = "-";
        unitActionsContainer.innerHTML = "";
    }
}

// Update available actions for selected unit
function updateUnitActions(unit) {
    unitActionsContainer.innerHTML = "";
    
    if (unit.player !== 0 || gameState.currentPlayer !== 0) return;
    
    // Wait action
    const waitBtn = document.createElement('button');
    waitBtn.className = 'action-btn';
    waitBtn.textContent = 'Wait';
    waitBtn.addEventListener('click', () => {
        unit.hasMoved = true;
        unit.hasAttacked = true;
        gameState.selectedUnit = null;
        updateUI();
        drawGame();
    });
    unitActionsContainer.appendChild(waitBtn);
    
    // Cancel action
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'action-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        gameState.selectedUnit = null;
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
                updateUI();
                drawGame();
                return;
            }
            
            // Check if clicking on a movable tile
            if (isValidMove(selectedUnit, x, y)) {
                moveUnit(selectedUnit, x, y);
                gameState.selectedUnit = null;
                return;
            }
            
            // Check if clicking on an attackable enemy
            const targetUnit = getUnitAt(x, y);
            if (targetUnit && targetUnit.player !== selectedUnit.player && isValidAttack(selectedUnit, x, y)) {
                attackUnit(selectedUnit, targetUnit);
                gameState.selectedUnit = null;
                return;
            }
        } else {
            // Try to select a unit
            const unit = getUnitAt(x, y);
            if (unit && unit.player === 0 && !unit.hasMoved) {
                gameState.selectedUnit = unit;
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
    updateVisibleTiles();
});