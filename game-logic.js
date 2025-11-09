const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', 'Q', 'J', 'K'];
const RANK_ORDER_FOR_MANILHA = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

const RANKS_STRENGTH = {
  '3': 10,
  '2': 9,
  'A': 8,
  'K': 7,
  'J': 6,
  'Q': 5,
  '7': 4,
  '6': 3,
  '5': 2,
  '4': 1
};

const SUITS_STRENGTH = {
  'Clubs': 4,
  'Hearts': 3,
  'Spades': 2,
  'Diamonds': 1
};

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ rank, suit});
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    const shuffledDeck = [...deck];

    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
}

function startNewHand() {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);

    const hand1 = shuffledDeck.slice(0, 3);
    const hand2 = shuffledDeck.slice(3, 6);
    const vira = shuffledDeck[6];

    const viraIndex = RANK_ORDER_FOR_MANILHA.indexOf(vira.rank);
    const manilhaRank = RANK_ORDER_FOR_MANILHA[(viraIndex + 1) % RANK_ORDER_FOR_MANILHA.length];

    return {
        hand1: hand1,
        hand2: hand2,
        vira: vira,
        manilhaRank: manilhaRank
    };
}

function getCardStrength(card, manilhaRank) {
    if (card.rank === manilhaRank) {
        return 100 + SUITS_STRENGTH[card.suit];
    }
    return RANKS_STRENGTH[card.rank];
}

module.exports = {
    startNewHand,
    getCardStrength
};