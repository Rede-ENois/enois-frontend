# Implementações necessárias no backend

## 1. Avatar da comunidade

Adicionar campo `avatar` (String, opcional) no `Community`.

**Modelo:**

```java
private String avatar; // URL da imagem de perfil da comunidade (CDN)
```

**Response atualizado (`GET /api/communities` e `GET /api/communities/{id}`):**

```json
{
  "id": "community_...",
  "name": "Devs BR",
  "description": "...",
  "topic": "TECNOLOGIA",
  "members": 42,
  "cover": "https://...",
  "avatar": "https://...",
  "joined": false
}
```

**Create/Update (`POST` / `PATCH`):**

```json
{
  "name": "...",
  "description": "...",
  "topic": "...",
  "cover": "https://...",
  "avatar": "https://..."
}
```

## 2. Feed da comunidade retornando 200 mas vazio

**Endpoint:** `GET /api/communities/{communityId}/feed`

**Comportamento atual:** retorna `200 OK` com `{"items":[],"nextCursor":null}` mesmo quando existem posts na comunidade.

**Provável causa:** o feed está filtrando por um campo errado ou o `communityId` não está sendo salvo corretamente nos posts ao criar via `POST /api/feed/posts`.

**Passos pra debug:**

1. Criar um post com `communityId: "community_xxx"` via `POST /api/feed/posts`
2. Verificar se o post foi salvo no banco com o `communityId` correto
3. Chamar `GET /api/communities/{communityId}/feed` e verificar a query
4. Verificar se o controller/filtro do feed da comunidade está usando o mesmo campo que o repository

**Sugestão de query (Spring Data JPA):**

```java
@Query("SELECT p FROM Post p WHERE p.communityId = :communityId ORDER BY p.createdAt DESC")
Page<Post> findByCommunityId(@Param("communityId") String communityId, Pageable pageable);
```

## 3. Members endpoint

**Endpoint:** `GET /api/communities/{communityId}/members`

Já implementado? Precisa retornar:

```json
{
  "items": [
    {
      "userId": "user_...",
      "username": "joao",
      "name": "João",
      "avatar": "https://...",
      "role": "ADMIN"
    }
  ]
}
```

O frontend usa `role` pra exibir badge ADMIN e permitir edição da comunidade.

## 4. Criar vaga

**Endpoint:** `POST /api/jobs`

**Regra de negócio:** só pode publicar quem tem reputação `>= 150`. O front já aplica
esse gate na interface, mas o backend precisa recusar com `403` (ou `422`) quem não
atinge o mínimo.

**Request:**

```json
{
  "title": "Pessoa Desenvolvedora Back-end",
  "company": "Énóis",
  "location": "Remoto",
  "type": "CLT",
  "level": "SENIOR",
  "salary": "R$ 12.000",
  "skills": ["Java", "Spring"],
  "description": "Responsabilidades e requisitos..."
}
```

**Response:** o `Job` criado, com `authorId`, `authorName` e `authorReputation`.

## 5. Denúncia de vaga falsa zera a reputação

**Endpoint:** `POST /api/reports` com `targetType: "JOB"`.

O `ReportInput.targetType` agora aceita `"JOB"` além de `POST`, `COMMENT` e `USER`.

**Regra de negócio:** quando a moderação confirmar que a vaga é falsa
(`reason: "FAKE_CONTENT"`), o autor perde **toda** a reputação acumulada
(`reputation = 0`). O front avisa o denunciante sobre essa consequência antes de
enviar. Enquanto a denúncia não é confirmada, nada muda para o autor.

Sugestão: marcar a vaga com `isFake: true` na resposta (`GET /api/jobs`), o front
exibe o selo "Vaga marcada como falsa".

## 6. Trocar e-mail

**Endpoint:** `POST /api/auth/email/change`

**Request:**

```json
{
  "email": "novo@exemplo.com",
  "password": "senha-atual"
}
```

Valida a senha atual antes de trocar (o front já pede a confirmação). Recusar com
`409` se o e-mail já estiver em uso por outra conta; o front mostra a mensagem
retornada pelo backend.

## 7. Cadastro pelo Google quando a conta já existe

**Endpoint:** `GET /api/auth/oauth/{provider}/start?mode=login|signup`

O front agora manda `mode` para dizer se a pessoa está **entrando** (`login`) ou
**criando conta** (`signup`). Antes o backend não tinha como saber, então quem
tentava criar conta com um e-mail que já existia acabava entrando na conta antiga
sem entender o que aconteceu.

**Comportamento pedido no `signup`:** se já existe conta com o e-mail retornado
pelo Google, não entrar na conta existente — finalizar o OAuth redirecionando para

```text
/auth/callback?error=ACCOUNT_EXISTS_LINK_REQUIRED
```

O front já trata esse código (`src/routes/auth.callback.tsx`) e mostra:
"Essa conta já existe. Você não pode criar outra com o mesmo e-mail — entre com a
senha que você já usa; depois, se quiser, vincule o Google pelo seu perfil."

No `login`, o comportamento continua o de sempre (entra na conta existente).

Se preferir outro código de erro, é só avisar: a lista de códigos reconhecidos
está em `errorMessage()` naquele arquivo.
