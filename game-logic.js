const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', 'Q', 'J', 'K'];
const RANK_ORDER_FOR_MANILHA = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

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
    const shuffleDeck = [...deck];

    for (let i = shuffleDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffleDeck[i], shuffleDeck[j]] = [shuffleDeck[j], shuffleDeck[i]];
    }
    return shuffleDeck;
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

module.exports = {
    startNewHand
};