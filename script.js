// Word list: English -> Arabic
const words = [
    { english: "apple", arabic: "تفاحة" },
    { english: "book", arabic: "كتاب" },
    { english: "cat", arabic: "قطة" },
    { english: "dog", arabic: "كلب" },
    { english: "house", arabic: "منزل" }
];

// Memory Game
function startMemoryGame() {
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '<h2>Memory Game</h2><div id="cards"></div>';
    
    // Duplicate and shuffle cards (English + Arabic pairs)
    const cards = [...words, ...words].sort(() => Math.random() - 0.5);
    let flippedCards = [];
    
    cards.forEach((word, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.textContent = index % 2 === 0 ? word.english : word.arabic;
        card.onclick = () => flipCard(card, word, index);
        document.getElementById('cards').appendChild(card);
    });
}

function flipCard(card, word, index) {
    // Logic to check matches (simplified for brevity)
    card.style.background = "#4CAF50";
    card.style.color = "white";
}

// Scramble Game (English only)
function startScrambleGame() {
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = `
        <h2>Scramble Game</h2>
        <div id="scramble-word"></div>
        <input type="text" id="user-input" placeholder="Type the word...">
        <button onclick="checkAnswer()">Check</button>
        <p id="hint"></p>
    `;
    
    // Pick a random word and scramble it
    const word = words[Math.floor(Math.random() * words.length)];
    const scrambled = word.english.split('').sort(() => Math.random() - 0.5).join('');
    
    document.getElementById('scramble-word').textContent = scrambled;
    document.getElementById('hint').textContent = `Hint: ${word.arabic}`;
}

function checkAnswer() {
    // Compare user input with correct answer (simplified)
    alert("Check if correct! (Will expand later)");
}