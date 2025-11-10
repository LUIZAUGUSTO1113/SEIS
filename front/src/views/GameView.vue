<template>
    <div class="table">
        <div class="scoreboard-container">
            <div class="scoreboard">
                <div class="score">
                    <span class="text">Eu</span>
                    <span class="number">0</span>
                </div>
                <div class="rounds">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="score">
                    <span class="text">Eles</span>
                    <span class="number">0</span>
                </div>
            </div>
            <div class="stake">
                <span class="text">TENTO</span>
                <span class="number">{{ gameStore.stake }}</span>
            </div>
        </div>

        <div class="opponent-cards">
            <div
                v-for="(card, index) in opponentsCards"
                :style="{ transform: `translateX(${card.angle * 2}px)` }"
                :key="`${card.rank}-${card.suit}`"
            >
                <BackGameCard :angle="card.angle" />
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
    </div>

    <div class="truco-button">
        <button @click="handleCallTruco">Truco!</button>
    </div>
</template>

<script setup>
import { computed } from 'vue';

import { useGameStore } from '@/stores/gameStore';

import GameCard from '@/components/game/GameCard.vue';
import BackGameCard from '@/components/game/BackGameCard.vue';

const gameStore = useGameStore();

const rawCards = computed(() => gameStore.playerHand);

const cards = computed(() => {
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

const handleCallTruco = () => {};
</script>

<style scoped>
.table {
    display: table;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
}

.scoreboard-container {
    position: absolute;
    top: 20px;
    left: 20px;
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

.opponent-cards {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
}

.player-cards {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
}

.truco-button {
    position: absolute;
    bottom: 50px;
    left: 80%;
    transform: translateX(-50%);
}

.truco-button > button {
    margin-top: 40px;
    padding: 10px 20px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 3rem;
    font-weight: bold;

    background: #d63621;
    color: #291d18;
    cursor: pointer;
    border: solid 10px #291d18;
    border-radius: 10px;
    transition: background 0.3s;
}

.truco-button > button:hover {
    background: #a52716;
}
</style>
