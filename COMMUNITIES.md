# Comunidades — Guia do Frontend

## Visão Geral

Comunidades funcionam como **grupos**. É preciso entrar para interagir.

- Qualquer um pode **criar** uma comunidade (quem cria vira ADMIN)
- Qualquer um pode **ver** as comunidades (público)
- Só **membros** podem ver o feed interno e interagir
- Membros são listados com username/avatar pra conectar

---

## Listar comunidades

```text
GET /api/communities?topic=TECNOLOGIA&limit=20
Response: { "items": [{ "id": "community_...", "name": "Devs BR", "description": "...",
                        "members": 42, "topic": "TECNOLOGIA", "cover": "https://...",
                        "joined": false }] }
```

| Parâmetro | Obrigatório | Descrição          |
| --------- | ----------- | ------------------ |
| `topic`   | Não         | Filtra por tópico  |
| `limit`   | Não         | Máx 50, default 20 |

- Usuário **não logado** pode ver (sem headers)
- `joined` = `true` se o usuário logado é membro
- A lista é pública

**Tela:** Grid/cards de comunidades, com nome, descrição, membros, imagem de capa e botão "Entrar" se `joined=false`.

---

## Ver comunidade

```text
GET /api/communities/{communityId}
Response: { "id": "...", "name": "...", "description": "...", "members": 42,
            "topic": "...", "cover": "...", "joined": true }
```

**Tela:** Página da comunidade com header (capa, nome, membros), botão "Entrar"/"Sair", feed da comunidade e lista de membros.

---

## Criar comunidade

```text
POST /api/communities
Headers: X-User-Id, X-Session-Token
Body: { "name": "Devs BR", "description": "Comunidade de devs",
        "topic": "TECNOLOGIA", "cover": "https://ik.imagekit.io/socialcoisa/..." }
Response 201: { "id": "community_...", "name": "Devs BR", "description": "...",
                "members": 1, "topic": "TECNOLOGIA", "cover": "...", "joined": true }
```

| Campo         | Obrigatório | Descrição                   |
| ------------- | ----------- | --------------------------- |
| `name`        | Sim         | Nome da comunidade          |
| `description` | Sim         | Descrição (até 2000 chars)  |
| `topic`       | Não         | Tópico pra categorizar      |
| `cover`       | Não         | URL da imagem de capa (CDN) |

- Quem cria é automaticamente `ADMIN`
- Só ADMIN pode editar a comunidade

**Tela:** Formulário com campos name, description, topic (select), cover (upload de imagem → CDN).

---

## Editar comunidade

```text
PATCH /api/communities/{communityId}
Headers: X-User-Id, X-Session-Token
Body: { "name": "...", "description": "...", "topic": "...", "cover": "..." }
Response 200: { "id": "...", "name": "...", "description": "...", "members": ...,
                "topic": "...", "cover": "...", "joined": true }
```

- Só o **criador** (ADMIN) pode editar
- 403 se não for o dono

**Tela:** Mesmo formulário de criação, pré-preenchido. Disponível apenas pro ADMIN.

---

## Entrar na comunidade

```text
POST /api/communities/{communityId}/members
Headers: X-User-Id, X-Session-Token
Response: { "id": "{communityId}", "status": "JOINED" }
```

| Erro               | Significado |
| ------------------ | ----------- |
| 409 ALREADY_MEMBER | Já é membro |

**Tela:** Botão "Entrar" no card/header da comunidade. Vira "Sair" após entrar.

---

## Sair da comunidade

```text
DELETE /api/communities/{communityId}/members
Headers: X-User-Id, X-Session-Token
Response: { "id": "{communityId}", "status": "LEFT" }
```

| Erro           | Significado  |
| -------------- | ------------ |
| 404 NOT_MEMBER | Não é membro |

---

## Membros da comunidade

```text
GET /api/communities/{communityId}/members
Headers: X-User-Id, X-Session-Token
Response: { "items": [
    { "userId": "user_...", "username": "joao", "name": "João Silva",
      "avatar": "https://...", "role": "ADMIN" },
    { "userId": "user_...", "username": "maria", "name": "Maria Souza",
      "avatar": "https://...", "role": "MEMBER" }
] }
```

| Campo      | Descrição                                          |
| ---------- | -------------------------------------------------- |
| `userId`   | UUID do usuário (pra linkar ao perfil ou conectar) |
| `username` | Username (pra link: `/perfil/{username}`)          |
| `name`     | Nome de exibição                                   |
| `avatar`   | URL do avatar                                      |
| `role`     | `ADMIN` (criador) ou `MEMBER`                      |

- Qualquer um logado pode ver os membros
- Usar `userId` pra conectar: `POST /api/network/connections/{userId}`

**Tela:** Lista de membros com avatar, nome, username e botão "Conectar" (via `POST /api/network/connections/{userId}`). Destaque pro ADMIN.

---

## Feed da comunidade (posts)

```text
GET /api/communities/{communityId}/feed?cursor=...&limit=20
Response: { "items": [
    { "id": "post_...", "authorId": "user_...", "authorUsername": "joao",
      "authorName": "João Silva", "authorAvatar": "https://...",
      "type": "INSIGHT", "content": "Conteúdo do post",
      "tags": ["java"], "mediaIds": ["media_..."],
      "createdAt": "2025-08-15T19:00:00Z",
      "counters": { "reactions": 5, "comments": 2, "saves": 1, "shares": 0 },
      "communityId": "community_..." }
], "nextCursor": "..." }
```

| Parâmetro | Descrição                                     |
| --------- | --------------------------------------------- |
| `cursor`  | Cursor da paginação (vazio = primeira página) |
| `limit`   | Máx 50, default 20                            |

| Campo do post    | Descrição                                                  |
| ---------------- | ---------------------------------------------------------- |
| `authorUsername` | Username do autor (link: `/perfil/{authorUsername}`)       |
| `authorName`     | Nome do autor                                              |
| `authorAvatar`   | Avatar do autor                                            |
| `type`           | `INSIGHT`, `ARTICLE`, `QUESTION`, `PROJECT`, `OPPORTUNITY` |
| `counters`       | `reactions`, `comments`, `saves`, `shares`                 |
| `communityId`    | ID da comunidade (sempre presente no feed da comunidade)   |

- Paginação por cursor: use `nextCursor` na próxima request
- `nextCursor` = `null` = não tem mais páginas
- O post tem os mesmos campos do feed normal, mas filtrado pela comunidade

**Tela:** Feed estilo timeline com posts da comunidade. Cada post mostra autor (avatar+nome, link pro perfil), conteúdo, mídia, tags, contadores (curtir, comentar, salvar, compartilhar). Input pra criar novo post no topo.

---

## Postar na comunidade

```text
POST /api/feed/posts
Headers: X-User-Id, X-Session-Token
Body: { "type": "INSIGHT", "content": "Conteúdo do post",
        "tags": ["java"], "mediaIds": ["media_..."],
        "communityId": "community_..." }
Response 201: { "id": "post_...", "authorId": "user_...", ... }
```

| Campo         | Obrigatório | Descrição                                                  |
| ------------- | ----------- | ---------------------------------------------------------- |
| `type`        | Sim         | `INSIGHT`, `ARTICLE`, `QUESTION`, `PROJECT`, `OPPORTUNITY` |
| `content`     | Sim         | Texto do post (max 1024 chars)                             |
| `tags`        | Não         | Lista de tags (max 5)                                      |
| `mediaIds`    | Não         | Lista de media IDs do ImageKit (max 5)                     |
| `communityId` | Não         | ID da comunidade (null = post no feed global)              |

- Se `communityId` for enviado, o post aparece no feed da comunidade
- Se não for enviado, post normal no feed global
- As interações (curtir, comentar, salvar, compartilhar) usam os mesmos endpoints do feed global

**Tela:** Formulário de novo post com campo de texto, seleção de tipo, upload de mídia, e indicador visual de que está postando na comunidade atual.

---

## Interagir com posts da comunidade

Os endpoints de interação são os mesmos do feed global:

| Ação            | Endpoint                                    |
| --------------- | ------------------------------------------- |
| Curtir/Reagir   | `POST /api/feed/posts/{postId}/reactions`   |
| Remover reação  | `DELETE /api/feed/posts/{postId}/reactions` |
| Comentar        | `POST /api/feed/posts/{postId}/comments`    |
| Ver comentários | `GET /api/feed/posts/{postId}/comments`     |
| Salvar          | `POST /api/feed/posts/{postId}/saves`       |
| Remover save    | `DELETE /api/feed/posts/{postId}/saves`     |
| Compartilhar    | `POST /api/feed/posts/{postId}/shares`      |
| Deletar post    | `DELETE /api/feed/posts/{postId}`           |

---

## Resumo dos endpoints de comunidade

| Método | Path                            | Autenticação | Descrição          |
| ------ | ------------------------------- | ------------ | ------------------ |
| GET    | `/api/communities`              | Opcional     | Listar comunidades |
| GET    | `/api/communities/{id}`         | Opcional     | Ver comunidade     |
| POST   | `/api/communities`              | Obrigatória  | Criar comunidade   |
| PATCH  | `/api/communities/{id}`         | Obrigatória  | Editar (só ADMIN)  |
| POST   | `/api/communities/{id}/members` | Obrigatória  | Entrar             |
| DELETE | `/api/communities/{id}/members` | Obrigatória  | Sair               |
| GET    | `/api/communities/{id}/members` | Obrigatória  | Listar membros     |
| GET    | `/api/communities/{id}/feed`    | Opcional     | Feed da comunidade |
