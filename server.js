const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const gameLogic = require('./game-logic');

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

            const { hand1, hand2, vira, manilhaRank } = gameLogic.startNewHand();

            const gameState = {
                roomId: roomId,
                players: [
                    { id: player1.id, hand: hand1},
                    { id: player2.id, hand: hand2}
                ],
                score: [0, 0],
                vira: vira,
                manilhaRank: manilhaRank,
                turn: player1.id,
                currentHand: 1,
                currentRoundCards: [],
                roundWinners: []
            };
            gameRooms.set(roomId, gameState);

            player1.emit('GAME_STARTED', {
                roomId: roomId,
                myId: player1.id,
                opponentId: player2.id,
                hand: hand1,
                vira: vira,
                turn: gameState.turn
            });

            player2.emit('GAME_STARTED', {
                roomId: roomId,
                myId: player2.id,
                opponentId: player1.id,
                hand: hand2,
                vira: vira,
                turn: gameState.turn
            });
        } else {
            console.log(`Jogador ${socket.id} está aguardando na fila.`);
            waitingPlayer = socket;
            socket.emit('WAITING_FOR_OPPONENT');
        }
    });

    socket.on('PLAY_CARD', (data) => {
        const { roomId, card } = data;
        const gameState = gameRooms.get(roomId);

        if (!gameState) return;

        if (gameState.turn !== socket.id) {
            socket.emit('INVALID_MOVE', { message: 'Não é sua vez de jogar! '});
            return;
        }

        const playerState = gameState.players.find(p => p.id === socket.id);
        const cardIndex = playerState.hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
        if (cardIndex === -1) {
            socket.emit('INVALID_MOVE', { message: 'Você não tem essa carta!' });
            return;
        }

        const playedCard = playerState.hand.splice(cardIndex, 1)[0];
        gameState.currentRoundCards.push({
            playerId: socket.id,
            card: playedCard
        });

        if (gameState.currentRoundCards.length === 1) {
            const opponent = gameState.players.find(p => p.id !== socket.id);
            gameState.turn = opponent.id;

            io.to(roomId).emit('CARD_PLAYED_UPDATE', {
                playerId: socket.id,
                card: playedCard,
                nextTurn: gameState.turn
            });
        } else if (gameState.currentRoundCards.length === 2) {
            io.to(roomId).emit('CARD_PLAYED_UPDATE', {
                playerId: socket.id,
                card: playedCard,
                nextTurn: 'processing'
            });

            const card1 = gameState.currentRoundCards[0];
            const card2 = gameState.currentRoundCards[1];
            const roundWinnerId = gameLogic.determineRoundWinner(card1, card2, gameState.manilhaRank);

            gameState.roundWinners.push(roundWinnerId);
            gameState.currentHand++;

            let nextTurnPlayer = (roundWinnerId === 'tie') ? card1.playerId : roundWinnerId;
            gameState.turn = nextTurnPlayer;
            const handWinner = gameLogic.checkHandWinner(gameState.roundWinners);
            setTimeout(() => {
                if (handWinner) {
                    console.log(`Mão ${roomId} acabada. Vencedor: ${handWinner}`);
                     
                    const { hand1, hand2, vira, manilhaRank } = gameLogic.startNewHand();
                    const player1 = gameState.players[0];
                    const player2 = gameState.players[1];
                    player1.hand = hand1;
                    player2.hand = hand2;
                    gameState.vira = vira;
                    gameState.manilhaRank = manilhaRank;
                    gameState.currentHand = 1;
                    gameState.currentRoundCards = [];
                    gameState.roundWinners = [];
                    // TODO: Trocar quem começa (turn) e quem é o dealer
                    gameState.turn = player2.id;

                    io.to(roomId).emit('HAND_ENDED', {
                        handWinnerId: handWinner,
                        [player1.id]: { newHand: hand1, newVira: vira, newTurn: gameState.turn },
                        [player2.id]: { newHand: hand2, newVira: vira, newTurn: gameState.turn },
                    });
                } else {
                    gameState.currentRoundCards = [];
                    io.to(roomId).emit('ROUND_ENDED', {
                        roundWinnerId: roundWinnerId,
                        nextTurn: gameState.turn
                    });
                }
            }, 2000);
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