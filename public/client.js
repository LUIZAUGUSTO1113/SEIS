const socket = io();

const findGamesBtn = document.getElementById('find-game-btn');
const messagesList = document.getElementById('messages-list');

const gameArea = document.getElementById('game-area');
const playerHandDiv = document.getElementById('player-hand');
const tableCardsDiv = document.getElementById('table-cards');

let myRoomId = null;
let myId = null;

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

    findGamesBtn.classList.add('hidden');
    gameArea.classList.remove('hidden');

    const isMyTurn = data.turn === myId;
    renderHand(data.hand, isMyTurn);
    if (isMyTurn) {
        addMessage('É sua vez de jogar!', 'game-info');
    } else {
        addMessage('Aguarde a jogada do oponente.', 'server-info');
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

    const isMyTurn = data.nextTurn === myId;
    
    const cardButtons = playerHandDiv.querySelectorAll('.card-btn');
    cardButtons.forEach(btn => {
        if (data.playerId === myId && btn.dataset.rank === data.card.rank && btn.dataset.suit === data.card.suit) {
            btn.remove();
        } else {
            btn.disabled = !isMyTurn;
        }
    });

    if (isMyTurn) {
        addMessage('É sua vez de jogar!', 'game-info');
    } else {
        addMessage('Aguarde a jogada do oponente.', 'server-info');
    }
});

socket.on('INVALID_MOVE', (data) => {
    addMessage(`Jogada Inválida: ${data.message}`, 'error');
});

addMessage('Conectado ao servidor! Clique para encontrar uma partida.', 'server-info');