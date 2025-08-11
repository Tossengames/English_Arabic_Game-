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
let currentWord = {};

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
    const cardPairs = [];
    words.forEach(word => {
        cardPairs.push({ ...word, type: 'english' });
        cardPairs.push({ ...word, type: 'arabic' });
    });
    
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    
    // Create cards
    shuffledCards.forEach((word, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.id = word.english; // Use English word as ID
        card.dataset.type = word.type;
        card.textContent = word.type === 'english' ? word.english : word.arabic;
        card.onclick = () => flipCard(card);
        document.getElementById('cards').appendChild(card);
    });

    // Show cards briefly at start
    showCardsBriefly();
}

function showCardsBriefly() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.add('flipped'));
    
    setTimeout(() => {
        cards.forEach(card => card.classList.remove('flipped'));
    }, 2000); // Show for 2 seconds
}

function flipCard(card) {
    // Ignore if already flipped or matched
    if (card.classList.contains('flipped') || card.classList.contains('matched') || flippedCards.length >= 2) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    // Check for match
    if (flippedCards.length === 2) {
        const [card1, card2] = flippedCards;
        
        if (card1.dataset.id === card2.dataset.id) {
            // Match found
            score += 10;
            document.getElementById('score').textContent = score;
            matchedPairs++;
            
            // Mark as matched
            card1.classList.add('matched');
            card2.classList.add('matched');
            
            // Check win condition
            if (matchedPairs === words.length) {
                setTimeout(() => alert(`You won! Score: ${score}`), 500);
            }
        } else {
            // No match - flip back after delay
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
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
        <div id="scramble-container">
            <div id="scramble-word"></div>
            <input type="text" id="user-input" placeholder="Type the word...">
            <button onclick="checkAnswer()">Check</button>
            <p id="hint"></p>
            <p id="result"></p>
        </div>
    `;
    
    nextScrambleWord();
}

function nextScrambleWord() {
    currentWord = words[Math.floor(Math.random() * words.length)];
    currentScrambledWord = scrambleWord(currentWord.english);
    
    document.getElementById('scramble-word').textContent = currentScrambledWord;
    document.getElementById('hint').textContent = `Hint: ${currentWord.arabic}`;
    document.getElementById('user-input').value = "";
    document.getElementById('result').textContent = "";
    document.getElementById('user-input').focus();
}

function scrambleWord(word) {
    // Only scramble if word is longer than 3 letters
    if (word.length <= 3) return word;
    
    // Convert to array and shuffle
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

function checkAnswer() {
    const userInput = document.getElementById('user-input').value.toLowerCase().trim();
    const correctWord = currentWord.english.toLowerCase();
    
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