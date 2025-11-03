const socket = io();

const findGamesBtn = document.getElementById('find-game-btn');
const messagesList = document.getElementById('messages-list');

function addMessage(msg, type = 'normal') {
    const item = document.createElement('li');
    item.textContent = msg;
    item.className = type;
    messagesList.appendChild(item);
    messagesList.scrollTop = messagesList.scrollHeight;
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
    addMessage(`Seu ID de jogador é: ${data.myId}`, 'game-start');
    addMessage(`A sala é: ${data.roomId}. O jogo vai começar!`, 'game-start');

    addMessage(`A VIRA é: ${data.vira.rank} de ${data.vira.suit}`, 'game-info');
    
    const handAsString = data.hand.map(card => `${card.rank} de ${card.suit}`).join(', ');
    addMessage(`Sua mão: [ ${handAsString} ]`, 'game-info')
    
    console.log("Jogo começou. Minha mão:", data.hand);
    console.log("Vira:", data.vira);
});

socket.on('OPPONENT_DISCONNECTED', () => {
    addMessage('Seu oponente desconectou. O jogo acabou.', 'error');
    findGamesBtn.disabled = false;
    findGamesBtn.textContent = 'Encontrar Partida';
});

addMessage('Conectado ao servidor! Clique para encontrar uma partida.', 'server-info');