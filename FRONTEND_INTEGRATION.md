# Guia de Integração Frontend

> **Sessão no navegador (atual):** o app não guarda token. Login, 2FA, confirmação de e-mail, refresh e
> OAuth gravam os cookies HttpOnly `enois_session`/`enois_refresh`; o app chama a API com
> `credentials: "include"` e manda `X-CSRF-Protection: 1` (o backend recusa escrita com cookie sem ele,
> 403 `CSRF_REQUIRED`). As respostas de auth não trazem mais `token`/`refreshToken`. O header
> `X-Session-Token` continua valendo só para clientes fora do navegador; `X-User-Id` não autentica
> nada (foi removido do backend). Os exemplos abaixo com `localStorage`/`X-User-Id` são históricos.

✅ Substituir `src/lib/mock-data.ts` por chamadas reais à API.

## Sumário

- [x] 1. [Convenções Gerais](#1-convenções-gerais-)
- [x] 2. [Autenticação](#2-autenticação-)
- [x] 3. [Perfil](#3-perfil-)
- [x] 4. [Feed e Posts](#4-feed-e-posts-)
- [x] 5. [Comentários](#5-comentários-)
- [x] 6. [Reações, Salvamentos e Compartilhamentos](#6-ações-em-posts-)
- [x] 7. [Rede de Conexões](#7-rede-de-conexões-)
- [x] 8. [Mídias](#8-mídias-)
- [x] 9. [Comunidades](#9-comunidades-)
- [x] 10. [Vagas](#10-vagas-)
- [x] 11. [Eventos](#11-eventos-)
- [x] 12. [Mentoria](#12-mentoria-)
- [x] 13. [Mensagens](#13-mensagens-)
- [x] 14. [Notificações](#14-notificações-)
- [x] 15. [Busca Global](#15-busca-global-)
- [x] 16. [Migração Gradual](#16-migração-gradual-)

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api-client.ts
     ============================================================ -->

## 1. Convenções Gerais ✅

`src/lib/api-client.ts` implementa:

- Base URL `http://localhost:8080/api`
- `Content-Type: application/json` automático em todas requisições
- Sessão por cookies HttpOnly (`credentials: "include"`) + `X-CSRF-Protection: 1`
- `Idempotency-Key` gerado via `crypto.randomUUID()` em POST/PUT/PATCH/DELETE
- Desenvelopamento de `CommandResponse` (`{ status, body }`) em escritas
- `PageResponse` tipado com `items` + `nextCursor`
- Classe `ApiError` com `status`, `code`, `message`
- Helper `buildQuery(params)` para paginação por cursor

### Base URL

```text
http://localhost:8080/api
```

### Headers Comuns

| Header            | Obrigatório                    | Descrição                      |
| ----------------- | ------------------------------ | ------------------------------ |
| `Content-Type`    | Sempre                         | `application/json`             |
| `X-Session-Token` | Leituras                       | Token recebido no login/signup |
| `X-User-Id`       | Alternativo                    | ID do usuário (para testes)    |
| `Idempotency-Key` | Escritas POST/PUT/PATCH/DELETE | UUID para idempotência         |

### Autenticação

- Usar `X-Session-Token` em **todas** as requisições que exigem usuário autenticado
- O token é um `base64url` de 32 bytes (ex: `abc123...`)
- O token expira em **7 dias**
- `X-User-Id` não autentica (removido do backend)

### Idempotency-Key

Toda requisição de escrita (POST, PUT, PATCH, DELETE) **deve** enviar um header `Idempotency-Key`.

```javascript
const idempotencyKey = crypto.randomUUID();
// ou gerar manualmente
const idempotencyKey = "idem_" + Date.now() + "_" + Math.random().toString(36);
```

Regras:

- Gerar **antes** da chamada e reutilizar em retries
- Se a mesma chave + payload repetir, backend reaplica sem duplicar
- Se a mesma chave com payload diferente, retorna `409 Conflict`
- Guardar a chave usada para cada operação até confirmação

### Respostas

#### Sucesso - Escritas idempotentes

```json
{
  "status": 201,
  "body": { ... dados ... }
}
```

O envelope `CommandResponse` retorna `status` HTTP e `body` com os dados.

#### Sucesso - Leituras

Endpoint de leitura retorna diretamente o objeto ou `PageResponse`:

```json
{
  "items": [ ... ],
  "nextCursor": "2026-06-06T12:00:00Z"
}
```

Se `nextCursor` for `null`, não há mais páginas.

#### Erro

```json
{
  "code": "ERROR_CODE",
  "message": "Descrição do erro.",
  "timestamp": "2026-06-06T12:00:00Z"
}
```

| Código                     | Significado                                |
| -------------------------- | ------------------------------------------ |
| `INVALID_CREDENTIALS`      | Email ou senha inválidos                   |
| `EMAIL_ALREADY_REGISTERED` | Email já cadastrado                        |
| `UNAUTHENTICATED`          | Sessão inválida ou expirada                |
| `POST_NOT_FOUND`           | Post não encontrado                        |
| `RATE_LIMITED`             | Muitas requisições (429)                   |
| `DEPENDENCY_UNAVAILABLE`   | Serviço temporariamente indisponível (503) |
| `CONFLICT`                 | Conflito de idempotência (409)             |

### Paginação por Cursor

```javascript
async function fetchFeed(cursor = null, limit = 20) {
  const params = new URLSearchParams();
  if (cursor) params.append("cursor", cursor);
  params.append("limit", limit);

  const response = await fetch(`/api/feed?${params}`, {
    headers: { "X-Session-Token": token },
  });
  const data = await response.json();

  // data.items -> array de posts
  // data.nextCursor -> string ISO ou null
  return data;
}
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/auth.ts + routes/entrar.tsx
     ============================================================ -->

## 2. Autenticação ✅

### 2.1 Cadastro

```http
POST /api/auth/signup
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "name": "Maria da Silva",
  "role": "Product Designer",
  "email": "maria@exemplo.com",
  "password": "senha-segura"
}
```

Resposta (201):

```json
{
  "status": 201,
  "body": {
    "token": "abc123...",
    "expiresAt": "2026-06-13T12:00:00Z",
    "user": {
      "id": "user_abc123",
      "username": "maria-da-silva",
      "name": "Maria da Silva",
      "headline": "Product Designer",
      "email": "maria@exemplo.com"
    }
  }
}
```

**Ações do frontend:**

- Não há token no corpo: a sessão chega nos cookies HttpOnly da resposta
- Salvar `user` para exibição imediata
- Redirecionar para feed

### 2.2 Login

```http
POST /api/auth/login
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "email": "maria@exemplo.com",
  "password": "senha-segura"
}
```

Resposta (200): Mesmo formato do signup.

### 2.3 Logout

```http
POST /api/auth/logout
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

Resposta (200):

```json
{ "status": "LOGGED_OUT" }
```

### 2.4 Usuário Atual

```http
GET /api/auth/me
X-Session-Token: <token>
```

Resposta (200): Objeto `AuthUserView`:

```json
{
  "id": "user_abc123",
  "username": "maria-da-silva",
  "name": "Maria da Silva",
  "headline": "Product Designer",
  "email": "maria@exemplo.com"
}
```

### 2.5 Esqueci Senha

```http
POST /api/auth/password/forgot
Idempotency-Key: <uuid>
Content-Type: application/json

{ "email": "maria@exemplo.com" }
```

Resposta (202):

```json
{ "status": "RESET_REQUEST_ACCEPTED" }
```

(O backend gera token e persiste. Em produção, enviaria email.)

### 2.6 Resetar Senha

```http
POST /api/auth/password/reset
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "token": "reset_<token_recebido>",
  "password": "nova-senha-segura"
}
```

Resposta (200):

```json
{ "status": "PASSWORD_RESET_ACCEPTED" }
```

### 2.7 OAuth (esboço - não configurado)

```http
GET /api/auth/oauth/{provider}/start
```

Retorna URL de autorização.

```http
GET /api/auth/oauth/{provider}/callback?code=...&state=...
```

Retorna status `NOT_CONFIGURED` até integração real.

### Fluxo de Sessão

```javascript
// login.service.js
export async function login(email, password) {
  const key = crypto.randomUUID();
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const { body } = await response.json();
  localStorage.setItem("session_token", body.token);
  localStorage.setItem("current_user", JSON.stringify(body.user));
  return body;
}

// api.client.js
export function authHeaders() {
  const token = localStorage.getItem("session_token");
  return token ? { "X-Session-Token": token } : {};
}

export function idempotentHeaders() {
  return { "Idempotency-Key": crypto.randomUUID() };
}
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/profile.ts + routes/perfil.$username.tsx
     ============================================================ -->

## 3. Perfil ✅

### 3.1 Meu Perfil

```http
GET /api/me
X-Session-Token: <token>
```

Resposta (200):

```json
{
  "id": "user_abc",
  "username": "maria-da-silva",
  "name": "Maria da Silva",
  "headline": "Product Designer",
  "email": "maria@exemplo.com",
  "company": "Empresa X",
  "location": "São Paulo, SP",
  "avatar": null,
  "banner": null,
  "bio": "Designer apaixonada por produtos digitais.",
  "skills": ["UX Research", "Figma", "Design Systems"],
  "goals": ["Mentorar designers juniores"],
  "availability": "OPEN",
  "portfolio": "https://...",
  "externalLinks": ["https://linkedin.com/in/..."],
  "openToWork": true,
  "isMentor": false,
  "connectionsCount": 42,
  "followersCount": 15,
  "reputation": 85
}
```

### 3.2 Perfil Público

```http
GET /api/users/{username}
```

Mesmo formato do `/api/me`, sem autenticação necessária.

### 3.3 Atualizar Perfil

```http
PATCH /api/me/profile
X-Session-Token: <token>
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "name": "Maria Silva",
  "headline": "Senior Product Designer",
  "company": "Nova Empresa",
  "location": "Remoto",
  "bio": "...",
  "skills": ["UX", "UI", "Figma"],
  "goals": ["...", "..."],
  "availability": "OPEN",
  "portfolio": "https://...",
  "externalLinks": ["https://..."],
  "avatar": null,
  "banner": null,
  "openToWork": true
}
```

Resposta (200): Perfil atualizado (mesmo formato do GET).

### 3.4 Experiências, Educação, Certificações

Gerenciadas via endpoints específicos (consultar OpenAPI para detalhes).

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/feed.ts + routes/feed.tsx
     ============================================================ -->

## 4. Feed e Posts ✅

### 4.1 Listar Feed

```http
GET /api/feed?cursor=...&limit=20
X-Session-Token: <token>
```

Resposta (200):

```json
{
  "items": [
    {
      "id": "post_abc",
      "authorId": "user_abc",
      "type": "INSIGHT",
      "content": "Documentar decisoes de arquitetura economizou tempo.",
      "tags": ["Arquitetura", "Boas Praticas"],
      "mediaIds": [],
      "createdAt": "2026-06-06T12:00:00Z",
      "visibility": "PUBLIC",
      "counters": { "reactions": 5, "comments": 2, "saves": 1, "shares": 0 },
      "status": "ACTIVE"
    }
  ],
  "nextCursor": "2026-06-05T12:00:00Z"
}
```

**Tipos de Post:** `INSIGHT`, `ARTICLE`, `QUESTION`, `PROJECT`, `OPPORTUNITY`

### 4.2 Publicar Post

```http
POST /api/feed/posts
X-Session-Token: <token>
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "type": "INSIGHT",
  "content": "Conteúdo do post (max 1024 caracteres)",
  "tags": ["Tag1", "Tag2"],
  "mediaIds": ["media_123"]
}
```

Validações:

- `type` obrigatório
- `content` 1-1024 caracteres
- `tags` máximo 5
- `mediaIds` máximo 5, devem pertencer ao usuário

Resposta (201): Objeto `PostView` completo.

### 4.3 Listar Posts do Perfil

```http
GET /api/users/{username}/posts?cursor=...&limit=20
```

Resposta: Mesmo formato do feed.

### 4.4 Excluir Post

```http
DELETE /api/feed/posts/{postId}
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

Resposta (200):

```json
{
  "postId": "post_abc",
  "status": "DELETED"
}
```

Se já excluído: `ALREADY_DELETED`

### 4.5 Excluir em Lote

```http
POST /api/feed/posts/bulk-delete
X-Session-Token: <token>
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "postIds": ["post_abc", "post_def"],
  "reason": "USER_SELECTED_BULK_DELETE"
}
```

Resposta (200):

```json
{
  "status": "COMPLETED",
  "results": [
    { "postId": "post_abc", "status": "MARKED_DELETED" },
    { "postId": "post_def", "status": "ALREADY_DELETED" }
  ]
}
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/comments.ts + post-card.tsx
     ============================================================ -->

## 5. Comentários ✅

### 5.1 Comentar em Post

```http
POST /api/feed/posts/{postId}/comments
X-Session-Token: <token>
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "content": "Texto do comentário (max 1024)",
  "parentCommentId": null
}
```

`parentCommentId` para respostas a comentários existentes.

Resposta (201):

```json
{
  "id": "comment_abc",
  "postId": "post_abc",
  "authorId": "user_abc",
  "parentCommentId": null,
  "content": "Texto do comentário",
  "createdAt": "2026-06-06T12:00:00Z",
  "status": "ACTIVE"
}
```

### 5.2 Listar Comentários

```http
GET /api/feed/posts/{postId}/comments?cursor=...&limit=20
```

Resposta: `PageResponse` de comentários.

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/reactions.ts + post-card.tsx
     ============================================================ -->

## 6. Ações em Posts ✅

### 6.1 Reagir

```http
POST /api/feed/posts/{postId}/reactions
X-Session-Token: <token>
Idempotency-Key: <uuid>
Content-Type: application/json

{ "type": "LIKE" }
```

### 6.2 Remover Reação

```http
DELETE /api/feed/posts/{postId}/reactions
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

### 6.3 Salvar Post

```http
POST /api/feed/posts/{postId}/saves
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

### 6.4 Remover Post Salvo

```http
DELETE /api/feed/posts/{postId}/saves
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

### 6.5 Compartilhar

```http
POST /api/feed/posts/{postId}/shares
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

Todas as ações retornam (200):

```json
{
  "postId": "post_abc",
  "status": "REACTED" | "REACTION_REMOVED" | "SAVED" | "SAVE_REMOVED" | "SHARED",
  "counters": { "reactions": 5, "comments": 2, "saves": 1, "shares": 0 }
}
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/network.ts + routes/rede.tsx
     ============================================================ -->

## 7. Rede de Conexões ✅

### 7.1 Usuários Conectados

```http
GET /api/network/users?query=...&cursor=...&limit=20
X-Session-Token: <token>
```

Resposta:

```json
{
  "items": [
    {
      "id": "user_abc",
      "username": "joao",
      "name": "João Silva",
      "headline": "Developer",
      "avatar": null,
      "connections": 10,
      "followers": 5,
      "connected": true
    }
  ],
  "nextCursor": null
}
```

### 7.2 Sugestões de Conexão

```http
GET /api/network/suggestions?limit=4
X-Session-Token: <token>
```

Resposta: Array de `NetworkUserView` ordenados por conexões mútuas.

### 7.3 Resumo da Rede

```http
GET /api/network/summary
X-Session-Token: <token>
```

Resposta:

```json
{
  "userId": "user_abc",
  "connections": 42,
  "followers": 15,
  "pendingRequests": 3
}
```

### 7.4 Solicitações Pendentes

```http
GET /api/network/requests?cursor=...&limit=20
X-Session-Token: <token>
```

Resposta:

```json
{
  "items": [
    {
      "id": "1",
      "fromUserId": "user_def",
      "toUserId": "user_abc",
      "status": "PENDING",
      "createdAt": "2026-06-05T10:00:00Z"
    }
  ],
  "nextCursor": null
}
```

### 7.5 Solicitar Conexão

```http
POST /api/network/connections/{targetUserId}
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

Resposta (202):

```json
{ "id": "targetUserId", "status": "REQUESTED" }
```

### 7.6 Aceitar Conexão

```http
PUT /api/network/connections/{targetUserId}/accept
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

Resposta (200):

```json
{ "id": "targetUserId", "status": "ACCEPTED" }
```

### 7.7 Remover Conexão

```http
DELETE /api/network/connections/{targetUserId}
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

Resposta (200):

```json
{ "id": "targetUserId", "status": "REMOVED" }
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/media.ts
     ============================================================ -->

## 8. Mídias ✅

### 8.1 Solicitar Upload

```http
POST /api/media/uploads
X-Session-Token: <token>
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "fileName": "foto.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 1024000,
  "purpose": "POST_IMAGE"
}
```

Resposta (201):

```json
{
  "id": "media_abc",
  "uploadUrl": "http://localhost:8080/api/media/{id}/upload", // simulada em dev
  "cdnUrl": "http://localhost:8080/api/media/{id}",
  "status": "PENDING"
}
```

### 8.2 Obter Metadados

```http
GET /api/media/{mediaId}
```

Resposta (200): Objeto `MediaAsset` com status, URLs, etc.

### 8.3 Solicitar Deleção

```http
DELETE /api/media/{mediaId}
X-Session-Token: <token>
Idempotency-Key: <uuid>
```

Resposta (200):

```json
{ "id": "mediaId", "status": "DELETION_REQUESTED" }
```

### Fluxo de Upload no Frontend

```javascript
// 1. Solicitar URL de upload
const uploadRes = await fetch("/api/media/uploads", {
  method: "POST",
  headers: { ...authHeaders(), ...idempotentHeaders(), "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    purpose: "POST_IMAGE",
  }),
});
const { body } = await uploadRes.json();

// 2. Fazer upload do arquivo (em dev, é um PUT simulado; em prod, é presigned URL S3)
await fetch(body.uploadUrl, {
  method: "PUT",
  body: file,
  headers: { "Content-Type": file.type },
});

// 3. Usar mediaId ao publicar post
// body.id -> "media_abc"
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/communities.ts + routes/comunidades.tsx
     ============================================================ -->

## 9. Comunidades ✅

### 9.1 Listar

```http
GET /api/communities?topic=TECNOLOGIA&cursor=...&limit=20
```

### 9.2 Criar

```http
POST /api/communities
Idempotency-Key: <uuid>
Content-Type: application/json

{ "name": "Devs Brasil", "description": "...", "topic": "TECNOLOGIA" }
```

### 9.3 Detalhar

```http
GET /api/communities/{communityId}
```

### 9.4 Atualizar

```http
PATCH /api/communities/{communityId}
Idempotency-Key: <uuid>
```

### 9.5 Entrar

```http
POST /api/communities/{communityId}/members
Idempotency-Key: <uuid>
```

### 9.6 Sair

```http
DELETE /api/communities/{communityId}/members
Idempotency-Key: <uuid>
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/jobs.ts + routes/vagas.tsx
     ============================================================ -->

## 10. Vagas ✅

### 10.1 Listar

```http
GET /api/jobs?query=...&type=REMOTE&cursor=...&limit=20
```

### 10.2 Detalhar

```http
GET /api/jobs/{jobId}
```

### 10.3 Candidatar

```http
POST /api/jobs/{jobId}/applications
Idempotency-Key: <uuid>
```

### 10.4 Salvar / Remover Salvo

```http
POST /api/jobs/{jobId}/saves
DELETE /api/jobs/{jobId}/saves
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/events.ts + routes/eventos.tsx
     ============================================================ -->

## 11. Eventos ✅

### 11.1 Listar

```http
GET /api/events?format=ONLINE&cursor=...&limit=20
```

### 11.2 Detalhar

```http
GET /api/events/{eventId}
```

### 11.3 Confirmar / Cancelar Presença

```http
POST /api/events/{eventId}/attendees
DELETE /api/events/{eventId}/attendees
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/mentors.ts + routes/mentoria.tsx
     ============================================================ -->

## 12. Mentoria ✅

### 12.1 Listar Mentores

```http
GET /api/mentors?expertise=...&cursor=...&limit=20
```

### 12.2 Detalhar Mentor

```http
GET /api/mentors/{mentorId}
```

### 12.3 Horários

```http
GET /api/mentors/{mentorId}/slots
```

### 12.4 Agendar Sessão

```http
POST /api/mentors/{mentorId}/sessions
Idempotency-Key: <uuid>
Content-Type: application/json

{ "slotId": "slot_abc", "message": "..." }
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/messages.ts + routes/mensagens.tsx
     ============================================================ -->

## 13. Mensagens ✅

### 13.1 Listar Conversas

```http
GET /api/conversations?cursor=...&limit=20
X-Session-Token: <token>
```

### 13.2 Criar Conversa

```http
POST /api/conversations
X-Session-Token: <token>
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "kind": "DIRECT",
  "title": null,
  "participantIds": ["user_def"]
}
```

### 13.3 Detalhar Conversa

```http
GET /api/conversations/{conversationId}
```

### 13.4 Listar Mensagens

```http
GET /api/conversations/{conversationId}/messages?cursor=...&limit=50
```

### 13.5 Enviar Mensagem

```http
POST /api/conversations/{conversationId}/messages
Idempotency-Key: <uuid>
Content-Type: application/json

{ "text": "Olá!" }
```

### 13.6 Marcar como Lida

```http
POST /api/conversations/{conversationId}/read
Idempotency-Key: <uuid>
```

### 13.7 Buscar Conversas

```http
GET /api/conversations/search?q=...&limit=20
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/notifications.ts + app-shell.tsx
     ============================================================ -->

## 14. Notificações ✅

### 14.1 Listar

```http
GET /api/notifications?cursor=...&limit=20
X-Session-Token: <token>
```

Resposta:

```json
{
  "items": [
    {
      "id": "notification_abc",
      "kind": "NEW_COMMENT",
      "actorId": "user_def",
      "title": "Novo comentario",
      "body": "Alguem comentou no seu post.",
      "createdAt": "2026-06-06T12:00:00Z",
      "read": false,
      "href": "/api/feed/posts/post_abc",
      "ctaLabel": "Ver"
    }
  ],
  "nextCursor": null
}
```

### 14.2 Marcar como Lida

```http
POST /api/notifications/{notificationId}/read
Idempotency-Key: <uuid>
```

### 14.3 Marcar Todas como Lidas

```http
POST /api/notifications/read-all
Idempotency-Key: <uuid>
```

---

<!-- ============================================================
     ✅ IMPLEMENTADO — src/lib/api/search.ts + app-shell.tsx (SearchBox)
     ============================================================ -->

## 15. Busca Global ✅

```http
GET /api/search?q=design&types=users,communities,jobs&limit=10
```

Resposta:

```json
{
  "items": [
    {
      "id": "user_abc",
      "type": "users",
      "title": "Maria Silva",
      "subtitle": "Product Designer",
      "image": null,
      "href": "/api/users/maria-silva"
    },
    {
      "id": "community_abc",
      "type": "communities",
      "title": "Design Brasil",
      "subtitle": "Comunidade de design",
      "image": null,
      "href": "/api/communities/community_abc"
    }
  ],
  "nextCursor": null
}
```

---

## 16. Migração Gradual ✅

### Status da Migração

| Fase | Módulo         | API                            | Rota                                   | Status |
| ---- | -------------- | ------------------------------ | -------------------------------------- | ------ |
| 1    | Autenticação   | `src/lib/api/auth.ts`          | `routes/entrar.tsx`                    | ✅     |
| 2    | Perfil         | `src/lib/api/profile.ts`       | `routes/perfil.$username.tsx`          | ✅     |
| 3    | Feed + Posts   | `src/lib/api/feed.ts`          | `routes/feed.tsx`                      | ✅     |
| 4    | Comentários    | `src/lib/api/comments.ts`      | `components/post-card.tsx`             | ✅     |
| 5    | Reações/Salvos | `src/lib/api/reactions.ts`     | `components/post-card.tsx`             | ✅     |
| 6    | Rede           | `src/lib/api/network.ts`       | `routes/rede.tsx`                      | ✅     |
| 7    | Mídias         | `src/lib/api/media.ts`         | — (upload via composer futuro)         | ✅     |
| 8    | Comunidades    | `src/lib/api/communities.ts`   | `routes/comunidades.tsx`               | ✅     |
| 9    | Vagas          | `src/lib/api/jobs.ts`          | `routes/vagas.tsx`                     | ✅     |
| 10   | Eventos        | `src/lib/api/events.ts`        | `routes/eventos.tsx`                   | ✅     |
| 11   | Mentoria       | `src/lib/api/mentors.ts`       | `routes/mentoria.tsx`                  | ✅     |
| 12   | Mensagens      | `src/lib/api/messages.ts`      | `routes/mensagens.tsx`                 | ✅     |
| 13   | Notificações   | `src/lib/api/notifications.ts` | `components/app-shell.tsx`             | ✅     |
| —    | Busca Global   | `src/lib/api/search.ts`        | `components/app-shell.tsx` (SearchBox) | ✅     |

### Estratégia aplicada

1. ✅ **`src/lib/api-client.ts`** — HTTP client base com auth, idempotência, erros tipados
2. ✅ **`src/lib/api/`** — 14 módulos de serviço (auth, profile, feed, comments, reactions, network, media, communities, jobs, events, mentors, messages, notifications, search)
3. ✅ **React Query** — hooks `useQuery`/`useMutation` em vez de stores dedicadas
4. ✅ **Rotas migradas** — todas as 11 rotas consomem API diretamente
5. ✅ **`mock-data.ts` preservado** — pode ser usado como fallback se a API estiver offline
