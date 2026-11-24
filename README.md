# PulseChat — Chat em Tempo Real com Salas

Aplicação full-stack de **chat em tempo real com salas**, desenvolvida em TypeScript para demonstrar domínio prático de **WebSockets (Socket.IO)**, **gerenciamento de conexões autenticadas com JWT**, **presença online multi-aba** e **persistência de histórico em banco de dados**.

> Especificação completa e roadmap por etapas em [PRD.md](./PRD.md).

## Stack Técnica

- **Monorepo:** `npm workspaces` (`packages/shared`, `apps/server`, `apps/web`)
- **Backend:** Node.js, Express, Socket.IO, TypeScript, Zod
- **Banco de Dados:** SQLite + Prisma ORM
- **Autenticação:** `bcryptjs` + JWT (validado no middleware REST e no handshake WebSocket)
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, `socket.io-client`
- **Testes:** Vitest, Supertest, `socket.io-client`

## Destaques Técnicos

- **Handshake WebSocket autenticado:** Conexões sem JWT ou com token inválido/expirado são rejeitadas antes do evento `connection` (`UNAUTHORIZED`).
- **Gerenciamento de conexões multi-aba (`PresenceManager`):** Mapeia múltiplos sockets por usuário (`userId -> Set<socketId>`) e por sala (`roomId -> userId -> Set<socketId>`). Fechar uma aba mantém o usuário online enquanto houver outra conexão ativa.
- **Reconexão resiliente:** Badge em tempo real (`Conectado`, `Reconectando...`, `Desconectado`) e re-join automático na sala ativa após reconexão.
- **Histórico paginado por cursor:** `GET /api/rooms/:roomId/messages?cursor=<id>&limit=30` com índice composto `[roomId, createdAt]` no SQLite.
- **Contratos compartilhados:** Schemas Zod e tipos de eventos Socket.IO (`ClientToServerEvents` / `ServerToClientEvents`) centralizados em `@chat/shared`.

## Como Executar Localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `apps/server/.env.example` para `apps/server/.env` (ajuste `JWT_SECRET` se desejar):

```bash
cp apps/server/.env.example apps/server/.env
```

### 3. Criar banco SQLite e popular salas padrão

```bash
npm run db:migrate --workspace=@chat/server
npm run db:seed --workspace=@chat/server
```

### 4. Iniciar backend e frontend em modo desenvolvimento

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend / Socket.IO:** http://localhost:3001

> Dica: abra uma janela normal e uma janela anônima para testar dois usuários simultâneos, presença multi-aba, indicador de digitação e histórico persistido.

## Scripts Principais

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe backend (`tsx watch`) e frontend (`vite`) em paralelo |
| `npm run build` | Compila `@chat/shared`, `@chat/server` e gera bundle de `@chat/web` |
| `npm test` | Executa toda a suíte de testes unitários e de integração (REST + WebSocket) |

## Contratos Principais

### REST
- `GET /health` — Healthcheck
- `POST /api/auth/register` — Cadastro + emissão de JWT
- `POST /api/auth/login` — Login + emissão de JWT
- `GET /api/auth/me` — Dados do usuário autenticado (JWT)
- `GET /api/rooms` — Lista salas disponíveis (JWT)
- `POST /api/rooms` — Cria nova sala e emite `room:created` (JWT)
- `GET /api/rooms/:roomId/messages` — Histórico paginado por cursor (JWT)

### Socket.IO
- **Client → Server:** `room:join`, `room:leave`, `message:send`, `typing:start`, `typing:stop`
- **Server → Client:** `message:new`, `presence:update`, `typing:update`, `room:created`
