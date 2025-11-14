const socket = io();

const findGamesBtn = document.getElementById('find-game-btn');
const messagesList = document.getElementById('messages-list');
const gameArea = document.getElementById('game-area');
const playerHandDiv = document.getElementById('player-hand');
const tableCardsDiv = document.getElementById('table-cards');
const myScoreSpan = document.getElementById('my-score');
const opponentScoreSpan = document.getElementById('opponent-score');
const actionButtonsDiv = document.getElementById('action-buttons');
const trucoBtn = document.getElementById('truco-btn');
const trucoResponseButtonsDiv = document.getElementById('truco-response-buttons');
const acceptBtn = document.getElementById('accept-btn');
const runBtn = document.getElementById('run-btn');
const raiseBtn = document.getElementById('raise-btn');

let myRoomId = null;
let myId = null;
let opponentId = null;

function addMessage(msg, type = 'normal') {
    const item = document.createElement('li');
    item.textContent = msg;
    item.className = type;
    messagesList.appendChild(item);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function renderHand(hand, isMyTurn) {
    playerHandDiv.innerHTML = '';

    hand.forEach(card => {
        const cardBtn = document.createElement('button');
        cardBtn.className = 'card-btn';
        cardBtn.textContent = `${card.rank} de ${card.suit}`;
        cardBtn.dataset.rank = card.rank;
        cardBtn.dataset.suit = card.suit;
        cardBtn.disabled = !isMyTurn;
        cardBtn.addEventListener('click', () => {
            playCard(card);
        });
        playerHandDiv.appendChild(cardBtn);
    })
}

function playCard(card) {
    if (myRoomId) {
        socket.emit('PLAY_CARD', {
            roomId: myRoomId,
            card: card
        });
    }
}

function updateScore(myNewScore, opponentNewScore) {
    myScoreSpan.textContent = myNewScore;
    opponentScoreSpan.textContent = opponentNewScore;
}

function showActionButtons(state) {
    actionButtonsDiv.classList.add('hidden');
    trucoResponseButtonsDiv.classList.add('hidden');

    if (state === 'CAN_TRUCO') {
        actionButtonsDiv.classList.remove('hidden');
    } else if (state === 'BEING_CHALLENGED') {
        trucoResponseButtonsDiv.classList.remove('hidden');
    }
}

trucoBtn.addEventListener('click', () => {
    socket.emit('REQUEST_TRUCO');
    showActionButtons('NONE');
});

acceptBtn.addEventListener('click', () => {
    socket.emit('RESPOND_TRUCO', { response: 'ACCEPT' });
    showActionButtons('NONE');
});

runBtn.addEventListener('click', () => {
    socket.emit('RESPOND_TRUCO', { response: 'RUN' });
    showActionButtons('NONE');
});

raiseBtn.addEventListener('click', () => {
    socket.emit('RESPOND_TRUCO', { response: 'RAISE' });
    showActionButtons('NONE');
});

findGamesBtn.addEventListener('click', () => {
    findGamesBtn.disabled = true;
    findGamesBtn.textContent = 'Procurando...';

    socket.emit('FIND_GAME'); 
    addMessage('Procurando por um oponente...', 'server-info');
});

socket.on('WAITING_FOR_OPPONENT', () => {
    addMessage('Você está na fila. Aguardando oponente.', 'server-info');
});

socket.on('GAME_STARTED', (data) => {
    addMessage(`Oponente encontrado! (ID: ${data.opponentId})`, 'game-start');
    addMessage(`A VIRA é: ${data.vira.rank} de ${data.vira.suit}`, 'game-info');
    
    myRoomId = data.roomId;
    myId = data.myId;
    opponentId = data.opponentId;

    findGamesBtn.classList.add('hidden');
    gameArea.classList.remove('hidden');

    updateScore(0, 0);
    addMessage(`Mão valendo ${data.handValue} ponto(s).`, 'game-info');

    const isMyTurn = data.turn === myId;
    renderHand(data.hand, isMyTurn);

    if (isMyTurn) {
        addMessage('É sua vez de jogar!', 'game-info');
        showActionButtons('CAN_TRUCO');
    } else {
        addMessage('Aguarde a jogada do oponente.', 'server-info');
        showActionButtons('NONE');
    }
});

socket.on('OPPONENT_DISCONNECTED', () => {
    addMessage('Seu oponente desconectou. O jogo acabou.', 'error');
    
    findGamesBtn.disabled = false;
    findGamesBtn.textContent = 'Encontrar Partida';
    findGamesBtn.classList.remove('hidden');
    gameArea.classList.add('hidden');
    myRoomId = null;
});

socket.on('CARD_PLAYED_UPDATE', (data) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'played-card';
    cardElement.textContent = `(${data.playerId === myId ? 'Você' : 'Oponente'}) jogou: ${data.card.rank} de ${data.card.suit}`;
    tableCardsDiv.appendChild(cardElement);

    if (data.playerId === myId) {
        const cardButtons = playerHandDiv.querySelectorAll('.card-btn');
        cardButtons.forEach(btn => {
            if (btn.dataset.rank === data.card.rank && btn.dataset.suit === data.card.suit) {
                btn.remove();
            }
        });
    }

    if (data.nextTurn !== 'processing') {
        const isMyTurn = data.nextTurn === myId;
        const cardButtons = playerHandDiv.querySelectorAll('.card-btn');
        cardButtons.forEach(btn => {
            btn.disabled = !isMyTurn;
        });

        if (isMyTurn) {
            addMessage('É sua vez de jogar!', 'game-info');
            showActionButtons('CAN_TRUCO');
        } else {
            addMessage('Aguarde a jogada do oponente.', 'server-info');
            showActionButtons('NONE');
        }
    } else {
        showActionButtons('NONE');
    }
});

socket.on('ROUND_ENDED', (data) => {
    const { roundWinnerId, nextTurn } = data;

    if (roundWinnerId === 'tie') {
        addMessage('Rodada empatada!', 'server-info');
    } else if (roundWinnerId === myId) {
        addMessage('Você ganhou esta rodada!', 'game-start');
    } else {
        addMessage('Oponente ganhou esta rodada.', 'error');
    }

    tableCardsDiv.innerHTML = '';

    const isMyTurn = nextTurn === myId;
    const cardButtons = playerHandDiv.querySelectorAll('.card-btn');
    cardButtons.forEach(btn => {
        btn.disabled = !isMyTurn;
    });

    if (isMyTurn) {
        addMessage('É sua vez de jogar (próxima rodada)!', 'game-info');
        showActionButtons('CAN_TRUCO');
    } else {
        addMessage('Aguarde o oponente (próxima rodada).', 'server-info');
        showActionButtons('NONE');
    }
});

socket.on('HAND_ENDED', (data) => {
    const { handWinnerId, newScore, handValue, specialHand } = data;

    if (handWinnerId === 'tie') {
        addMessage('--- MÃO EMPATADA! (3 empates) ---', 'server-info');
    } else if (handWinnerId === myId) {
        addMessage('+++ VOCÊ GANHOU A MÃO! +++', 'game-start');
    } else {
        addMessage('--- Oponente ganhou a mão. ---', 'error');
    }
        
    updateScore(data.myScore, data.opponentScore);

    addMessage('--- Iniciando nova mão... ---', 'server-info');
    tableCardsDiv.innerHTML = '';
    
    const myNewHandData = data[myId];
    addMessage(`A VIRA é: ${myNewHandData.newVira.rank} de ${myNewHandData.newVira.suit}`, 'game-info');
    addMessage(`Mão valendo ${handValue} ponto(s).`, 'game-info');

    const isMyTurn = myNewHandData.newTurn === myId;
    renderHand(myNewHandData.newHand, isMyTurn); 

    if (specialHand === 'ONZE' || specialHand === 'FERRO') {
        addMessage(`ATENÇÃO: Mão de ${specialHand}! Não pode trucar.`, 'error');
        showActionButtons('NONE');
    } else if (isMyTurn) {
        showActionButtons('CAN_TRUCO');
    } else {
        showActionButtons('NONE');
    }
});

socket.on('TRUCO_CHALLENGE', (data) => {
    if (data.to === myId) {
        addMessage(`Oponente pediu TRUCO! (Vale ${data.value} pontos)`, 'error');
        showActionButtons('BEING_CHALLENGED');
        raiseBtn.textContent = data.raiseText; 
        if (data.raiseText.includes('Max')) {
            raiseBtn.disabled = true;
        } else {
            raiseBtn.disabled = false;
        }
    } else {
        addMessage(`Você pediu TRUCO! (Vale ${data.value} pontos). Aguardando...`, 'game-info');
        showActionButtons('NONE');
    }
});

socket.on('CHALLENGE_ACCEPTED', (data) => {
    addMessage(`Desafio ACEITO! Mão valendo ${data.value} pontos.`, 'game-start');
    showActionButtons('NONE');
});

socket.on('GAME_OVER', (data) => {
    showActionButtons('NONE');
    gameArea.classList.add('hidden');
    findGamesBtn.classList.remove('hidden');
    findGamesBtn.disabled = false;
    findGamesBtn.textContent = 'Jogar Novamente';

    if (data.winnerId === myId) {
        addMessage(`FIM DE JOGO! Você Venceu! Placar: ${data.score[0]} a ${data.score[1]}`, 'game-start');
    } else {
        addMessage(`FIM DE JOGO! Você Perdeu. Placar: ${data.score[0]} a ${data.score[1]}`, 'error');
    }
});

socket.on('INVALID_MOVE', (data) => {
    addMessage(`Jogada Inválida: ${data.message}`, 'error');
});

addMessage('Conectado ao servidor! Clique para encontrar uma partida.', 'server-info');