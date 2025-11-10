import { ref, computed, shallowRef } from 'vue';
import { defineStore } from 'pinia';

import ClubsIcon from '@/components/cards-suits/ClubsIcon.vue';
import DiamondsIcon from '@/components/cards-suits/DiamondsIcon.vue';
import HeartsIcon from '@/components/cards-suits/HeartsIcon.vue';
import SpadesIcon from '@/components/cards-suits/SpadesIcon.vue';

export const useGameStore = defineStore('game', () => {
    const playerHand = shallowRef([
        { rank: 'K', suit: 'CLUBS', suitIcon: ClubsIcon },
        { rank: 'Q', suit: 'HEARTS', suitIcon: HeartsIcon },
        { rank: '7', suit: 'SPADES', suitIcon: SpadesIcon },
    ]);
    const tableCards = ref();
    const stake = ref(1);

    const opponentHand = ref([{}, {}, {}]);

    function drawCard() {
        // Logic to draw a card
    }

    const isPlayersTurn = computed(() => {
        return true;
    });

    function playCard(rank, suit) {
        if (!isPlayersTurn.value) return;

        const filteredHand = playerHand.value.filter(
            (card) => !(card.rank === rank && card.suit === suit),
        );
        playerHand.value = filteredHand;
    }

    return { playerHand, stake, opponentHand, tableCards, drawCard, playCard, isPlayersTurn };
});
