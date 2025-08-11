// Word list: English -> Arabic
const words = [
    { english: "apple", arabic: "تفاحة" },
    { english: "book", arabic: "كتاب" },
    { english: "cat", arabic: "قطة" },
    { english: "dog", arabic: "كلب" },
    { english: "house", arabic: "منزل" },
    { english: "water", arabic: "ماء" },
    { english: "sun", arabic: "شمس" },
    { english: "moon", arabic: "قمر" }
];

// Game state variables
let score = 0;
let flippedCards = [];
let matchedPairs = 0;
let currentScrambledWord = "";

// Memory Game
function startMemoryGame() {
    score = 0;
    matchedPairs = 0;
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = `
        <h2>Memory Game</h2>
        <p>Score: <span id="score">0</span></p>
        <div id="cards"></div>
    `;
    
    // Duplicate and shuffle cards
    const cards = [...words, ...words]
        .map((word, index) => ({ ...word, id: index }))
        .sort(() => Math.random() - 0.5);
    
    // Create cards
    cards.forEach((word, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.id = word.id;
        card.textContent = index % 2 === 0 ? word.english : word.arabic;
        card.onclick = () => flipCard(card, word.id);
        document.getElementById('cards').appendChild(card);
    });
}

function flipCard(card, id) {
    // Ignore if already flipped or matched
    if (card.classList.contains('flipped') || flippedCards.length >= 2) return;
    
    card.classList.add('flipped');
    flippedCards.push({ card, id });
    
    // Check for match
    if (flippedCards.length === 2) {
        const [card1, card2] = flippedCards;
        
        if (card1.id === card2.id) {
            // Match found
            score += 10;
            document.getElementById('score').textContent = score;
            matchedPairs++;
            
            // Disable matched cards
            card1.card.classList.add('matched');
            card2.card.classList.add('matched');
            
            // Check win condition
            if (matchedPairs === words.length) {
                setTimeout(() => alert(`You won! Score: ${score}`), 500);
            }
        } else {
            // No match
            setTimeout(() => {
                card1.card.classList.remove('flipped');
                card2.card.classList.remove('flipped');
            }, 1000);
        }
        
        flippedCards = [];
    }
}

// Scramble Game
function startScrambleGame() {
    score = 0;
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = `
        <h2>Scramble Game</h2>
        <p>Score: <span id="score">0</span></p>
        <div id="scramble-word"></div>
        <input type="text" id="user-input" placeholder="Type the word...">
        <button onclick="checkAnswer()">Check</button>
        <p id="hint"></p>
        <p id="result"></p>
    `;
    
    nextScrambleWord();
}

function nextScrambleWord() {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    currentScrambledWord = scrambleWord(randomWord.english);
    
    document.getElementById('scramble-word').textContent = currentScrambledWord;
    document.getElementById('hint').textContent = `Hint: ${randomWord.arabic}`;
    document.getElementById('user-input').value = "";
    document.getElementById('result').textContent = "";
}

function scrambleWord(word) {
    return word.split('').sort(() => Math.random() - 0.5).join('');
}

function checkAnswer() {
    const userInput = document.getElementById('user-input').value.toLowerCase();
    const correctWord = words.find(word => 
        scrambleWord(word.english) === currentScrambledWord
    ).english;
    
    if (userInput === correctWord) {
        score += 5;
        document.getElementById('score').textContent = score;
        document.getElementById('result').textContent = "Correct! 🎉";
        document.getElementById('result').style.color = "green";
        setTimeout(nextScrambleWord, 1500);
    } else {
        document.getElementById('result').textContent = "Wrong! Try again.";
        document.getElementById('result').style.color = "red";
    }
}