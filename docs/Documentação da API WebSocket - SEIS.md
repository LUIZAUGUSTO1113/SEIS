# Documentação da API WebSocket - SEIS

Olá! Este documento descreve todos os eventos WebSocket que o servidor (back-end) e o cliente (front-end) trocam para fazer o jogo de truco funcionar.

A comunicação é baseada em "eventos". O cliente **emite** eventos quando o usuário realiza uma ação (ex: `PLAY_CARD`), e o cliente **ouve** (usando `socket.on`) os eventos que o servidor envia para saber como atualizar a tela.

## Modelo de Comunicação

* **Cliente (Front-end):** Controla a interface, coleta cliques do usuário e envia "pedidos" (ações) ao servidor.
* **Servidor (Back-end):** É o "juiz" e a "memória" do jogo. Ele recebe as ações, valida as regras e envia de volta o "novo estado" para *todos* os jogadores. O front-end **nunca** deve adivinhar o estado; ele deve apenas reagir ao que o servidor diz.

---

## 1. Eventos Emitidos pelo Cliente (Front-end ➡️ Servidor)

Estes são os eventos que o front-end **DEVE EMITIR** (`socket.emit`) para o servidor.

### 1.1 `FIND_GAME`

* **Quando:** Quando o usuário clica no botão "Encontrar Partida".
* **Payload (O que enviar):** Nenhum.
* **O que esperar do servidor:** O cliente deve aguardar uma de duas respostas:
    1.  `WAITING_FOR_OPPONENT`: Se ele for o primeiro a entrar.
    2.  `GAME_STARTED`: Se um oponente já estava esperando (o jogo começa imediatamente).

### 1.2 `PLAY_CARD`

* **Quando:** Quando o jogador (e é a vez dele) clica em uma carta da sua mão.
* **Payload (O que enviar):** Um objeto `{ roomId, card }`.
    * `roomId` (string): O ID da sala (você recebe isso no `GAME_STARTED`).
    * `card` (objeto): O objeto da carta que foi jogada. Ex: `{ rank: 'A', suit: 'Spades' }`.
* **O que esperar do servidor:**
    * `CARD_PLAYED_UPDATE`: Se a jogada for válida (para todos na sala).
    * `INVALID_MOVE`: Se a jogada for inválida (só para quem enviou).

### 1.3 `REQUEST_TRUCO`

* **Quando:** Quando o jogador (e é a vez dele) clica no botão "TRUCO!".
* **Payload (O que enviar):** Nenhum.
* **O que esperar do servidor:**
    * `TRUCO_CHALLENGE`: O servidor enviará este evento para todos na sala.
    * `INVALID_MOVE`: Se não for permitido trucar (ex: Mão de Onze, não é sua vez, etc.).

### 1.4 `RESPOND_TRUCO`

* **Quando:** Quando um jogador que *recebeu* um desafio de truco clica em uma das opções de resposta.
* **Payload (O que enviar):** Um objeto `{ response }`.
    * `response` (string): Deve ser uma das três opções: `'ACCEPT'`, `'RUN'`, ou `'RAISE'`.
* **O que esperar do servidor:**
    * Se 'ACCEPT': `CHALLENGE_ACCEPTED`.
    * Se 'RUN': `HAND_ENDED` (pois a mão acaba).
    * Se 'RAISE': `TRUCO_CHALLENGE` (um novo desafio, agora invertido).

---

## 2. Eventos Recebidos pelo Cliente (Servidor ➡️ Front-end)

Estes são os eventos que o front-end **DEVE OUVIR** (`socket.on`) para atualizar a interface do usuário.

### 2.1 `WAITING_FOR_OPPONENT`

* **Quando:** Ao enviar `FIND_GAME`, se você for o primeiro jogador.
* **Payload (O que recebe):** Nenhum.
* **O que o Front-end deve fazer:** Mostrar uma mensagem de "Aguardando oponente..." na tela.

### 2.2 `GAME_STARTED`

* **Quando:** O jogo foi formado e está começando.
* **Payload (O que recebe):** Um objeto `data` grande com todo o estado inicial.
    ```json
    {
      "roomId": "room_...",
      "myId": "seu_socket_id",
      "opponentId": "id_do_oponente",
      "hand": [ { "rank": "A", "suit": "Spades" }, ... ],
      "vira": { "rank": "7", "suit": "Diamonds" },
      "turn": "id_de_quem_começa",
      "score": [0, 0],
      "handValue": 1
    }
    ```
* **O que o Front-end deve fazer:**
    1.  Esconder a tela de "Procurar Partida" e mostrar o tabuleiro do jogo.
    2.  Salvar `data.myId`, `data.opponentId` e `data.roomId` em variáveis globais.
    3.  Renderizar as 3 cartas da `data.hand`.
    4.  Mostrar a carta `data.vira` na mesa.
    5.  Atualizar o placar (`updateScore(0, 0)`).
    6.  Verificar se `data.turn === data.myId`. Se sim, habilitar as cartas e o botão "TRUCO". Se não, desabilitá-los.

### 2.3 `CARD_PLAYED_UPDATE`

* **Quando:** Sempre que *qualquer* jogador (você ou o oponente) joga uma carta.
* **Payload (O que recebe):**
    ```json
    {
      "playerId": "id_de_quem_jogou",
      "card": { "rank": "K", "suit": "Clubs" },
      "nextTurn": "id_do_próximo_a_jogar"
    }
    ```
    * *Nota: `nextTurn` pode ser a string `"processing"` se foi a 2ª carta da rodada.*
* **O que o Front-end deve fazer:**
    1.  Mostrar a `data.card` na área da "Mesa".
    2.  Se `data.playerId === myId` (eu joguei), remover a carta da minha mão.
    3.  Se `data.nextTurn !== 'processing'`, verificar se `data.nextTurn === myId` para habilitar/desabilitar as cartas e o botão "TRUCO".
    4.  Se `data.nextTurn === 'processing'`, desabilitar tudo (cartas e truco) e aguardar o próximo evento (`ROUND_ENDED` ou `HAND_ENDED`).

### 2.4 `ROUND_ENDED`

* **Quando:** A 2ª carta da rodada (vaza) foi jogada e a *mão ainda não acabou*.
* **Payload (O que recebe):**
    ```json
    {
      "roundWinnerId": "id_do_vencedor_da_rodada" (ou 'tie'),
      "nextTurn": "id_de_quem_começa_a_próxima_rodada"
    }
    ```
* **O que o Front-end deve fazer:**
    1.  Mostrar uma mensagem de quem ganhou a rodada (ex: "Você ganhou esta rodada!").
    2.  Após um breve delay (o servidor já espera 2s), limpar a "Mesa".
    3.  Verificar se `data.nextTurn === myId` para habilitar/desabilitar as cartas e o botão "TRUCO".

### 2.5 `HAND_ENDED`

* **Quando:** A mão (melhor de 3) acabou, ou alguém "correu" do truco.
* **Payload (O que recebe):** Um objeto `data` complexo. O servidor envia um payload personalizado para cada jogador.
    ```json
    {
      "handWinnerId": "id_do_vencedor_da_mão",
      "myScore": 1,
      "opponentScore": 0,
      "handValue": 1,
      "specialHand": "ONZE",
      "[player1_id]": { 
        "newHand": [ ... ],
        "newVira": { ... },
        "newTurn": "id_de_quem_começa"
      },
      "[player2_id]": { 
        "newHand": [ ... ],
        "newVira": { ... },
        "newTurn": "id_de_quem_começa"
      }
    }
    ```
* **O que o Front-end deve fazer:**
    1.  Mostrar uma mensagem de quem ganhou a mão (ex: "Você ganhou a mão!").
    2.  Atualizar o placar: `updateScore(data.myScore, data.opponentScore)`.
    3.  Limpar a "Mesa".
    4.  Pegar os dados da sua nova mão: `const myNewData = data[myId]`.
    5.  Renderizar a nova mão: `renderHand(myNewData.newHand, ...)`.
    6.  Mostrar a nova `myNewData.newVira`.
    7.  Verificar `data.specialHand`. Se for 'ONZE' or 'FERRO', desabilitar o botão "TRUCO".
    8.  Habilitar/desabilitar as cartas baseado em `myNewData.newTurn === myId`.

### 2.6 `TRUCO_CHALLENGE`

* **Quando:** Alguém (você ou o oponente) pede "TRUCO" ou "SEIS", "NOVE", "DOZE".
* **Payload (O que recebe):**
    ```json
    {
      "from": "id_de_quem_desafiou",
      "to": "id_de_quem_recebeu",
      "value": 3 (ou 6, 9, 12),
      "raiseText": "SEIS" (ou "NOVE", etc.)
    }
    ```
* **O que o Front-end deve fazer:**
    * Verificar se `data.to === myId`.
    * **Se SIM (Eu fui desafiado):**
        1.  Mostrar os botões "Aceitar", "Correr", "Aumentar".
        2.  Atualizar o texto do botão de aumentar: `raiseBtn.textContent = data.raiseText`.
        3.  Desabilitar o `raiseBtn` se `data.raiseText.includes('Max')`.
        4.  Desabilitar as cartas.
    * **Se NÃO (Eu desafiei):**
        1.  Mostrar uma mensagem "Aguardando resposta do oponente...".
        2.  Esconder todos os botões de ação.
        3.  Desabilitar as cartas.

### 2.7 `CHALLENGE_ACCEPTED`

* **Quando:** O oponente aceita seu desafio de "TRUCO" (ou você aceita o dele).
* **Payload (O que recebe):**
    ```json
    {
      "value": 3 (ou 6, 9, 12),
      "acceptedBy": "id_de_quem_aceitou"
    }
    ```
* **O que o Front-end deve fazer:**
    1.  Mostrar uma mensagem: "Desafio aceito! Mão valendo `data.value` pontos."
    2.  Esconder os botões de resposta.
    3.  O jogo continua. O botão "TRUCO" reaparecerá para o jogador correto quando for o turno dele (controlado pelos eventos `CARD_PLAYED_UPDATE` ou `ROUND_ENDED`).

### 2.8 `GAME_OVER`

* **Quando:** Alguém chega a 12 pontos.
* **Payload (O que recebe):**
    ```json
    {
      "winnerId": "id_do_vencedor_do_jogo",
      "score": [12, 5]
    }
    ```
* **O que o Front-end deve fazer:**
    1.  Mostrar a mensagem final (ex: "Você Venceu!" se `data.winnerId === myId`).
    2.  Esconder a área do jogo.
    3.  Mostrar o botão "Encontrar Partida" novamente, com o texto "Jogar Novamente".

### 2.9 `INVALID_MOVE`

* **Quando:** O cliente tenta fazer uma ação ilegal.
* **Payload (O que recebe):** `{ message: "Não é sua vez de jogar!" }`
* **O que o Front-end deve fazer:** Mostrar a `data.message` como um erro para o usuário.

### 2.10 `OPPONENT_DISCONNECTED`

* **Quando:** O oponente fecha a aba ou perde a conexão.
* **Payload (O que recebe):** Nenhum.
* **O que o Front-end deve fazer:**
    1.  Mostrar a mensagem "Oponente desconectou."
    2.  Esconder a área do jogo e mostrar o botão "Encontrar Partida".

