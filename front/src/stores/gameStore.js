import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useSocketStore } from './socketStore';

import ClubsIcon from '@/components/cards-suits/ClubsIcon.vue';
import DiamondsIcon from '@/components/cards-suits/DiamondsIcon.vue';
import HeartsIcon from '@/components/cards-suits/HeartsIcon.vue';
import SpadesIcon from '@/components/cards-suits/SpadesIcon.vue';

const SUIT_ICONS = {
    Hearts: HeartsIcon,
    Diamonds: DiamondsIcon,
    Clubs: ClubsIcon,
    Spades: SpadesIcon,
};

export const useGameStore = defineStore('game', () => {
    const gameState = ref('searching');
    const roomId = ref(null);
    const myId = ref(null);
    const opponentId = ref(null);

    const playerHand = ref([]);
    const opponentHand = ref([{}, {}, {}]);
    const tableCards = ref([]);

    const myScore = ref(0);
    const opponentScore = ref(0);
    const handValue = ref(1);
    const specialHand = ref(null);

    const vira = ref(null);
    const currentTurn = ref(null);
    const currentHand = ref(1);
    const roundWinners = ref([]);

    const pendingChallenge = ref(null);
    const gameMessage = ref('');

    const isPlayersTurn = computed(() => currentTurn.value === myId.value);
    const isGameActive = computed(() => gameState.value === 'playing');
    const stake = computed(() => handValue.value);
    const canCallTruco = computed(() => {
        return (
            isGameActive.value &&
            !pendingChallenge.value &&
            myScore.value !== 11 &&
            opponentScore.value !== 11
        );
    });

    function addSuitIcon(card) {
        return {
            ...card,
            suitIcon: SUIT_ICONS[card.suit],
        };
    }

    function initializeGame(data) {
        gameState.value = 'playing';
        roomId.value = data.roomId;
        myId.value = data.myId;
        opponentId.value = data.opponentId;
        playerHand.value = data.hand.map(addSuitIcon);
        vira.value = data.vira;
        currentTurn.value = data.turn;
        myScore.value = data.score[0];
        opponentScore.value = data.score[1];
        handValue.value = data.handValue;
        currentHand.value = 1;
        roundWinners.value = [];
        tableCards.value = [];
        pendingChallenge.value = null;
    }

    function updateHandAfterEnd(data) {
        myScore.value = data.myScore;
        opponentScore.value = data.opponentScore;
        handValue.value = data.handValue;
        specialHand.value = data.specialHand;

        const myData = data[myId.value];
        if (myData) {
            if (myData.newHand) {
                playerHand.value = myData.newHand.map(addSuitIcon);
                opponentHand.value = [{}, {}, {}];
            }
            vira.value = myData.newVira;
            currentTurn.value = myData.newTurn;
        }

        currentHand.value = 1;
        roundWinners.value = [];
        tableCards.value = [];
        pendingChallenge.value = null;
    }

    function playCard(card) {
        if (!isPlayersTurn.value || !isGameActive.value) return false;

        const socketStore = useSocketStore();
        return socketStore.emit('PLAY_CARD', {
            roomId: roomId.value,
            card: card,
        });
    }

    function updateCardPlayed(data) {
        console.log('updateCardPlayed called with:', data);
        console.log('Current playerHand:', playerHand.value);
        console.log('My ID:', myId.value);

        if (data.playerId === myId.value) {
            console.log('Removing card from my hand');
            playerHand.value = [
                ...playerHand.value.filter(
                    (c) => !(c.rank === data.card.rank && c.suit === data.card.suit),
                ),
            ];
            console.log('Updated playerHand:', playerHand.value);
        } else {
            console.log('Removing card from opponent hand');
            if (opponentHand.value.length > 0) {
                opponentHand.value = opponentHand.value.slice(0, -1);
            }
        }

        tableCards.value.push({
            playerId: data.playerId,
            card: data.card,
        });

        currentTurn.value = data.nextTurn;
    }

    function updateRoundEnd(data) {
        roundWinners.value.push(data.roundWinnerId);
        currentTurn.value = data.nextTurn;
        tableCards.value = [];
        currentHand.value++;
    }

    function callTruco() {
        if (!canCallTruco.value) return false;

        const socketStore = useSocketStore();
        return socketStore.emit('REQUEST_TRUCO');
    }

    function respondTruco(response) {
        if (!pendingChallenge.value) return false;

        const socketStore = useSocketStore();
        return socketStore.emit('RESPOND_TRUCO', { response });
    }

    function handleTrucoChallenge(data) {
        pendingChallenge.value = data;
    }

    function handleChallengeAccepted(data) {
        handValue.value = data.value;
        pendingChallenge.value = null;
    }

    function endGame(data) {
        gameState.value = 'ended';
        gameMessage.value = data.winnerId === myId.value ? 'Você ganhou!' : 'Você perdeu!';
    }

    function resetGame() {
        gameState.value = 'searching';
        roomId.value = null;
        myId.value = null;
        opponentId.value = null;
        playerHand.value = [];
        opponentHand.value = [{}, {}, {}];
        tableCards.value = [];
        myScore.value = 0;
        opponentScore.value = 0;
        handValue.value = 1;
        specialHand.value = null;
        vira.value = null;
        currentTurn.value = null;
        currentHand.value = 1;
        roundWinners.value = [];
        pendingChallenge.value = null;
        gameMessage.value = '';
    }

    function setWaitingState() {
        gameState.value = 'waiting';
    }

    function setOpponentDisconnected() {
        gameState.value = 'disconnected';
        gameMessage.value = 'Oponente desconectou';
    }

    function setInvalidMove(data) {
        gameMessage.value = data.message;
        setTimeout(() => {
            gameMessage.value = '';
        }, 3000);
    }

    return {
        gameState,
        roomId,
        myId,
        opponentId,
        playerHand,
        opponentHand,
        tableCards,
        myScore,
        opponentScore,
        handValue,
        specialHand,
        vira,
        currentTurn,
        currentHand,
        roundWinners,
        pendingChallenge,
        gameMessage,
        isPlayersTurn,
        isGameActive,
        stake,
        canCallTruco,
        initializeGame,
        updateHandAfterEnd,
        playCard,
        updateCardPlayed,
        updateRoundEnd,
        callTruco,
        respondTruco,
        handleTrucoChallenge,
        handleChallengeAccepted,
        endGame,
        resetGame,
        setWaitingState,
        setOpponentDisconnected,
        setInvalidMove,
    };
});
