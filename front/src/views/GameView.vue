<template>
    <div class="table">
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
</template>

<script setup>
import GameCard from '@/components/game/GameCard.vue';
import { computed, ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';
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
</script>

<style scoped>
.table {
    display: table;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
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
</style>
