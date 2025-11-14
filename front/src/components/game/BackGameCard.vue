<template>
    <div class="back-game-card">
        <img src="@/assets/image.jpg" alt="Card Back" />
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    angle: {
        type: Number,
        default: 0,
    },
})

const cardAngle = computed(() => `${props.angle}deg`)
const translateY = computed(() => (props.angle === 0 ? '0' : '-10px'))
</script>

<style scoped>
.back-game-card {
    width: 66px;
    height: 100px;
    background: #e6e6e6;
    border: 1px solid #a0a0a0;
    border-radius: 8px;
    padding: 5px;
    transform: translateY(v-bind(translateY)) rotate(v-bind(cardAngle));
}

.back-game-card img {
    width: 100%;
    height: 100%;
    border-radius: 8px;
}
</style>
