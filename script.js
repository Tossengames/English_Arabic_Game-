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

    // Create card deck
    const cards = [];
    wordPairs.forEach(pair => {
        cards.push({ text: pair.english, pairId: pair.english, lang: 'en' });
        cards.push({ text: pair.arabic, pairId: pair.english, lang: 'ar' });
    });

    // Shuffle cards
    shuffleArray(cards);

    // Create card elements
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.pairId = card.pairId;
        
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-face card-front';
        cardFront.textContent = card.text;
        cardFront.setAttribute('lang', card.lang);
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back';
        cardBack.textContent = '?';
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardElement.appendChild(cardInner);
        
        cardElement.addEventListener('click', flipCard);
        gameBoard.appendChild(cardElement);
    });

    // Show cards briefly at start
    showAllCards();
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Show all cards briefly
function showAllCards() {
    canFlip = false;
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.add('flipped'));
    
    setTimeout(() => {
        cards.forEach(card => card.classList.remove('flipped'));
        canFlip = true;
    }, 2000); // 2 second preview
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
            setTimeout(() => alert(`🎉 Congratulations! You won in ${attempts} attempts!`), 500);
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

// Start game when page loads
window.addEventListener('DOMContentLoaded', initGame);