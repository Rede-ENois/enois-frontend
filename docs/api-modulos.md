# Módulos de API

## Cliente HTTP (`src/lib/api-client.ts`)

Cliente central para comunicação com o backend em `https://rede.fly.dev/api`.

**Classes:**

- `ApiError` - Erro tipado com `status`, `code`, `message`

**Funções:**

| Função                                 | Descrição                                                  |
| -------------------------------------- | ---------------------------------------------------------- |
| `baseUrl()`                            | Retorna URL base da API (dev: `/api` proxy, prod: env var) |
| `getToken()`                           | Lê session_token do localStorage                           |
| `authHeaders()`                        | Monta headers com X-Session-Token                          |
| `idemKey()`                            | Gera Idempotency-Key (UUID)                                |
| `tryRefreshToken()`                    | Tenta refresh automático do token                          |
| `clearSession()`                       | Limpa dados de sessão do localStorage                      |
| `request<T>(method, path, body, opts)` | Requisição HTTP genérica com auth, retry, error handling   |
| `buildQuery(params)`                   | Constrói query string para paginação                       |

**Objeto `api`:**

- `api.get<T>(path)` - GET
- `api.post<T>(path, body)` - POST com idempotência
- `api.put<T>(path, body)` - PUT com idempotência
- `api.patch<T>(path, body)` - PATCH com idempotência
- `api.delete<T>(path)` - DELETE com idempotência

### Convenções

- `Content-Type: application/json` automático
- `X-Session-Token` para autenticação
- `Idempotency-Key` (UUID) em todas escritas
- Desenvelopamento de `CommandResponse` (`{ status, body }`)
- `PageResponse` com `items` + `nextCursor`
- Refresh automático em 401/403

---

## Módulo Auth (`src/lib/api/auth.ts`)

**Endpoint base:** `/auth`

| Método | Endpoint                          | Descrição                |
| ------ | --------------------------------- | ------------------------ |
| POST   | `/auth/signup`                    | Criar conta              |
| POST   | `/auth/login`                     | Login                    |
| POST   | `/auth/refresh`                   | Renovar token            |
| POST   | `/auth/logout`                    | Logout                   |
| GET    | `/auth/me`                        | Dados do usuário atual   |
| POST   | `/auth/password/forgot`           | Solicitar reset de senha |
| POST   | `/auth/password/reset`            | Resetar senha            |
| GET    | `/auth/oauth/{provider}/start`    | Iniciar OAuth            |
| GET    | `/auth/oauth/{provider}/callback` | Callback OAuth           |

---

## Módulo Onboarding (`src/lib/api/onboarding.ts`)

| Método | Endpoint                                            | Descrição                                      |
| ------ | --------------------------------------------------- | ---------------------------------------------- |
| GET    | `/me/onboarding/starter-pack?topics=A,B&skills=x,y` | Comunidades, grupos e pessoas sugeridos        |
| POST   | `/me/onboarding/complete`                           | Salva escolhas, entra e pede conexões; conclui |
| POST   | `/me/onboarding/skip`                               | Conclui sem escolher nada                      |

`/auth/me` traz `onboardingCompleted`; `false` leva a pessoa a `/boas-vindas` (ver `docs/rotas.md`).

---

## Módulo Streak (`src/lib/api/streak.ts`)

| Método | Endpoint     | Descrição                                                  |
| ------ | ------------ | ---------------------------------------------------------- |
| GET    | `/me/streak` | Sequência diária (dias, recorde, hoje, descanso da semana) |

`/carteira` também traz o mesmo objeto em `streak`. Toda mutação bem-sucedida invalida
`["me", "streak"]` (regra global em `createAppQueryClient`, `src/lib/query-client.ts`).

---

## Módulo Profile (`src/lib/api/profile.ts`)

**Endpoints:**

| Método | Endpoint            | Descrição                   |
| ------ | ------------------- | --------------------------- |
| GET    | `/me`               | Meu perfil                  |
| PATCH  | `/me/profile`       | Atualizar perfil            |
| GET    | `/users/{username}` | Perfil público por username |
| GET    | `/users/by-id/{id}` | Perfil por ID               |

**Experiências:**

| Método | Endpoint               | Descrição             |
| ------ | ---------------------- | --------------------- |
| GET    | `/me/experiences`      | Listar experiências   |
| POST   | `/me/experiences`      | Criar experiência     |
| PUT    | `/me/experiences/{id}` | Atualizar experiência |
| DELETE | `/me/experiences/{id}` | Excluir experiência   |

**Educação:** Mesmo padrão em `/me/education`

**Certificações:** Mesmo padrão em `/me/certifications`

---

## Módulo Feed (`src/lib/api/feed.ts`)

| Método | Endpoint                               | Descrição                                                                                                        |
| ------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GET    | `/feed`                                | Listar feed (cursor, limit, tab; com `tab=ALL`, `type` e `resolved`); a 1ª página de `FOR_YOU` traz `lastSeenAt` |
| POST   | `/feed/seen`                           | Avança o marcador "Você está em dia" (`seenUntil`)                                                               |
| POST   | `/feed/posts`                          | Criar post                                                                                                       |
| POST   | `/feed/posts/{postId}/accepted-answer` | Marcar a resposta aceita de uma dúvida                                                                           |
| DELETE | `/feed/posts/{postId}/accepted-answer` | Reabrir a dúvida                                                                                                 |
| DELETE | `/feed/posts/{postId}`                 | Excluir post                                                                                                     |
| POST   | `/feed/posts/bulk-delete`              | Excluir em lote                                                                                                  |
| GET    | `/feed/saved`                          | Posts salvos                                                                                                     |
| GET    | `/feed/posts/{postId}/reactions`       | Reações de um post                                                                                               |
| GET    | `/users/{username}/posts`              | Posts por username                                                                                               |
| GET    | `/users/{userId}/posts`                | Posts por ID                                                                                                     |

**Tipos de Post:** `INSIGHT`, `ARTICLE`, `QUESTION`, `PROJECT`, `OPPORTUNITY`

---

## Módulo Comments (`src/lib/api/comments.ts`)

| Método | Endpoint                                    | Descrição          |
| ------ | ------------------------------------------- | ------------------ |
| POST   | `/feed/posts/{postId}/comments`             | Criar comentário   |
| GET    | `/feed/posts/{postId}/comments`             | Listar comentários |
| DELETE | `/feed/posts/{postId}/comments/{commentId}` | Excluir comentário |

---

## Módulo Reactions (`src/lib/api/reactions.ts`)

**Tipos de Reação:** `LIKE`, `LOVE`, `LAUGH`, `WOW`, `SAD`, `CELEBRATE`, `SUPPORT`, `INSIGHTFUL`

| Método | Endpoint                                              | Descrição                    |
| ------ | ----------------------------------------------------- | ---------------------------- |
| POST   | `/feed/posts/{postId}/reactions`                      | Reagir                       |
| DELETE | `/feed/posts/{postId}/reactions`                      | Remover reação               |
| GET    | `/feed/posts/{postId}/reactions`                      | Listar reações               |
| POST   | `/feed/posts/{postId}/comments/{commentId}/reactions` | Reagir a comentário          |
| DELETE | `/feed/posts/{postId}/comments/{commentId}/reactions` | Remover reação de comentário |
| GET    | `/feed/posts/{postId}/comments/{commentId}/reactions` | Listar reações de comentário |
| POST   | `/feed/posts/{postId}/saves`                          | Salvar post                  |
| DELETE | `/feed/posts/{postId}/saves`                          | Remover save                 |
| POST   | `/feed/posts/{postId}/shares`                         | Compartilhar                 |

**Constante:** `REACTION_EMOJIS` - Mapa de tipo de reação para emoji

---

## Módulo Network (`src/lib/api/network.ts`)

| Método | Endpoint                                     | Descrição                                        |
| ------ | -------------------------------------------- | ------------------------------------------------ |
| GET    | `/network/users`                             | Listar conexões                                  |
| GET    | `/network/suggestions`                       | Sugestões de conexão                             |
| GET    | `/network/summary`                           | Resumo da rede                                   |
| GET    | `/network/requests`                          | Solicitações pendentes, com `direction` e `peer` |
| POST   | `/network/connections/{targetUserId}`        | Solicitar conexão                                |
| PUT    | `/network/connections/{targetUserId}/accept` | Aceitar conexão                                  |
| DELETE | `/network/connections/{targetUserId}`        | Remover conexão                                  |
| GET    | `/network/connections/{targetUserId}/status` | Status da conexão                                |

---

## Módulo Communities (`src/lib/api/communities.ts`)

| Método | Endpoint                    | Descrição                                                         |
| ------ | --------------------------- | ----------------------------------------------------------------- |
| GET    | `/communities`              | Listar comunidades (`topic`, `q`, `city` + `state` ou só `state`) |
| GET    | `/communities/local`        | Perto de você (cidade do próprio perfil, pede sessão)             |
| GET    | `/communities/{id}`         | Detalhar comunidade                                               |
| POST   | `/communities`              | Criar comunidade                                                  |
| PATCH  | `/communities/{id}`         | Atualizar comunidade                                              |
| POST   | `/communities/{id}/members` | Entrar                                                            |
| DELETE | `/communities/{id}/members` | Sair                                                              |
| GET    | `/communities/{id}/members` | Listar membros                                                    |
| GET    | `/communities/{id}/feed`    | Feed da comunidade                                                |

Cidade e UF (comunidade, perfil e evento) seguem a regra do backend: as duas juntas ou nenhuma, UF
entre as 27, cidade até 80 caracteres. Os formulários validam antes com `validateCityState` do DS e
mostram os códigos `CITY_STATE_INCOMPLETE`, `INVALID_STATE` e `CITY_TOO_LONG` embaixo do campo
(`src/lib/use-city-state.ts`). No PATCH, as duas vazias limpam.

---

## Módulo Events (`src/lib/api/events.ts`)

| Método | Endpoint                  | Descrição                                                                      |
| ------ | ------------------------- | ------------------------------------------------------------------------------ |
| GET    | `/events`                 | Listar eventos (`attending` do viewer com sessão; `recurring=true` só rituais) |
| GET    | `/events/{id}`            | Detalhar evento (`attending` do viewer com sessão)                             |
| POST   | `/events`                 | Criar evento (`recurrence` opcional; recorrente exige horário)                 |
| PATCH  | `/events/{id}/recurrence` | Mudar ou encerrar a recorrência (só quem criou)                                |
| POST   | `/events/{id}/attendees`  | Confirmar presença                                                             |
| DELETE | `/events/{id}/attendees`  | Cancelar presença                                                              |

---

## Módulo Study pairs (`src/lib/api/study-pairs.ts`)

| Método | Endpoint                         | Descrição                                              |
| ------ | -------------------------------- | ------------------------------------------------------ |
| POST   | `/study-pairs/requests`          | Pedir um par (`{goal, topic}`)                         |
| DELETE | `/study-pairs/requests/current`  | Cancelar o pedido aberto                               |
| GET    | `/study-pairs/me`                | Pedido aberto, pares e check-ins das últimas 4 semanas |
| POST   | `/study-pairs/{pairId}/checkins` | Check-in da semana (`{note}`)                          |
| POST   | `/study-pairs/{pairId}/end`      | Encerrar o par                                         |
| GET    | `/study-pairs/goals/popular`     | Objetivos com pedidos abertos                          |

---

## Módulo Jobs (`src/lib/api/jobs.ts`)

| Método | Endpoint                  | Descrição                                                    |
| ------ | ------------------------- | ------------------------------------------------------------ |
| GET    | `/jobs`                   | Listar vagas (filtros: query, type, level, location, skills) |
| GET    | `/jobs/{id}`              | Detalhar vaga                                                |
| POST   | `/jobs/{id}/applications` | Candidatar-se                                                |
| POST   | `/jobs/{id}/saves`        | Salvar vaga                                                  |
| DELETE | `/jobs/{id}/saves`        | Remover vaga salva                                           |

---

## Módulo Companies (`src/lib/api/companies.ts`)

| Método | Endpoint                                            | Descrição                                                                         |
| ------ | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| GET    | `/empresas/diretorio`                               | Diretório: páginas primeiro, depois nomes que só existem em vagas (query, sector) |
| GET    | `/empresas/setores`                                 | Setores das páginas ativas (filtro do diretório)                                  |
| GET    | `/empresa/{slug}`                                   | Página da empresa com papel, seguir, vagas, microprojetos e avaliações            |
| POST   | `/empresas`                                         | Criar página                                                                      |
| PATCH  | `/empresas/{id}`                                    | Editar página                                                                     |
| GET    | `/empresas/mine`                                    | Páginas de que a pessoa faz parte                                                 |
| POST   | `/empresas/{id}/follow`                             | Seguir (DELETE deixa de seguir)                                                   |
| GET    | `/empresas/{id}/members`                            | Equipe (POST adiciona)                                                            |
| POST   | `/empresas/{id}/microprojetos`                      | Publicar microprojeto                                                             |
| GET    | `/microprojetos/{id}`                               | Microprojeto com propostas (só a equipe vê as propostas)                          |
| PUT    | `/microprojetos/{id}`                               | Editar microprojeto aberto sem candidaturas (EDITOR ou superior)                |
| DELETE | `/microprojetos/{id}`                               | Remover da vitrine microprojeto aberto sem candidaturas, mantendo o histórico      |
| POST   | `/microprojetos/{id}/proposals`                     | Enviar proposta pela identidade profissional; devolve a conversa                  |
| POST   | `/microprojetos/{id}/proposals/{proposalId}/select` | Escolher a proposta                                                               |
| POST   | `/microprojetos/{id}/complete`                      | Concluir com avaliação opcional (nota e texto)                                    |

---

## Módulo Mentors (`src/lib/api/mentors.ts`)

| Método | Endpoint                 | Descrição             |
| ------ | ------------------------ | --------------------- |
| GET    | `/mentors`               | Listar mentores       |
| GET    | `/mentors/{id}`          | Detalhar mentor       |
| POST   | `/mentors`               | Registrar como mentor |
| PATCH  | `/mentors/{id}`          | Atualizar mentor      |
| DELETE | `/mentors/{id}`          | Remover mentor        |
| GET    | `/mentors/{id}/slots`    | Horários disponíveis  |
| POST   | `/mentors/{id}/slots`    | Criar horário         |
| POST   | `/mentors/{id}/sessions` | Agendar sessão        |

---

## Módulo Messages (`src/lib/api/messages.ts`)

| Método | Endpoint                       | Descrição         |
| ------ | ------------------------------ | ----------------- |
| GET    | `/conversations`               | Listar conversas  |
| POST   | `/conversations`               | Criar conversa    |
| GET    | `/conversations/{id}`          | Detalhar conversa |
| GET    | `/conversations/{id}/messages` | Listar mensagens  |
| POST   | `/conversations/{id}/messages` | Enviar mensagem   |
| POST   | `/conversations/{id}/read`     | Marcar como lida  |
| GET    | `/conversations/search`        | Buscar conversas  |

---

## Módulo Notifications (`src/lib/api/notifications.ts`)

| Método | Endpoint                       | Descrição                                   |
| ------ | ------------------------------ | ------------------------------------------- |
| GET    | `/notifications`               | Listar notificações                         |
| POST   | `/notifications/{id}/read`     | Marcar como lida                            |
| POST   | `/notifications/read-all`      | Marcar todas como lidas                     |
| GET    | `/me/notification-preferences` | Resumo semanal e categorias de push         |
| PUT    | `/me/notification-preferences` | Atualização parcial (só os campos enviados) |

---

## Módulo Media (`src/lib/api/media.ts`)

**Integração ImageKit:** As imagens são servidas via CDN ImageKit.

| Método | Endpoint                         | Descrição                   |
| ------ | -------------------------------- | --------------------------- |
| POST   | `/media/uploads`                 | Solicitar upload            |
| GET    | `/media/{id}`                    | Obter metadados             |
| DELETE | `/media/{id}`                    | Solicitar deleção           |
| -      | `uploadToImageKit(cdnUrl, file)` | Upload direto para ImageKit |

**Função auxiliar:**

- `resolveCdnUrl(url)` - Resolve URL do CDN (adiciona prefixo ImageKit se necessário)

---

## Módulo Search (`src/lib/api/search.ts`)

| Método | Endpoint  | Descrição                                       |
| ------ | --------- | ----------------------------------------------- |
| GET    | `/search` | Busca global (users, communities, jobs, events) |

---

## Módulo Ranking (`src/lib/api/ranking.ts`)

| Método | Endpoint           | Descrição            |
| ------ | ------------------ | -------------------- |
| GET    | `/profile/ranking` | Ranking de reputação |

---

## Módulo Reports (`src/lib/api/reports.ts`)

| Método | Endpoint   | Descrição                                |
| ------ | ---------- | ---------------------------------------- |
| POST   | `/reports` | Denunciar conteúdo (POST, COMMENT, USER) |

**Motivos:** AI_GENERATED, FAKE_CONTENT, SCAM, DISCRIMINATION, PREJUDICE, HARASSMENT, SPAM, VIOLENCE, COPYRIGHT, OTHER

---

## Módulo Recommendations (`src/lib/api/recommendations.ts`)

| Método | Endpoint                             | Descrição               |
| ------ | ------------------------------------ | ----------------------- |
| POST   | `/recommendations/{targetId}`        | Criar recomendação      |
| GET    | `/recommendations/received/{userId}` | Recomendações recebidas |

---

## Módulo Users (`src/lib/api/users.ts`)

| Método | Endpoint        | Descrição                       |
| ------ | --------------- | ------------------------------- |
| GET    | `/users/search` | Buscar usuários (para @menções) |
