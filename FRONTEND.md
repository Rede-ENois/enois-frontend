# Frontend Integration Guide

> **Sessão no navegador (atual):** o app não guarda token. Login, 2FA, confirmação de e-mail, refresh e
> OAuth gravam os cookies HttpOnly `enois_session`/`enois_refresh`; o app chama a API com
> `credentials: "include"` e manda `X-CSRF-Protection: 1` (o backend recusa escrita com cookie sem ele,
> 403 `CSRF_REQUIRED`). As respostas de auth não trazem mais `token`/`refreshToken`. O header
> `X-Session-Token` continua valendo só para clientes fora do navegador; `X-User-Id` não autentica
> nada (foi removido do backend). Os exemplos abaixo com `localStorage`/`X-User-Id` são históricos.

## Setup

```text
API_BASE = http://localhost:8081/api
CORS    = liberado (qualquer origem, credenciais ativas)
```

## Autenticação

Autenticação é feita via **headers** em cada requisição. Não há cookie/JWT — a POC usa headers diretos.

| Header            | Obrigatório              | Descrição                           |
| ----------------- | ------------------------ | ----------------------------------- |
| `X-User-Id`       | Sim (rotas autenticadas) | ID do usuário                       |
| `X-Session-Token` | Sim (rotas autenticadas) | Token de sessão                     |
| `Idempotency-Key` | Opcional                 | Evita duplicatas em POST/PUT/DELETE |

O backend valida o `X-Session-Token` contra um token ativo. Em dev, tokens são simulados.

### Signup

```text
POST /api/auth/signup
Body: { "name": "...", "role": "MEMBER", "email": "...", "password": "..." }
Response 201: { "id": "...", "token": "...", "email": "...", ... }
```

### Login

```text
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response 200: { "id": "...", "token": "...", "email": "...", ... }
```

### Logout

```text
POST /api/auth/logout
Headers: X-Session-Token
Response 200: { "status": "LOGGED_OUT" }
```

### Meus dados

```text
GET /api/auth/me
Headers: X-Session-Token
Response: { "id": "...", "email": "...", "name": "...", ... }
```

## Upload de Mídia (ImageKit CDN)

Fluxo completo:

```text
1. FRONTEND → POST /api/media/uploads               (pede URL de destino)
               Body: { "fileName": "foto.jpg", "mimeType": "image/jpeg", "size": 12345 }
               Response 201: { "id": "media_...", "cdnUrl": "https://ik.imagekit.io/socialcoisa/...",
                               "uploadUrl": "https://ik.imagekit.io/socialcoisa/...", "expiresAt": "..." }

2. FRONTEND → ImageKit Upload API (client-side)      (sobe o arquivo direto no ImageKit)
               POST https://upload.imagekit.io/api/v1/files/upload
               FormData: { file: <File>, fileName: "...", publicKey: "public_0Y+bnNURFVY+XZuqyCWQGafHo/0=" }
               O fileName precisa bater com o gerado pelo backend.
               Opcional: usar "useUniqueFileName: false" para manter o nome original.

3. FRONTEND → POST /api/media/{mediaId}/confirm      (marca como uploaded — ver nota abaixo)
```

> **Nota:** O endpoint de confirmação (`POST /api/media/{mediaId}/confirm`) ainda não existe no backend. Para a POC, o asset já é criado como `PENDING` e o `cdnUrl` já é válido antes do upload. O frontend pode subir o arquivo para o ImageKit com qualquer `fileName` e depois referenciar o `mediaId` nos posts.

### Criar upload (passo 1)

```text
POST /api/media/uploads
Headers: X-User-Id, X-Session-Token
Body: { "fileName": "foto.jpg", "mimeType": "image/jpeg", "size": 102400, "purpose": "POST_IMAGE" }
Response 201: { "id": "media_...", "fileName": "...", "mimeType": "...", "size": ...,
                "cdnUrl": "https://ik.imagekit.io/socialcoisa/media/{id}/{fileName}",
                "uploadUrl": "https://ik.imagekit.io/socialcoisa/media/{id}/{fileName}",
                "purpose": "...", "status": "PENDING", "createdAt": "...", "expiresAt": "..." }
```

### Upload direto no ImageKit (passo 2 — frontend puro)

```js
// Exemplo com fetch
const formData = new FormData();
formData.append("file", fileBlob);
formData.append("fileName", fileName);
formData.append("publicKey", "public_0Y+bnNURFVY+XZuqyCWQGafHo/0=");

const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
  method: "POST",
  body: formData,
});
```

| Campo           | Valor                                                           |
| --------------- | --------------------------------------------------------------- |
| Upload endpoint | `https://upload.imagekit.io/api/v1/files/upload`                |
| Public key      | `public_0Y+bnNURFVY+XZuqyCWQGafHo/0=`                           |
| CDN URL pattern | `https://ik.imagekit.io/socialcoisa/media/{mediaId}/{fileName}` |

### Ver mídia

```text
GET /api/media/{mediaId}
Response 200: { "id": "...", "cdnUrl": "...", "status": "PENDING"|"UPLOADED"|"DELETED", ... }
```

### Deletar mídia

```text
DELETE /api/media/{mediaId}
Headers: X-User-Id, X-Session-Token
Response 200: { "id": "...", "status": "DELETE_REQUESTED" }
```

## Feed (Posts)

### Publicar post

```text
POST /api/feed/posts
Headers: X-User-Id, X-Session-Token
Body: { "type": "POST"|"REPOST"|"ARTICLE", "content": "...", "tags": ["tech"], "mediaIds": ["media_..."] }
Response 201: { "id": "post_...", ... }
```

Tipos de post: `POST` (texto+imagem), `ARTICLE` (artigo longo), `REPOST` (compartilhamento)

### Feed

```text
GET /api/feed?cursor=...&limit=20&tab=FOR_YOU
Headers: X-User-Id, X-Session-Token
Tabs: FOR_YOU, FOLLOWING, RECENT
Response: { "items": [...], "nextCursor": "..." }
```

### Posts de um perfil

```text
GET /api/users/{username}/posts?cursor=...&limit=20
Response: { "items": [...], "nextCursor": "..." }
```

### Deletar post

```text
DELETE /api/feed/posts/{postId}?reason=...
Headers: X-User-Id, X-Session-Token
Response 200: { "id": "...", "status": "DELETED" }
```

### Comentar

```text
POST /api/feed/posts/{postId}/comments
Headers: X-User-Id, X-Session-Token
Body: { "content": "...", "parentCommentId": null }
Response 201: { "id": "comment_...", ... }
```

### Ver comentários

```text
GET /api/feed/posts/{postId}/comments?cursor=...&limit=20
Response: { "items": [...], "nextCursor": "..." }
```

### Reagir (curtir etc)

```text
POST /api/feed/posts/{postId}/reactions
Body: { "type": "LIKE"|"LOVE"|"HAHA"|"WOW"|"SAD"|"ANGRY" }
Response 200: { "status": "REACTED" }

DELETE /api/feed/posts/{postId}/reactions   (remove reação)
Response 200: { "status": "UNREACTED" }
```

### Salvar post

```text
POST   /api/feed/posts/{postId}/saves       → { "status": "SAVED" }
DELETE /api/feed/posts/{postId}/saves       → { "status": "UNSAVED" }
```

### Compartilhar

```text
POST /api/feed/posts/{postId}/shares        → { "status": "SHARED" }
```

## Perfil

### Meu perfil

```text
GET /api/me
Headers: X-User-Id, X-Session-Token
Response: { "id": "...", "username": "...", "name": "...", "reputation": ..., ... }
```

### Perfil público por username

```text
GET /api/users/{username}
Response: { "id": "...", "username": "...", "name": "...", "headline": "...", ... }
```

### Perfil público por ID

```text
GET /api/users/by-id/{userId}
Response: { "id": "...", "username": "...", "name": "...", ... }
```

### Atualizar perfil

```text
PATCH /api/me/profile
Headers: X-User-Id, X-Session-Token
Body: { "name": "...", "headline": "...", "company": "...", "location": "...",
        "avatar": "...", "banner": "...", "bio": "...", "skills": [...],
        "goals": [...], "availability": "...", "portfolio": "...",
        "externalLinks": [...], "openToWork": true, "isMentor": false }
Response 200: perfil atualizado
```

### Experiências, Educação, Certificações

Cada um segue CRUD no padrão `/me/{section}` e `/me/{section}/{id}`:

| Recurso       | GET (lista)              | POST (criar)              | PUT (atualizar)               | DELETE                           |
| ------------- | ------------------------ | ------------------------- | ----------------------------- | -------------------------------- |
| Experiências  | `GET /me/experiences`    | `POST /me/experiences`    | `PUT /me/experiences/{id}`    | `DELETE /me/experiences/{id}`    |
| Educação      | `GET /me/education`      | `POST /me/education`      | `PUT /me/education/{id}`      | `DELETE /me/education/{id}`      |
| Certificações | `GET /me/certifications` | `POST /me/certifications` | `PUT /me/certifications/{id}` | `DELETE /me/certifications/{id}` |

Body exemplos:

```js
// Experiência
{ "title": "Desenvolvedor", "company": "Empresa", "location": "Remoto",
  "description": "...", "startDate": "2023-01-01", "endDate": null }

// Educação
{ "school": "USP", "degree": "Bacharel", "field": "Ciência da Computação",
  "description": "...", "startDate": "2018-01-01", "endDate": "2022-12-31" }

// Certificação
{ "name": "AWS Certified", "issuer": "Amazon", "description": "...",
  "issueDate": "2023-06-01", "expirationDate": "2026-06-01", "credentialUrl": "..." }
```

## Rede Social (Conexões)

### Sugestões de conexão

```text
GET /api/network/suggestions?limit=4
Headers: X-User-Id, X-Session-Token
Response: [{ "id": "...", "username": "...", "name": "...", "headline": "...", "avatar": "..." }]
```

### Resumo da rede

```text
GET /api/network/summary
Headers: X-User-Id, X-Session-Token
Response: { "userId": "...", "connections": 5, "followers": 0, "pendingRequests": 2 }
```

### Solicitações pendentes

```text
GET /api/network/requests?cursor=...&limit=20
Headers: X-User-Id, X-Session-Token
Response: { "items": [{ "id": "...", "fromUserId": "...", "toUserId": "...", "status": "PENDING", "createdAt": "..." }] }
```

### Conectar / Aceitar / Remover

```text
POST   /api/network/connections/{targetUserId}           → { "status": "REQUESTED" }
PUT    /api/network/connections/{targetUserId}/accept     → { "status": "ACCEPTED" }
DELETE /api/network/connections/{targetUserId}            → { "status": "REMOVED" }
```

## Vagas

Criar vaga exige reputação ≥ 300. Reputação máxima é 1000.

### Listar vagas

```text
GET /api/jobs?query=...&type=...&cursor=...&limit=20
Response: { "items": [{ "id": "...", "title": "...", "company": "...", "location": "...", ... }] }
```

### Ver vaga

```text
GET /api/jobs/{jobId}
```

### Criar vaga

```text
POST /api/jobs
Headers: X-User-Id, X-Session-Token
Body: { "title": "...", "company": "...", "logo": "...", "location": "...",
        "type": "CLT|PJ|INTERN|FREELANCE", "level": "JUNIOR|MID|SENIOR|LEAD",
        "salary": "R$ 5.000-8.000", "skills": ["Java", "Spring"] }
Response 201: { "id": "...", ... }
```

### Atualizar / Deletar vaga

```text
PUT    /api/jobs/{jobId}    (só o dono)
DELETE /api/jobs/{jobId}    (só o dono) → 204 No Content
```

### Candidatar-se / Salvar vaga

```text
POST   /api/jobs/{jobId}/applications  → { "status": "APPLIED" }
POST   /api/jobs/{jobId}/saves          → { "status": "SAVED" }
DELETE /api/jobs/{jobId}/saves          → { "status": "UNSAVED" }
```

## Mensagens

### Listar conversas

```text
GET /api/conversations?cursor=...&limit=20
Headers: X-User-Id, X-Session-Token
Response: { "items": [{ "id": "...", "kind": "DIRECT|GROUP", "title": "...", "participantIds": [...],
                        "lastMessage": "...", "unread": 0 }] }
```

### Pesquisar conversas

```text
GET /api/conversations/search?q=...
```

### Criar conversa

```text
POST /api/conversations
Body: { "kind": "DIRECT", "title": null, "participantIds": ["user_..."] }
Response 201: conversa criada
```

### Enviar mensagem

```text
POST /api/conversations/{conversationId}/messages
Body: { "text": "..." }
Response 201: { "id": "...", "conversationId": "...", "from": "...", "text": "...", "time": "..." }
```

### Listar mensagens

```text
GET /api/conversations/{conversationId}/messages?cursor=...&limit=50
Headers: X-User-Id, X-Session-Token
Response: { "items": [{ "id": "...", "conversationId": "...", "from": "...", "text": "...", "time": "..." }] }
```

### Marcar como lida

```text
POST /api/conversations/{conversationId}/read → { "status": "READ" }
```

## Notificações

### Listar

```text
GET /api/notifications?cursor=...&limit=20
Headers: X-User-Id, X-Session-Token
Response: { "items": [{ "id": "...", "kind": "...", "actorId": "...", "title": "...",
                        "body": "...", "createdAt": "...", "read": false, "href": "...", "ctaLabel": "..." }] }
```

### Marcar como lida / Ler todas

```text
POST /api/notifications/{notificationId}/read  → { "status": "READ" }
POST /api/notifications/read-all                → { "status": "ALL_READ" }
```

## Busca

```text
GET /api/search?q=...&types=USER,POST,JOB&limit=10
Response: { "items": [{ "id": "...", "type": "USER|POST|JOB", "title": "...",
                        "subtitle": "...", "image": "...", "href": "..." }] }
```

## Paginação com Cursor

Endpoints que retornam listas paginadas usam **cursor-based pagination**:

```text
GET /api/feed?cursor=&limit=20                    ← primeira página (cursor vazio)
GET /api/feed?cursor=eyJpZCI6InBvc3RfMTIzIn0&limit=20  ← próxima página

Response: { "items": [...], "nextCursor": "..." }
```

Use `nextCursor` da resposta como `cursor` da próxima requisição. Quando `nextCursor` for `null`, não há mais páginas.

## Tratamento de Erros

Erros seguem o padrão:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "...",
  "instance": "/api/..."
}
```

Códigos comuns:

| Status | Significado                                                     |
| ------ | --------------------------------------------------------------- |
| 400    | Dados inválidos                                                 |
| 401    | Não autenticado (X-User-Id ou X-Session-Token ausente/inválido) |
| 403    | Sem permissão (ex: reputação < 300 para criar vaga)             |
| 404    | Recurso não encontrado                                          |
| 409    | Conflito (ex: já candidatado)                                   |
| 429    | Rate limit excedido                                             |

## Idempotency-Key

Em operações de escrita (POST, PUT, DELETE), o header `Idempotency-Key` é opcional mas recomendado.

- Envie um UUID único na primeira chamada
- Se a requisição falhar (timeout, erro de rede), reenvie com a **mesma key**
- O backend retorna o resultado original, evitando duplicatas
- Keys expiram após o tempo de conclusão do comando

## Monitoramento

```text
GET  /actuator/health         → { "status": "UP" }
GET  /actuator/metrics        → métricas da aplicação
GET  /actuator/prometheus     → métricas no formato Prometheus
```

## Swagger / OpenAPI

```text
http://localhost:8081/swagger-ui.html
http://localhost:8081/api/openapi.json
```

O Swagger permite testar todos os endpoints interativamente. Para autenticação, use o botão "Authorize" ou preencha os headers manualmente na requisição.

## Resumo de Headers

| Header                           | Quando usar                 |
| -------------------------------- | --------------------------- |
| `X-User-Id`                      | Todas as rotas autenticadas |
| `X-Session-Token`                | Todas as rotas autenticadas |
| `Idempotency-Key`                | POST/PUT/DELETE (opcional)  |
| `Content-Type: application/json` | POST/PUT/PATCH com body     |
