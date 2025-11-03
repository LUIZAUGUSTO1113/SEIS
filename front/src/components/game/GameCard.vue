<template>
    <div class="game-card" @click="handlePlayCard">
        <span class="card-rank">{{ rank }}</span>
        <component :is="suitIcon" class="card-suit" />
    </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore';
import { computed } from 'vue';

const gameStore = useGameStore();

const props = defineProps({
    rank: {
        type: String,
        required: true,
    },
    suit: {
        type: String,
        required: true,
    },
    suitIcon: {
        type: Object,
        required: true,
    },
    angle: {
        type: Number,
        default: 0,
    },
});

const cardAngle = computed(() => `${props.angle}deg`);
const translateY = computed(() => (props.angle === 0 ? '0' : '10px'));

const cardColor = computed(() => {
    return props.suit === 'HEARTS' || props.suit === 'DIAMONDS' ? '#d63621' : 'black';
});

const cursorType = computed(() => {
    return gameStore.isPlayersTurn === true ? 'pointer' : 'default';
});

const handlePlayCard = () => {
    if (gameStore.isPlayersTurn) {
        gameStore.playCard(props.rank, props.suit);
    }
};
</script>

<style>
.game-card {
    width: 100px;
    height: 150px;
    background: #e6e6e6;
    border: 1px solid #a0a0a0;
    border-radius: 8px;
    transition: transform 0.2s;
    transform: translateY(v-bind(translateY)) rotate(v-bind(cardAngle));
}

.game-card:hover {
    transform: translateY(-8px);
    cursor: v-bind(cursorType);
}

.card-rank {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.6rem;
    font-weight: bold;
    margin-left: 5px;
    color: v-bind(cardColor);
}

.card-suit {
    margin: 5px 10px 0 10px;
    display: block;
}
</style>
