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
                roundWinners: [],
                handValue: 1,
                pendingChallenge: null,
                handStarter: player1.id,
                lastBettor: null
            };
            gameRooms.set(roomId, gameState);

            player1.emit('GAME_STARTED', {
                roomId: roomId,
                myId: player1.id,
                opponentId: player2.id,
                hand: hand1,
                vira: vira,
                turn: gameState.turn,
                score: [0, 0],
                handValue: 1
            });

            player2.emit('GAME_STARTED', {
                roomId: roomId,
                myId: player2.id,
                opponentId: player1.id,
                hand: hand2,
                vira: vira,
                turn: gameState.turn,
                score: [0, 0],
                handValue: 1
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

        if (gameState.pendingChallenge) {
            socket.emit('INVALID_MOVE', { message: 'Você precisa responder ao TRUCO!' });
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

                    if (handWinner !== 'tie') {
                        const winnerIndex = gameState.players.findIndex(p => p.id === handWinner);
                        gameState.score[winnerIndex] += gameState.handValue;
                        console.log(`Sala ${roomId}: Placar ${gameState.score}`);
                    }

                    const p1Score = gameState.score[0];
                    const p2Score = gameState.score[1];
                    if (p1Score >= 12 || p2Score >= 12) {
                        const gameWinnerId = p1Score >= 12 ? gameState.players[0].id : gameState.players[1].id;
                        io.to(roomId).emit('GAME_OVER', { winnerId: gameWinnerId, score: gameState.score });
                        gameRooms.delete(roomId);
                        return;
                    }
                     
                    const { hand1, hand2, vira, manilhaRank } = gameLogic.startNewHand();
                    const player1State = gameState.players[0];
                    const player2State = gameState.players[1];
                    player1State.hand = hand1;
                    player2State.hand = hand2;
                    gameState.vira = vira;
                    gameState.manilhaRank = manilhaRank;
                    gameState.currentHand = 1;
                    gameState.currentRoundCards = [];
                    gameState.roundWinners = [];

                    const p1id = gameState.players[0].id;
                    const p2id = gameState.players[1].id;
                    let nextTurnId;

                    if (handWinner !== 'tie') {
                        nextTurnId = handWinner;
                    } else {
                        const lastHandStarterId = gameState.handStarter;
                        nextTurnId = (lastHandStarterId === p1id) ? p2id : p1id;
                    }

                    gameState.turn = nextTurnId;
                    gameState.handStarter = nextTurnId;

                    let newHandValue = 1;
                    let specialHand = null;
                    if (gameState.score[0] === 11 && gameState.score[1] === 11) {
                        newHandValue = 1;
                        specialHand = 'FERRO';
                    } else if (gameState.score[0] === 11 || gameState.score[1] === 11) {
                        newHandValue = 3;
                        specialHand = 'ONZE';
                    }
                    gameState.handValue = newHandValue;
                    gameState.pendingChallenge = null;
                    gameState.lastBettor = null;

                    io.to(player1State.id).emit('HAND_ENDED', {
                        handWinnerId: handWinner,
                        myScore: gameState.score[0],
                        opponentScore: gameState.score[1],
                        handValue: newHandValue,
                        specialHand: specialHand,
                        [player1State.id]: { newHand: hand1, newVira: vira, newTurn: gameState.turn },
                        [player2State.id]: { newHand: hand2, newVira: vira, newTurn: gameState.turn }
                    });

                    io.to(player2State.id).emit('HAND_ENDED', {
                        handWinnerId: handWinner,
                        myScore: gameState.score[1],
                        opponentScore: gameState.score[0],
                        handValue: newHandValue,
                        specialHand: specialHand,
                        [player1State.id]: { newHand: hand1, newVira: vira, newTurn: gameState.turn },
                        [player2State.id]: { newHand: hand2, newVira: vira, newTurn: gameState.turn }
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

    const TRUCO_LEVELS = [
        { value: 3, valueOnRun: 1, raiseText: 'SEIS' },
        { value: 6, valueOnRun: 3, raiseText: 'NOVE' },
        { value: 9, valueOnRun: 6, raiseText: 'DOZE' },
        { value: 12, valueOnRun: 9, raiseText: 'DOZE (Max)' },
    ];

    socket.on('REQUEST_TRUCO', () => {
        const gameState = getGameStateBySocketId(socket.id);
        if (!gameState) return;

        if (gameState.pendingChallenge) return;

        if (gameState.score.includes(11)) {
            socket.emit('INVALID_MOVE', { message: 'Não é permitido trucar na Mão de Onze ou Ferro!' });
            return;
        }

        if (gameState.turn !== socket.id) {
            socket.emit('INVALID_MOVE', { message: 'Não é sua vez de pedir truco!' });
            return;
        }

        if (gameState.lastBettor === socket.id) {
            socket.emit('INVALID_MOVE', { message: 'Você não pode aumentar sua própria aposta!' });
            return;
        }

        const currentLevelIndex = TRUCO_LEVELS.findIndex(l => l.value === gameState.handValue);
        const nextLevelIndex = currentLevelIndex + 1;
        if (nextLevelIndex >= TRUCO_LEVELS.length) {
            socket.emit('INVALID_MOVE', { message: 'Não pode aumentar, já está em 12!' });
            return;
        }

        const nextLevel = TRUCO_LEVELS[nextLevelIndex];
        const opponent = gameState.players.find(p => p.id !== socket.id);
        
        gameState.pendingChallenge = {
            from: socket.id,
            to: opponent.id,
            levelIndex: nextLevelIndex,
            value: nextLevel.value,
            valueOnRun: nextLevel.valueOnRun,
            raiseText: nextLevel.raiseText
        };

        io.to(gameState.roomId).emit('TRUCO_CHALLENGE', gameState.pendingChallenge);
    });

    socket.on('RESPOND_TRUCO', (data) => {
        const { response } = data;
        const gameState = getGameStateBySocketId(socket.id);
        if (!gameState || !gameState.pendingChallenge || socket.id !== gameState.pendingChallenge.to) {
            return;
        }

        const challenge = gameState.pendingChallenge;

        if (response === 'RUN') {
            const winnerIndex = gameState.players.findIndex(p => p.id === challenge.from);
            gameState.score[winnerIndex] += challenge.valueOnRun;
            
            if (gameState.score[winnerIndex] >= 12) {
                io.to(gameState.roomId).emit('GAME_OVER', { winnerId: challenge.from, score: gameState.score });
                gameRooms.delete(gameState.roomId);
                return;
            }

            startNewHandAfterRun(gameState.roomId, challenge.from);

        } else if (response === 'ACCEPT') {
            gameState.handValue = challenge.value;
            gameState.lastBettor = challenge.from;
            gameState.pendingChallenge = null;

            io.to(gameState.roomId).emit('CHALLENGE_ACCEPTED', {
                value: gameState.handValue,
                acceptedBy: socket.id
            });

        } else if (response === 'RAISE') {
            const nextLevelIndex = challenge.levelIndex + 1;
            if (nextLevelIndex >= TRUCO_LEVELS.length) {
                socket.emit('INVALID_MOVE', { message: 'Não pode aumentar, já está em 12!' });
                return;
            }
            
            const nextLevel = TRUCO_LEVELS[nextLevelIndex];

            gameState.pendingChallenge = {
                from: socket.id,
                to: challenge.from,
                levelIndex: nextLevelIndex,
                value: nextLevel.value,
                valueOnRun: nextLevel.valueOnRun,
                raiseText: nextLevel.raiseText
            };
            
            io.to(gameState.roomId).emit('TRUCO_CHALLENGE', gameState.pendingChallenge);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }

        const gameState = getGameStateBySocketId(socket.id);
        if (gameState) {
            io.to(gameState.roomId).emit('OPPONENT_DISCONNECTED');
            gameRooms.delete(gameState.roomId);
        }
    });
});

function getGameStateBySocketId(socketId) {
    for (const [roomId, gameState] of gameRooms.entries()) {
        if (gameState.players.some(p => p.id === socketId)) {
            return gameState;
        }
    }
    return null;
}

function startNewHandAfterRun(roomId, handWinnerId) {
    const gameState = gameRooms.get(roomId);
    if (!gameState) return;

    const { hand1, hand2, vira, manilhaRank } = gameLogic.startNewHand();
    const player1State = gameState.players[0];
    const player2State = gameState.players[1];
    player1State.hand = hand1;
    player2State.hand = hand2;
    gameState.vira = vira;
    gameState.manilhaRank = manilhaRank;
    gameState.currentHand = 1;
    gameState.currentRoundCards = [];
    gameState.roundWinners = [];
    gameState.turn = handWinnerId;
    gameState.handStarter = handWinnerId;
    
    let newHandValue = 1;
    let specialHand = null;
    if (gameState.score[0] === 11 && gameState.score[1] === 11) {
        newHandValue = 1; specialHand = 'FERRO';
    } else if (gameState.score[0] === 11 || gameState.score[1] === 11) {
        newHandValue = 3; specialHand = 'ONZE';
    }
    gameState.handValue = newHandValue;
    gameState.pendingChallenge = null;
    gameState.lastBettor = null;

    io.to(player1State.id).emit('HAND_ENDED', {
        handWinnerId: handWinnerId,
        myScore: gameState.score[0],
        opponentScore: gameState.score[1],
        handValue: newHandValue,
        specialHand: specialHand,
        [player1State.id]: { newHand: hand1, newVira: vira, newTurn: gameState.turn },
        [player2State.id]: { newHand: hand2, newVira: vira, newTurn: gameState.turn }
    });

    io.to(player2State.id).emit('HAND_ENDED', {
        handWinnerId: handWinnerId,
        myScore: gameState.score[1],
        opponentScore: gameState.score[0],
        handValue: newHandValue,
        specialHand: specialHand,
        [player1State.id]: { newHand: hand1, newVira: vira, newTurn: gameState.turn },
        [player2State.id]: { newHand: hand2, newVira: vira, newTurn: gameState.turn }
    });
}

httpServer.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});