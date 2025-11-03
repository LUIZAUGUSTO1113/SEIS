const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const PORT = 3000;

const gameRooms = new Map();
let waitingPlayer = null;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`)
    socket.on('FIND_GAME', () => { 
        console.log(`Jogador ${socket.id} está procurando uma partida.`);
        if (waitingPlayer) {
            console.log(`Match encontrado! ${waitingPlayer.id} vs ${socket.id}`);
            
            const roomId = `room_${socket.id}_${waitingPlayer.id}`;
            const player1 = waitingPlayer;
            const player2 = socket;

            waitingPlayer = null;

            player1.join(roomId);
            player2.join(roomId);

            const gameState = {
                roomId: roomId,
                players: [
                    { id: player1.id, hand: []},
                    { id: player2.id, hand: []}
                ],
                score: [0, 0]
            };
            gameRooms.set(roomId, gameState);

            player1.emit('GAME_STARTED', {
                roomId: roomId,
                myId: player1.id,
                opponentId: player2.id
            });

            player2.emit('GAME_STARTED', {
                roomId: roomId,
                myId: player2.id,
                opponentId: player1.id
            });
        } else {
            console.log(`Jogador ${socket.id} está aguardando na fila.`);
            waitingPlayer = socket;
            socket.emit('WAITING_FOR_OPPONENT');
        }
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);

        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
            console.log(`Jogador ${socket.id} removido da fila de espera.`); 
        }

        let roomToDestroy = null;
        for (const [roomId, gameState] of gameRooms.entries()) {
            if (gameState.players.some(p => p.id === socket.id)) {
                roomToDestroy = roomId;
                break;
            }
        }

        if (roomToDestroy) {
            console.log(`Jogador ${socket.id} desconectou do jogo ${roomToDestroy}`);
            io.to(roomToDestroy).emit('OPPONENT_DISCONNECTED');
            gameRooms.delete(roomToDestroy);
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});