const missions = [
    {
        id: 1,
        title: "Castle Infiltration",
        objective: "Eliminate all enemy units",
        map: [
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['wall', 'grass', 'grass', 'path', 'path', 'path', 'grass', 'grass', 'grass', 'wall'],
            ['wall', 'grass', 'house', 'path', 'grass', 'path', 'house', 'grass', 'grass', 'wall'],
            ['wall', 'path', 'path', 'path', 'grass', 'grass', 'path', 'path', 'path', 'wall'],
            ['wall', 'grass', 'grass', 'grass', 'water', 'water', 'grass', 'house', 'grass', 'wall'],
            ['wall', 'grass', 'house', 'grass', 'water', 'water', 'grass', 'grass', 'grass', 'wall'],
            ['wall', 'path', 'path', 'path', 'grass', 'grass', 'path', 'path', 'path', 'wall'],
            ['wall', 'grass', 'grass', 'path', 'grass', 'path', 'house', 'grass', 'grass', 'wall'],
            ['wall', 'grass', 'grass', 'path', 'path', 'path', 'grass', 'grass', 'grass', 'wall'],
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
        ],
        playerUnits: [
            { type: 'Rikimaru', x: 1, y: 1 },
            { type: 'Ayame', x: 1, y: 8 },
            { type: 'Tesshu', x: 2, y: 1 }
        ],
        enemyUnits: [
            { type: 'SwordSamurai', x: 5, y: 5 },
            { type: 'SpearSamurai', x: 7, y: 3 },
            { type: 'Archer', x: 4, y: 7 },
            { type: 'GuardDog', x: 6, y: 6 }
        ]
    }
];

const unitData = {
    // Ninja units
    Rikimaru: {
        name: "Rikimaru",
        type: "ninja",
        symbol: "🗡️",
        movement: "Knight (L-shape)",
        attack: "Adjacent",
        special: "Silent Kill: Eliminate adjacent enemy if unseen",
        description: "Stealthy assassin with deadly close-range attacks."
    },
    Ayame: {
        name: "Ayame",
        type: "ninja",
        symbol: "🏹",
        movement: "Rook (straight lines)",
        attack: "Range 2",
        special: "Grappling Hook: Jump over 1 obstacle",
        description: "Agile infiltrator with ranged attacks and mobility."
    },
    Tesshu: {
        name: "Tesshu",
        type: "ninja",
        symbol: "🛡️",
        movement: "King (1 tile any direction)",
        attack: "Adjacent",
        special: "Smoke Bomb: Disappear for 1 turn",
        description: "Defensive specialist with survival tricks."
    },
    Rin: {
        name: "Rin",
        type: "ninja",
        symbol: "☠️",
        movement: "Bishop (diagonals)",
        attack: "Range 2",
        special: "Poison Dart: Stun enemy for 1 turn",
        description: "Support unit with crowd control abilities."
    },
    Tatsumaru: {
        name: "Tatsumaru",
        type: "ninja",
        symbol: "⚔️",
        movement: "Ferocious Leap (like Shogi's Knight)",
        attack: "Adjacent",
        special: "Counter: If attacked, strike back first",
        description: "Offensive powerhouse with counterattacks."
    },
    
    // Enemy units
    SwordSamurai: {
        name: "Sword Samurai",
        type: "enemy",
        symbol: "🗡️",
        movement: "Pawn (forward 1)",
        attack: "Adjacent",
        vision: "Forward 1 tile",
        description: "Basic melee unit with limited vision."
    },
    SpearSamurai: {
        name: "Spear Samurai",
        type: "enemy",
        symbol: "🔱",
        movement: "Lance (forward 2)",
        attack: "Adjacent",
        vision: "Forward 2 tiles",
        description: "Long-reaching attacker with straight-line vision."
    },
    Archer: {
        name: "Archer",
        type: "enemy",
        symbol: "🏹",
        movement: "Rook (straight lines)",
        attack: "Range 3",
        vision: "Straight lines 3 tiles",
        description: "Ranged attacker with long line of sight."
    },
    GuardDog: {
        name: "Guard Dog",
        type: "enemy",
        symbol: "🐕",
        movement: "King (1 any direction)",
        attack: "Adjacent",
        vision: "2 tiles (ignores walls)",
        description: "Tracker that can smell through obstacles."
    }
};

const terrainEffects = {
    grass: { moveCost: 1, stealth: 0 },
    path: { moveCost: 1, stealth: -1 },
    wall: { moveCost: Infinity, stealth: 0 },
    water: { moveCost: 2, stealth: 0 },
    house: { moveCost: 1, stealth: 1 }
};