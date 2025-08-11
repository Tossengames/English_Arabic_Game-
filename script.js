// English-Arabic word pairs
const wordPairs = [
    { english: "cat", arabic: "قطة" },
    { english: "dog", arabic: "كلب" },
    { english: "sun", arabic: "شمس" },
    { english: "moon", arabic: "قمر" },
    { english: "book", arabic: "كتاب" },
    { english: "house", arabic: "منزل" },
    { english: "water", arabic: "ماء" },
    { english: "apple", arabic: "تفاحة" }
];

// Game state
let flippedCards = [];
let matchedPairs = 0;
let attempts = 0;
let canFlip = true;

// Initialize game
function initGame() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    attempts = 0;
    canFlip = true;
    
    document.getElementById('matches').textContent = '0';
    document.getElementById('attempts').textContent = '0';
    document.getElementById('total-pairs').textContent = wordPairs.length;

    // Create card deck
    const cards = [];
    wordPairs.forEach(pair => {
        cards.push({ text: pair.english, pairId: pair.english, lang: 'english' });
        cards.push({ text: pair.arabic, pairId: pair.english, lang: 'arabic' });
    });

    // Shuffle cards
    shuffleArray(cards);

    // Create card elements
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.pairId = card.pairId;
        cardElement.dataset.lang = card.lang;
        
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.textContent = card.text;
        if (card.lang === 'arabic') {
            cardFront.style.direction = 'rtl';
        }
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.textContent = '?';
        
        cardInner.appendChild(cardBack);
        cardInner.appendChild(cardFront);
        cardElement.appendChild(cardInner);
        
        cardElement.addEventListener('click', flipCard);
        gameBoard.appendChild(cardElement);
    });
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Flip card
function flipCard() {
    if (!canFlip || this.classList.contains('flipped') || this.classList.contains('matched')) return;
    
    this.classList.add('flipped');
    flippedCards.push(this);
    
    if (flippedCards.length === 2) {
        canFlip = false;
        attempts++;
        document.getElementById('attempts').textContent = attempts;
        
        checkForMatch();
    }
}

// Check if flipped cards match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.pairId === card2.dataset.pairId) {
        // Match found
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        document.getElementById('matches').textContent = matchedPairs;
        
        if (matchedPairs === wordPairs.length) {
            setTimeout(() => alert(`Congratulations! You won in ${attempts} attempts!`), 500);
        }
        
        flippedCards = [];
        canFlip = true;
    } else {
        // No match
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            canFlip = true;
        }, 1000);
    }
}

// Reset game
document.getElementById('reset-btn').addEventListener('click', initGame);

// Start game
initGame();