import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { io } from 'socket.io-client';

export const useSocketStore = defineStore('socket', () => {
    const socket = ref(null);
    const connected = ref(false);
    const error = ref(null);
    const reconnectAttempts = ref(0);
    const maxReconnectAttempts = ref(5);

    const isConnected = computed(() => connected.value);
    const hasError = computed(() => error.value !== null);
    const connectionStatus = computed(() => {
        if (connected.value) return 'connected';
        if (error.value) return 'error';
        return 'disconnected';
    });

    const connect = (url = 'http://localhost:3000') => {
        if (socket.value) {
            disconnect();
        }

        try {
            socket.value = io(url, {
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: maxReconnectAttempts.value,
                timeout: 20000,
                transports: ['websocket', 'polling'],
            });

            setupEventListeners();
        } catch (err) {
            error.value = err.message;
            console.error('Socket initialization error:', err);
        }
    };

    const disconnect = () => {
        if (socket.value) {
            socket.value.disconnect();
            socket.value = null;
        }
        connected.value = false;
        error.value = null;
        reconnectAttempts.value = 0;
    };

    const setupEventListeners = () => {
        if (!socket.value) return;

        socket.value.on('connect', () => {
            connected.value = true;
            error.value = null;
            reconnectAttempts.value = 0;
            console.log('✅ Connected to server:', socket.value.id);
        });

        socket.value.on('disconnect', (reason) => {
            connected.value = false;
            console.log('❌ Disconnected from server. Reason:', reason);
        });

        socket.value.on('connect_error', (err) => {
            error.value = err.message;
            connected.value = false;
            reconnectAttempts.value++;
            console.error('🔌 Connection error:', err.message);

            if (reconnectAttempts.value >= maxReconnectAttempts.value) {
                console.error('Max reconnection attempts reached');
            }
        });

        socket.value.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected after', attemptNumber, 'attempts');
            reconnectAttempts.value = 0;
        });

        socket.value.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 Reconnection attempt:', attemptNumber);
        });

        socket.value.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect after maximum attempts');
            error.value = 'Failed to reconnect to server';
        });
    };

    const emit = (event, data) => {
        if (socket.value && connected.value) {
            socket.value.emit(event, data);
            return true;
        } else {
            console.warn('⚠️ Socket not connected. Cannot emit event:', event);
            return false;
        }
    };

    const on = (event, callback) => {
        if (socket.value) {
            socket.value.on(event, callback);
            return true;
        }
        return false;
    };

    const off = (event, callback) => {
        if (socket.value) {
            if (callback) {
                socket.value.off(event, callback);
            } else {
                socket.value.removeAllListeners(event);
            }
            return true;
        }
        return false;
    };

    const once = (event, callback) => {
        if (socket.value) {
            socket.value.once(event, callback);
            return true;
        }
        return false;
    };

    return {
        socket,
        connected,
        error,
        reconnectAttempts,

        isConnected,
        hasError,
        connectionStatus,

        connect,
        disconnect,
        emit,
        on,
        off,
        once,
    };
});
