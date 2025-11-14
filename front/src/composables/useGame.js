import { onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useSocketStore } from '@/stores/socketStore';
import { useAudio } from './useAudio';

export function useGame() {
    const gameStore = useGameStore();
    const socketStore = useSocketStore();
    const { seisScreamSound, noveScreamSound, dozeScreamSound, jogueScreamSound } = useAudio();

    onMounted(() => {
        socketStore.setGameStore(gameStore);
        if (!socketStore.isConnected) {
            socketStore.connect();
        }
    });

    onUnmounted(() => {
        socketStore.setGameStore(null);
    });

    const startGame = () => {
        if (socketStore.isConnected) {
            gameStore.resetGame();
            socketStore.findGame();
        }
    };

    const playCard = (card) => {
        return gameStore.playCard(card);
    };

    const callTruco = () => {
        return gameStore.callTruco();
    };

    const respondToTruco = (response) => {
        console.log(response);
        const challenge = gameStore.pendingChallenge;
        console.log(challenge);
        if (response === 'RAISE') {
            switch (challenge.levelIndex) {
                case 0:
                    console.log('PASSSOU AQUI');
                    seisScreamSound.play();
                    break;
                case 1:
                    console.log('PASSSOU AQUI DENOVO');
                    noveScreamSound.play();
                    break;
                case 2:
                    console.log('PASSSOU AQUI TRES VEZES');
                    dozeScreamSound.play();
                    break;
            }
        }

        if (response === 'ACCEPT') jogueScreamSound.play();

        return gameStore.respondTruco(response);
    };

    return {
        gameStore,
        socketStore,
        startGame,
        playCard,
        callTruco,
        respondToTruco,
    };
}
