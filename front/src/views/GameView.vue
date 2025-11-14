<template>
    <div class="table">
        <div v-if="gameStore.gameState === 'searching'" class="game-status">
            <h2>Procurando partida...</h2>
            <button @click="startGame" :disabled="!socketStore.isConnected">
                {{ socketStore.isConnected ? 'Procurar Jogo' : 'Conectando...' }}
            </button>
        </div>

        <div v-else-if="gameStore.gameState === 'waiting'" class="game-status">
            <h2>Aguardando oponente...</h2>
        </div>

        <div v-else-if="gameStore.gameState === 'disconnected'" class="game-status">
            <h2>{{ gameStore.gameMessage }}</h2>
            <button @click="startGame">Procurar Nova Partida</button>
        </div>

        <div v-else-if="gameStore.gameState === 'ended'" class="game-status">
            <h2>{{ gameStore.gameMessage }}</h2>
            <p class="final-score">Placar Final: {{ getFinalScore() }}</p>
            <button @click="startGame">Jogar Novamente</button>
        </div>

        <template v-else-if="gameStore.gameState === 'playing'">
            <div class="scoreboard-container">
                <div class="scoreboard-row">
                    <div class="scoreboard">
                        <div class="score">
                            <span class="text">Eu</span>
                            <span class="number">{{ gameStore.myScore }}</span>
                        </div>
                        <div class="rounds">
                            <div
                                v-for="(winner, index) in 3"
                                :key="index"
                                :class="{
                                    won: gameStore.roundWinners[index] === gameStore.myId,
                                    lost:
                                        gameStore.roundWinners[index] &&
                                        gameStore.roundWinners[index] !== gameStore.myId &&
                                        gameStore.roundWinners[index] !== 'tie',
                                    tie: gameStore.roundWinners[index] === 'tie',
                                }"
                            ></div>
                        </div>
                        <div class="score">
                            <span class="text">Eles</span>
                            <span class="number">{{ gameStore.opponentScore }}</span>
                        </div>
                    </div>
                    <div class="stake">
                        <span class="text">{{ getStakeText() }}</span>
                        <span class="number">{{ gameStore.handValue }}</span>
                    </div>
                    <div v-if="gameStore.specialHand" class="special-hand">
                        {{ gameStore.specialHand }}
                    </div>
                </div>
                <div class="turn-indicator" v-if="gameStore.isPlayersTurn">
                    <span>SUA VEZ</span>
                </div>
            </div>

            <div v-if="gameStore.vira" class="vira-container">
                <GameCard
                    :rank="gameStore.vira.rank"
                    :suit="gameStore.vira.suit"
                    :suitIcon="getSuitIcon(gameStore.vira.suit)"
                    :angle="0"
                    class="vira-card"
                />
                <div style="position: absolute; transform: translate(120px, -60px)">
                    <BackGameCard style="position: absolute; z-index: 2" />
                    <BackGameCard
                        style="position: absolute; transform: translate(3px, 5px); z-index: 1"
                    />
                    <BackGameCard style="position: absolute; transform: translate(6px, 10px)" />
                </div>
            </div>

            <div class="opponent-cards">
                <div
                    v-for="(card, index) in opponentsCards"
                    :style="{ transform: `translateX(${card.angle * 2}px)` }"
                    :key="`opponent-${index}`"
                >
                    <BackGameCard :angle="card.angle" />
                </div>
            </div>

            <div class="table-cards" v-if="gameStore.tableCards.length > 0">
                <div
                    v-for="tableCard in gameStore.tableCards"
                    :key="`table-${tableCard.playerId}`"
                    :class="{
                        'my-card': tableCard.playerId === gameStore.myId,
                        'opponent-card': tableCard.playerId !== gameStore.myId,
                    }"
                    class="table-card"
                >
                    <GameCard
                        :rank="tableCard.card.rank"
                        :suit="tableCard.card.suit"
                        :suitIcon="getSuitIcon(tableCard.card.suit)"
                        :angle="0"
                    />
                </div>
            </div>

            <div class="player-cards">
                <div
                    v-for="(card, index) in cards"
                    :style="{ transform: `translateX(${-(card.angle * 2)}px)` }"
                    :key="`${card.rank}-${card.suit}`"
                >
                    <GameCard
                        :rank="card.rank"
                        :suit="card.suit"
                        :suitIcon="card.suitIcon"
                        :angle="card.angle"
                    />
                </div>
            </div>

            <div class="game-controls">
                <button
                    @click="handleCallTruco"
                    class="truco-button"
                    :disabled="!gameStore.canCallTruco"
                    v-if="!gameStore.pendingChallenge"
                >
                    Truco!
                </button>

                <div v-if="gameStore.pendingChallenge" class="truco-response">
                    <h3 v-if="gameStore.pendingChallenge.to === gameStore.myId">
                        {{ getTrucoText() }}
                    </h3>
                    <h3 v-else>Aguardando resposta do {{ getTrucoText() }}...</h3>

                    <div
                        v-if="gameStore.pendingChallenge.to === gameStore.myId"
                        class="truco-buttons"
                    >
                        <button @click="respondToTruco('RUN')" class="run-button">Corro</button>
                        <button @click="respondToTruco('ACCEPT')" class="accept-button">
                            Aceito
                        </button>
                        <button
                            @click="respondToTruco('RAISE')"
                            class="raise-button"
                            v-if="canRaise()"
                        >
                            {{ getRaiseText() }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="gameStore.gameMessage" class="game-message">
                {{ gameStore.gameMessage }}
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useGame } from '@/composables/useGame';
import { useAudio } from '@/composables/useAudio';

import GameCard from '@/components/game/GameCard.vue';
import BackGameCard from '@/components/game/BackGameCard.vue';

import ClubsIcon from '@/components/cards-suits/ClubsIcon.vue';
import DiamondsIcon from '@/components/cards-suits/DiamondsIcon.vue';
import HeartsIcon from '@/components/cards-suits/HeartsIcon.vue';
import SpadesIcon from '@/components/cards-suits/SpadesIcon.vue';

const { gameStore, socketStore, startGame, callTruco, respondToTruco } = useGame();
const { trucoScreamSound } = useAudio();
console.log(gameStore.gameState);
watch(
    () => gameStore.gameState,
    (newState) => {
        console.log('Game state changed to:', newState);
        console.log('Myscore:', gameStore.myScore);
        console.log('Opponent score:', gameStore.opponentScore);
    },
);

watch(
    () => gameStore.myScore,
    (newState) => {
        console.log('Game state changed to:', newState);
        console.log('Myscore:', gameStore.myScore);
        console.log('Opponent score:', gameStore.opponentScore);
    },
);
const SUIT_ICONS = {
    Hearts: HeartsIcon,
    Diamonds: DiamondsIcon,
    Clubs: ClubsIcon,
    Spades: SpadesIcon,
};

const TRUCO_LEVELS = [
    { value: 3, raiseText: 'SEIS' },
    { value: 6, raiseText: 'NOVE' },
    { value: 9, raiseText: 'DOZE' },
    { value: 12, raiseText: 'DOZE (Max)' },
];

const rawCards = computed(() => gameStore.playerHand);

const cards = computed(() => {
    console.log(rawCards.value);
    const transformedCards = rawCards.value.map((card, index) => {
        const cardCount = rawCards.value.length;
        const angleSpread = cardCount === 2 ? 15 : 20;
        const halfSpread = angleSpread / 2;

        if (cardCount === 1) {
            return {
                ...card,
                angle: 0,
            };
        }

        return {
            ...card,
            angle: -halfSpread + (index * angleSpread) / (cardCount - 1),
        };
    });
    return transformedCards;
});

const opponentsCards = computed(() => {
    const transformedCards = gameStore.opponentHand.map((card, index) => {
        const cardCount = gameStore.opponentHand.length;
        const angleSpread = cardCount === 2 ? 15 : 20;
        const halfSpread = angleSpread / 2;

        if (cardCount === 1) {
            return {
                ...card,
                angle: 0,
            };
        }

        return {
            ...card,
            angle: halfSpread - (index * angleSpread) / (cardCount - 1),
        };
    });
    return transformedCards;
});

const getSuitIcon = (suit) => {
    return SUIT_ICONS[suit];
};

const getStakeText = () => {
    if (gameStore.specialHand === 'FERRO') return 'FERRO';
    if (gameStore.specialHand === 'ONZE') return 'MÃO DE 11';
    return 'TENTO';
};

const getTrucoText = () => {
    const challenge = gameStore.pendingChallenge;
    if (!challenge) return '';

    if (challenge.value === 3) return 'TRUCO!';
    if (challenge.value === 6) return 'SEIS!';
    if (challenge.value === 9) return 'NOVE!';
    if (challenge.value === 12) return 'DOZE!';
    return 'TRUCO!';
};

const canRaise = () => {
    const challenge = gameStore.pendingChallenge;
    if (!challenge) return false;
    return challenge.value < 12;
};

const getRaiseText = () => {
    const challenge = gameStore.pendingChallenge;
    if (!challenge) return '';
    return challenge.raiseText;
};

const handleCallTruco = () => {
    trucoScreamSound.play();
    callTruco();
};

const getFinalScore = () => {
    const iWon = gameStore.gameMessage === 'Você ganhou!';

    if (iWon) {
        return `12 x ${gameStore.opponentScore}`;
    } else {
        return `${gameStore.myScore} x 12`;
    }
};
</script>

<style scoped>
.table {
    display: table;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    position: relative;
}

.game-status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 40px;
    border-radius: 10px;
    color: white;
}

.game-status h2 {
    margin-bottom: 20px;
    font-family: 'Courier New', Courier, monospace;
}

.game-status button {
    padding: 15px 30px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.2rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
}

.game-status button:disabled {
    background: #666;
    cursor: not-allowed;
}

.final-score {
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
}

.scoreboard-container {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
}

.scoreboard-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.scoreboard {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 15px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 30px;
}

.score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.score .text {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
}

.score .number {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.6rem;
    font-weight: bold;
    color: white;
}

.rounds {
    display: flex;
    gap: 8px;
}

.rounds div {
    width: 25px;
    height: 25px;
    border: 2px solid white;
    border-radius: 50%;
    background-color: transparent;
}

.rounds div.won {
    background-color: #4caf50;
}

.rounds div.lost {
    background-color: #f44336;
}

.rounds div.tie {
    background-color: #ff9800;
}

.stake {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 15px 20px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.stake .text {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
}

.stake .number {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.6rem;
    font-weight: bold;
    color: white;
}

.special-hand {
    background-color: rgba(255, 215, 0, 0.8);
    padding: 10px;
    border-radius: 5px;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    color: black;
    text-align: center;
}

.vira-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    z-index: 5;
}

.vira-label {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
    margin-bottom: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 5px 15px;
    border-radius: 15px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.vira-card {
    transform: scale(0.8);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.turn-indicator {
    width: fit-content;
    background-color: rgba(76, 175, 80, 0.9);
    padding: 10px 20px;
    border-radius: 20px;
    color: white;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

.opponent-cards {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
}

.table-cards {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    gap: 20px;
    z-index: 10;
}

.table-card {
    transform: scale(0.8);
    position: absolute;
}

.table-card.my-card {
    transform: scale(0.8) translate(-65px, 80px);
}

.table-card.opponent-card {
    transform: scale(0.8) translate(-65px, -270px);
}

.player-cards {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
}

.game-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
}

.truco-button {
    padding: 15px 30px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 2rem;
    font-weight: bold;
    background: #d63621;
    color: #291d18;
    cursor: pointer;
    border: solid 5px #291d18;
    border-radius: 10px;
    transition: background 0.3s;
}

.truco-button:hover:not(:disabled) {
    background: #a52716;
}

.truco-button:disabled {
    background: #666;
    cursor: not-allowed;
    opacity: 0.6;
}

.truco-response {
    background-color: rgba(0, 0, 0, 0.9);
    padding: 20px;
    border-radius: 10px;
    color: white;
    text-align: center;
    min-width: 300px;
}

.truco-response h3 {
    font-family: 'Courier New', Courier, monospace;
    margin-bottom: 15px;
    color: #d63621;
}

.truco-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
}

.truco-buttons button {
    padding: 10px 15px;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
}

.run-button {
    background: #f44336;
    color: white;
}

.run-button:hover {
    background: #d32f2f;
}

.accept-button {
    background: #4caf50;
    color: white;
}

.accept-button:hover {
    background: #45a049;
}

.raise-button {
    background: #ff9800;
    color: white;
}

.raise-button:hover {
    background: #f57c00;
}

.game-message {
    position: absolute;
    top: 180px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(255, 193, 7, 0.9);
    padding: 10px 20px;
    border-radius: 5px;
    color: black;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}
</style>
