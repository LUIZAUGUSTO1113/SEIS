<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';
import { useSocketStore } from './stores/socketStore.js';

const socketStore = useSocketStore();

onMounted(() => {
    socketStore.connect('http://localhost:3000');
});

onUnmounted(() => {
    socketStore.disconnect();
});
</script>

<template>
    <RouterView />
</template>

<style scoped></style>
