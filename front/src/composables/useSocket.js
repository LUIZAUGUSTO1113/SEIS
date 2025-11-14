import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useSocket(url = 'http://localhost:3000') {
    const socket = ref(null);
    const connected = ref(false);
    const error = ref(null);

    const connect = () => {
        try {
            socket.value = io(url, {
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 20000,
            });

            socket.value.on('connect', () => {
                connected.value = true;
                error.value = null;
                console.log('Connected to server:', socket.value.id);
            });

            socket.value.on('disconnect', () => {
                connected.value = false;
                console.log('Disconnected from server');
            });

            socket.value.on('connect_error', (err) => {
                error.value = err.message;
                connected.value = false;
                console.error('Connection error:', err);
            });
        } catch (err) {
            error.value = err.message;
            console.error('Socket initialization error:', err);
        }
    };

    const disconnect = () => {
        if (socket.value) {
            socket.value.disconnect();
            socket.value = null;
            connected.value = false;
        }
    };

    const emit = (event, data) => {
        if (socket.value && connected.value) {
            socket.value.emit(event, data);
        } else {
            console.warn('Socket not connected. Cannot emit event:', event);
        }
    };

    const on = (event, callback) => {
        if (socket.value) {
            socket.value.on(event, callback);
        }
    };

    const off = (event, callback) => {
        if (socket.value) {
            socket.value.off(event, callback);
        }
    };

    onMounted(() => {
        connect();
    });

    onUnmounted(() => {
        disconnect();
    });

    return {
        socket: socket.value,
        connected,
        error,
        connect,
        disconnect,
        emit,
        on,
        off,
    };
}
