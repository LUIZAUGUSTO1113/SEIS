import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useSound } from '@vueuse/sound';
import ambientSfx from '@/assets/sounds/bar-background.mp3';
import hoverCardSfx from '@/assets/sounds/hover-card.mp3';
import playCardSfx from '@/assets/sounds/play-card.mp3';

export function useAudio() {
    const ambientSound = useSound(ambientSfx, { volume: 0.0, playbackRate: 1 });

    const hoverSound = useSound(hoverCardSfx, { volume: 0.5, playbackRate: 3 });
    const playCardSound = useSound(playCardSfx, { volume: 0.7, playbackRate: 1.5 });

    return {
        ambientSound,
        hoverSound,
        playCardSound,
    };
}
