<template>
    <div class="home">
        <img src="@/assets/seis-logo.png" alt="" />
        <button @click="goToGame">Start Game</button>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToGame = () => {
    router.push('/game');
};
</script>

<style scoped>
.home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: white;
}

button {
    margin-top: 40px;
    padding: 10px 20px;
    font-size: 50px;
    background: #d63621;
    color: #291d18;
    cursor: pointer;
    border: solid 10px #291d18;
    border-radius: 10px;
    transition: background 0.3s;
}

button:hover {
    background: #a52716;
}
</style>
