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
let revealedCards = [];
let matchedPairs = 0;
let currentScrambledWord = null;

// Memory Game
function startMemoryGame() {
    score = 0;
    matchedPairs = 0;
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = `
        <h2>Memory Game</h2>
        <p class="stats">Matches: <span id="matches">0</span>/<span id="total-pairs">${words.length}</span></p>
        <div class="memory-board" id="memory-board"></div>
    `;
    
    // Create card pairs
    const cardPairs = [];
    words.forEach(word => {
        cardPairs.push({ text: word.english, pairId: word.english, lang: 'english' });
        cardPairs.push({ text: word.arabic, pairId: word.english, lang: 'arabic' });
    });

    // Shuffle and display cards
    const shuffledCards = shuffleArray(cardPairs);
    const board = document.getElementById('memory-board');
    
    shuffledCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.pairId = card.pairId;
        cardElement.dataset.index = index;
        cardElement.textContent = ''; // Start blank
        cardElement.onclick = () => revealCard(cardElement, card.text);
        board.appendChild(cardElement);
    });
}

function revealCard(card, text) {
    // Ignore if already revealed or matched
    if (card.classList.contains('revealed') || card.classList.contains('matched') || revealedCards.length >= 2) {
        return;
    }
    
    // Show the word
    card.textContent = text;
    card.classList.add('revealed');
    revealedCards.push(card);
    
    // Check for match
    if (revealedCards.length === 2) {
        const [card1, card2] = revealedCards;
        
        if (card1.dataset.pairId === card2.dataset.pairId) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            document.getElementById('matches').textContent = matchedPairs;
            
            // Check win condition
            if (matchedPairs === words.length) {
                setTimeout(() => alert(`You won!`), 500);
            }
        } else {
            // No match - hide after delay
            setTimeout(() => {
                card1.textContent = '';
                card2.textContent = '';
                card1.classList.remove('revealed');
                card2.classList.remove('revealed');
            }, 1000);
        }
        
        revealedCards = [];
    }
}

// Scramble Game
function startScrambleGame() {
    score = 0;
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = `
        <h2>Scramble Game</h2>
        <p class="stats">Score: <span id="score">0</span></p>
        <div class="scramble-container">
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
    ).english.toLowerCase();
    
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

// Helper function
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}