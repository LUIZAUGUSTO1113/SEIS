import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useSound } from '@vueuse/sound';
import ambientSfx from '@/assets/sounds/bar-background.mp3';
import hoverCardSfx from '@/assets/sounds/hover-card.mp3';
import playCardSfx from '@/assets/sounds/play-card.mp3';
import trucoScream from '@/assets/sounds/truco-sfx.mp3';
import seisScream from '@/assets/sounds/seis-sfx.mp3';
import noveScream from '@/assets/sounds/nove-sfx.mp3';
import dozeScream from '@/assets/sounds/doze-sfx.mp3';
import jogueScream from '@/assets/sounds/jogue-sfx.mp3';

export function useAudio() {
    const ambientSound = useSound(ambientSfx, { volume: 0.2, playbackRate: 1 });

    const hoverSound = useSound(hoverCardSfx, { volume: 0.5, playbackRate: 3 });
    const playCardSound = useSound(playCardSfx, { volume: 0.7, playbackRate: 1.5 });

    const trucoScreamSound = useSound(trucoScream, { volume: 1, playbackRate: 1 });
    const seisScreamSound = useSound(seisScream, { volume: 1, playbackRate: 1 });
    const noveScreamSound = useSound(noveScream, { volume: 1, playbackRate: 1 });
    const dozeScreamSound = useSound(dozeScream, { volume: 1, playbackRate: 1 });
    const jogueScreamSound = useSound(jogueScream, { volume: 1, playbackRate: 1 });

    return {
        ambientSound,
        hoverSound,
        playCardSound,
        trucoScreamSound,
        seisScreamSound,
        noveScreamSound,
        dozeScreamSound,
        jogueScreamSound,
    };
}
