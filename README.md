# SEIS - Jogo de Truco (Projeto de S.O.)

## Sobre o Projeto

**SEIS** é um jogo de Truco Paulista multiplayer, 1v1, e em tempo real, jogado diretamente no navegador.

Este projeto foi desenvolvido como trabalho avaliativo para a disciplina de **Sistemas Operacionais (S.O.)** do curso de Engenharia de Software da **UniCesumar**. O objetivo principal foi aplicar conceitos teóricos fundamentais da disciplina em um projeto prático, funcional e dinâmico, demonstrando como processos (clientes) podem se comunicar e compartilhar dados de forma controlada.

## Jogo em Produção (Deploy)

Link: [https://seis.onrender.com](https://seis.onrender.com/) (Verificar disponibilidade!)

---

## Conceitos de S.O. Aplicados

O núcleo do trabalho foi simular dois conceitos centrais de Sistemas Operacionais em uma aplicação web:

### 1. Memória Compartilhada (Shared Memory)

No contexto deste projeto, a "Memória Compartilhada" é representada pelo objeto `gameState` mantido no servidor Node.js.

- **Implementação:** O `gameState` é a "fonte única da verdade" (`single source of truth`). Ele armazena o placar, as cartas na mão de cada jogador, o "vira", o valor da aposta (truco), e de quem é o turno.
- **Sincronização:** Nenhum cliente (jogador) pode modificar esta "memória" diretamente. Eles apenas enviam "mensagens" (ações). O servidor é o único que pode ler e escrever neste estado, garantindo que não haja condições de corrida e que o estado seja sempre consistente para todos os jogadores.

### 2. Mensageria (Messaging)

A comunicação entre os clientes (browsers) e o servidor é feita inteiramente por um sistema de troca de mensagens (IPC - Inter-Process Communication).

- **Implementação:** Utilizamos o protocolo **WebSocket** (através da biblioteca `Socket.io`) para criar um canal de comunicação bidirecional e em tempo real.
- **Fluxo:**
    1. O **Cliente** envia uma mensagem (evento) com uma "intenção" (ex: `PLAY_CARD` com os dados da carta).
    2. O **Servidor** recebe a mensagem, valida a ação contra a "Memória Compartilhada" (`gameState`), atualiza o estado e, em seguida, envia uma nova mensagem (ex: `CARD_PLAYED_UPDATE`) para *todos* os clientes na sala.
    3. Os **Clientes** recebem a mensagem e apenas atualizam sua interface visual para refletir o novo estado.

### 3. Sincronização (Exclusão Mútua)

O servidor garante a **exclusão mútua** no acesso ao `gameState`. Em um ambiente multi-threaded (como Java ou C#), isso exigiria um mutex ou semáforo para travar a memória e prevenir "condições de corrida" (race conditions). No **Node.js**, essa proteção é **implícita** graças ao seu **loop de eventos single-threaded**. O Node.js só processa um evento (`PLAY_CARD`, `REQUEST_TRUCO`, etc.) de cada vez. Se duas jogadas chegam "ao mesmo tempo", uma entra na fila e só é executada após a outra terminar, garantindo a integridade e consistência do estado do jogo.

---

## Ferramentas e Tecnologias

Este projeto é um "monorepo" dividido em duas partes principais:

### Back-end (Servidor)

- **Node.js:** Ambiente de execução.
- **Express.js:** Framework para o servidor web e gerenciamento de rotas.
- **Socket.io:** Para comunicação em tempo real via WebSockets.
- **Nodemon:** Para reiniciar o servidor automaticamente em desenvolvimento.
- **Concurrently:** Para rodar os servidores de back-end e front-end com um único comando.
- **CORS:** Para permitir a comunicação entre os dois servidores (`localhost:3000` e `localhost:5173`) em desenvolvimento.

### Front-end (Cliente)

- **Vite:** Ferramenta de build e servidor de desenvolvimento de alta performance.
- **Vue.js 3:** Framework reativo para a construção da interface do usuário (UI).
- **Pinia:** Para gerenciamento de estado global no front-end (ex: `gameStore`, `socketStore`).
- **Vue Router:** Para gerenciar as "páginas" (views) da aplicação (ex: `HomeView`, `GameView`).
- **Socket.io-client:** Biblioteca cliente para se conectar ao servidor WebSocket.

---

## Como Rodar Localmente (Desenvolvimento)

Você precisará do [Node.js](https://nodejs.org/) (v18 ou superior) instalado.

1. **Clone o repositório:**
    
    ```
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```
    
2. **Instale as dependências do Back-end (na raiz):**
    
    ```
    npm install
    ```
    
3. **Instale as dependências do Front-end (na pasta `front`):**
    
    ```
    npm install --prefix front
    ```
    
4. **Rode os dois servidores (Back e Front) ao mesmo tempo:**
    
    Na raiz do projeto, execute o comando:
    
    ```
    npm run dev
    ```
    
    - O `concurrently` iniciará o servidor back-end em `http://localhost:3000`.
    - E iniciará o servidor front-end (Vite) em `http://localhost:5173`.
5. **Jogue!**
    - Abra `http://localhost:5173` no seu navegador.
    - Abra uma **segunda aba** (ou uma janela anônima) no mesmo endereço para simular o segundo jogador.

---

## Autores

- Luiz Augusto - Back-end & Lógica do Jogo - [GitHub](https://www.google.com/search?q=https://github.com/seu-usuario)
- Matheus Polizelli - Front-end & UI/UX - [GitHub](https://www.google.com/search?q=https://github.com/usuario-dele)
- Rafael Blasques - Documentação - [Github](https://github.com/Rafaelmorales14)
