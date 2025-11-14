<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { onMounted, onUnmounted, ref } from 'vue';
import { useSocketStore } from './stores/socketStore.js';
import { useAudio } from './composables/useAudio.js';
import aindaOntemChoreiDeSaudade from '@/assets/songs/ainda-ontem-chorei-de-saudade.mp3';

const socketStore = useSocketStore();
const { ambientSound } = useAudio();
const hasPlayedAmbient = ref(false);

const handleFirstClick = () => {
    if (!hasPlayedAmbient.value) {
        // ambientSound.play();
        const ambientSound = useSound(aindaOntemChoreiDeSaudade, {
            volume: 1,
            playbackRate: 1,
            loop: true,
        });
        ambientSound.play();
        hasPlayedAmbient.value = true;
        document.removeEventListener('click', handleFirstClick);
    }
};

onMounted(() => {
    socketStore.connect('http://localhost:3000');
    document.addEventListener('click', handleFirstClick);
});

onUnmounted(() => {
    socketStore.disconnect();
    document.removeEventListener('click', handleFirstClick);
});
</script>

<template>
    <RouterView />
</template>

<style scoped></style>
