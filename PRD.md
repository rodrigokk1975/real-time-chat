# PRD — Chat em Tempo Real com Salas

## 1. Visão Geral e Objetivo

Aplicação web de **chat em tempo real com salas**, projetada para demonstrar domínio prático de **WebSockets (Socket.IO)** e **gerenciamento de conexões autenticadas**, incluindo presença online resiliente a múltiplas abas, persistência de histórico em banco de dados e autenticação via JWT.

## 2. Stack Técnica

| Camada | Tecnologia | Papel |
|---|---|---|
| Monorepo | npm workspaces | Organização de `packages/shared`, `apps/server` e `apps/web` |
| Backend HTTP | Node.js + Express + TypeScript | API REST para autenticação, salas e histórico paginado |
| Tempo Real | Socket.IO (`socket.io` / `socket.io-client`) | Salas, broadcast de mensagens, presença online e indicador de digitação |
| Banco / ORM | SQLite + Prisma ORM | Persistência de usuários, salas, membros e mensagens |
| Segurança | `bcryptjs` + `jsonwebtoken` + `zod` | Hash de senhas, JWT no REST e handshake WS, validação de payloads |
| Frontend | React + Vite + TypeScript + Tailwind CSS | Interface responsiva de login, salas, chat e status de conexão |
| Testes | Vitest + Supertest + `socket.io-client` | Testes unitários e de integração (REST + WebSocket) |

## 3. Requisitos Funcionais (RF)

- **RF01 (Autenticação):** Cadastro e login com e-mail e senha (`bcrypt`), emitindo Access Token `JWT` usado em rotas REST (`Authorization: Bearer <token>`) e no handshake Socket.IO (`auth.token`).
- **RF02 (Salas):** Listagem de salas existentes (com sala padrão `#geral` via seed) e criação de novas salas com notificação em tempo real (`room:created`).
- **RF03 (Histórico Persistido):** Ao entrar em uma sala, carregar histórico paginado por cursor (`GET /api/rooms/:roomId/messages`), permitindo carregar mensagens mais antigas.
- **RF04 (Mensagens em Tempo Real):** Envio de mensagens via Socket.IO (`message:send`) com validação, persistência no SQLite e broadcast (`message:new`) para os clientes na sala.
- **RF05 (Presença Online Multi-Aba):** Lista de usuários online na sala atualizada em tempo real (`presence:update`), mantendo o usuário online enquanto houver ao menos uma conexão ativa na sala.
- **RF06 (Status de Conexão e Digitação):** Badge de status do WebSocket (`Conectado`, `Reconectando`, `Desconectado`), re-join automático após reconexão e indicador de digitação (`typing:start` / `typing:stop`).

## 4. Requisitos Não-Funcionais (RNF)

- **RNF01:** Senhas armazenadas apenas como hash `bcrypt` (salt >= 10); segredos nunca versionados.
- **RNF02:** Handshake WebSocket rejeitado antes de `connection` quando o JWT for ausente, inválido ou expirado.
- **RNF03:** Tipagem estrita ponta a ponta (`strict: true`) com contratos compartilhados em `packages/shared`.
- **RNF04:** Testes automatizados cobrindo REST, WebSocket e gerenciamento de presença.

## 5. Modelo de Dados

- **User:** `id`, `name`, `email` (unique), `passwordHash`, `createdAt`
- **Room:** `id`, `name` (unique), `description?`, `createdAt`
- **RoomMember:** `id`, `userId`, `roomId`, `joinedAt` (unique `[userId, roomId]`)
- **Message:** `id`, `content`, `roomId`, `userId`, `createdAt` (index `[roomId, createdAt]`)

## 6. Contratos de API e Eventos

### REST
- `GET /health` — Healthcheck do servidor
- `POST /api/auth/register` — Cadastro e emissão de JWT
- `POST /api/auth/login` — Login e emissão de JWT
- `GET /api/auth/me` — Usuário autenticado (JWT)
- `GET /api/rooms` — Lista salas (JWT)
- `POST /api/rooms` — Cria sala e emite `room:created` (JWT)
- `GET /api/rooms/:roomId/messages?cursor=<id>&limit=30` — Histórico paginado (JWT)

### Socket.IO
- **Client → Server:** `room:join`, `room:leave`, `message:send`, `typing:start`, `typing:stop`
- **Server → Client:** `message:new`, `presence:update`, `typing:update`, `room:created`

## 7. Etapas de Desenvolvimento (1 Commit por Etapa)

| Etapa | Descrição | Commit |
|---|---|---|
| Etapa 0 | Documentação do PRD e `.gitignore` | `docs: adicionar PRD e especificacao de etapas do projeto` |
| Etapa 1 | Bootstrap do monorepo (`shared`, `server`, `web`) | `chore: configurar monorepo com shared, server e web` |
| Etapa 2 | Schema Prisma + SQLite + migrations + seed `#geral` | `feat(db): modelar entidades de usuarios, salas e mensagens com Prisma` |
| Etapa 3 | Autenticação REST com `bcryptjs` e JWT | `feat(auth): implementar cadastro, login e middleware de autenticacao JWT` |
| Etapa 4 | API REST de salas e histórico paginado | `feat(rooms): implementar API de salas e historico paginado de mensagens` |
| Etapa 5 | Servidor Socket.IO com auth JWT, salas e `PresenceManager` | `feat(ws): implementar servidor Socket.IO com auth JWT, salas e presenca` |
| Etapa 6 | Frontend: autenticação, layout e gerenciamento de salas | `feat(web): criar autenticacao e gerenciamento de salas no frontend` |
| Etapa 7 | Frontend: chat em tempo real, presença online e reconexão | `feat(web): integrar Socket.IO com chat em tempo real, presenca e reconexao` |
| Etapa 8 | Testes de integração completos e `README.md` | `test: consolidar testes de integracao e documentacao do projeto` |
