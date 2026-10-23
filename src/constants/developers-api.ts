import type { ApiEndpoint } from "@/types/application/developers/api-endpoint";
import type { ApiSection } from "@/types/application/developers/api-section";
import type { ApiUseCase } from "@/types/application/developers/api-use-case";

/**
 * Catalogo da API publica do Énóis, usado pela pagina /developers.
 *
 * Conteudo tecnico de proposito fora do texts.ts (e referencia de engenharia, nao copy de
 * interface). O FORMATO das respostas e real (capturado da producao), mas os DADOS sao
 * sinteticos: esta pagina e publica, e nome/id/post de pessoa real nao pode ficar exposto.
 * Manter em sincronia com os controllers do backend: cada bloco novo de API entra aqui.
 */

const P = "https://enois-api-qa.b7cloud.tech/api";

export const API_BASE_URL = P;

/**
 * Base versionada: as mesmas rotas, com o endereco fixo. O backend reescreve `/api/v1/...` para o
 * mesmo handler de `/api/...` (a resposta e a mesma), e `GET /api/v1` devolve o indice da versao
 * gerado do proprio servidor.
 */
export const API_V1_BASE_URL = `${P}/v1`;

export const apiSections: ApiSection[] = [
  {
    id: "auth",
    title: "Autenticação e conta",
    description:
      "A sessão do Énóis é o mesmo token que o app usa. Cadastro nasce pendente de confirmação de e-mail; login responde o token que autentica todas as outras rotas pelo header X-Session-Token. Contas com segundo fator respondem um desafio (202) em vez do token.",
    endpoints: [
      {
        method: "POST",
        path: "/auth/signup",
        access: "public",
        description:
          "Cria a conta (18+, termos aceitos). O cadastro não emite sessão: envia e-mail de confirmação.",
        request: `curl -X POST ${P}/auth/signup \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: signup-1" \\
  -d '{"name":"Ada","email":"ada@exemplo.com","password":"senha-forte-1","acceptedTerms":true}'`,
        response: `201 Created
{"id":"user_…","email":"ada@exemplo.com","emailVerified":false}`,
      },
      {
        method: "POST",
        path: "/auth/email/verify",
        access: "public",
        description:
          "Confirma o e-mail com o token do link recebido. Depois disso o login funciona.",
        request: `curl -X POST ${P}/auth/email/verify \\
  -H "Content-Type: application/json" \\
  -d '{"token":"<token-do-email>"}'`,
      },
      {
        method: "POST",
        path: "/auth/login",
        access: "public",
        description:
          "Autentica com e-mail e senha e devolve a sessão. Com 2FA ativo, devolve 202 + desafio (conclua em /auth/2fa/verify).",
        request: `curl -X POST ${P}/auth/login \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: login-1" \\
  -d '{"email":"ada@exemplo.com","password":"senha-forte-1"}'`,
        response: `200 OK
{"token":"sess_…","refreshToken":"…","user":{"id":"user_…","name":"Ada","username":"ada"}}`,
      },
      {
        method: "POST",
        path: "/auth/2fa/verify",
        access: "public",
        description: "Conclui o login com o código do segundo fator (app autenticador ou e-mail).",
        request: `curl -X POST ${P}/auth/2fa/verify \\
  -H "Content-Type: application/json" \\
  -d '{"challengeId":"<challengeId do login>","code":"123456"}'`,
        response: `200 OK
{"token":"sess_…","refreshToken":"…"} `,
      },
      {
        method: "POST",
        path: "/auth/logout",
        access: "auth",
        description: "Encerra a sessão atual.",
      },
      {
        method: "GET",
        path: "/me",
        access: "auth",
        description:
          "Perfil próprio: dados completos, reputação, estado de verificação e preferências.",
      },
    ],
  },
  {
    id: "feed",
    title: "Feed e publicações",
    description:
      "Leitura de publicação e comentários é pública (links compartilhados abrem sem conta). Escrever exige sessão. Posts podem ter mídia (mediaIds) e página em HTML (type PAGE, pageHtml) — a página renderiza em quadro isolado, sem script.",
    endpoints: [
      {
        method: "GET",
        path: "/feed",
        access: "auth",
        description:
          "Feed pessoal por aba: FOR_YOU (comunidades que você participa + posts fora de comunidade), FOLLOWING, ALL, DISCUSSIONS, RECENT, PROJECTS. Pagina por cursor.",
        request: `curl "${P}/feed?tab=FOR_YOU&limit=20" \\
  -H "X-Session-Token: $TOKEN"`,
        response: `200 OK
{"items":[{"id":"post_…","type":"INSIGHT","content":"…","counters":{"reactions":26,"comments":23,"saves":3,"shares":4},"createdAt":"2026-10-15T02:16:48Z"}],"nextCursor":"2026-10-15T02:16:48Z"}`,
      },
      {
        method: "GET",
        path: "/feed/posts/{postId}",
        access: "public",
        description: "Publicação completa: autor, contadores, mídia, comunidade (quando houver).",
        request: `curl ${P}/feed/posts/post_0f1e2d3c4b5a69788796a5b4c3d2e1f0`,
        response: `200 OK
{"id":"post_0f1e2d3c…","authorId":"user_…","authorUsername":"ada",
 "type":"INSIGHT","content":"Texto de exemplo do formato de uma publicacao.","tags":[],"mediaIds":[],
 "createdAt":"2026-10-15T02:16:48Z",
 "counters":{"reactions":26,"comments":23,"saves":3,"shares":4},
 "currentUserReaction":null,"communityId":null,"community":null}`,
      },
      {
        method: "GET",
        path: "/users/{username}/posts",
        access: "public",
        description: "Publicações de uma pessoa (perfil público).",
        request: `curl "${P}/users/ada/posts?limit=10"`,
      },
      {
        method: "POST",
        path: "/feed/posts",
        access: "auth",
        description:
          "Publica. type: INSIGHT | QUESTION | PROJECT | PAGE. Média vai por mediaIds (ver Mídia); PAGE leva pageHtml. Em comunidades, mande communityId.",
        request: `curl -X POST ${P}/feed/posts \\
  -H "X-Session-Token: $TOKEN" -H "Idempotency-Key: post-1" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"INSIGHT","content":"Texto do post","tags":["java"],"mediaIds":[],"mentionedUserIds":[]}'`,
        response: `201 Created
{"id":"post_…","content":"Texto do post","createdAt":"…"}`,
      },
      {
        method: "PATCH",
        path: "/feed/posts/{postId}",
        access: "auth",
        description: "Edita o próprio post (marca como editado).",
      },
      {
        method: "DELETE",
        path: "/feed/posts/{postId}",
        access: "auth",
        description:
          "Exclui o próprio post (soft delete). POST /feed/posts/{postId}/restore desfaz; bulk-delete para vários.",
      },
      {
        method: "POST",
        path: "/feed/posts/{postId}/comments",
        access: "auth",
        description:
          "Comenta. Para responder, mande parentCommentId. Aceita até 4 mídias (mediaIds) — comentário pode ser só de mídia.",
        request: `curl -X POST ${P}/feed/posts/$POST_ID/comments \\
  -H "X-Session-Token: $TOKEN" -H "Idempotency-Key: c-1" \\
  -H "Content-Type: application/json" \\
  -d '{"content":"Concordo!","parentCommentId":null,"mediaIds":[],"mentionedUserIds":[]}'`,
        response: `201 Created
{"id":"comment_…","postId":"post_…","content":"Concordo!","mediaIds":[],"createdAt":"…"}`,
      },
      {
        method: "GET",
        path: "/feed/posts/{postId}/comments",
        access: "public",
        description:
          "Comentários (mais recentes primeiro), com respostas aninhadas por parentCommentId.",
        request: `curl "${P}/feed/posts/$POST_ID/comments?limit=20"`,
        response: `200 OK
{"items":[{"id":"comment_…","authorUsername":"ada",
  "content":"Comentario de exemplo do formato de resposta.","mediaIds":[],"createdAt":"2026-10-15T22:03:52Z"}],
 "nextCursor":"2026-10-15T22:03:52Z"}`,
      },
      {
        method: "POST",
        path: "/feed/posts/{postId}/reactions",
        access: "auth",
        description:
          "Reage ao post. Tipos: LIKE, LOVE, LAUGH, ROFL, WOW, SAD, ANGRY, DISGUST, SKEPTICAL, CELEBRATE, SUPPORT, INSIGHTFUL. Reagir de novo troca o tipo; DELETE remove. Mesmos verbos em …/comments/{commentId}/reactions.",
        request: `curl -X POST ${P}/feed/posts/$POST_ID/reactions \\
  -H "X-Session-Token: $TOKEN" -H "Idempotency-Key: r-1" \\
  -H "Content-Type: application/json" -d '{"type":"INSIGHTFUL"}'`,
      },
      {
        method: "GET",
        path: "/feed/posts/{postId}/reactions",
        access: "public",
        description: "Totais por tipo de reação.",
      },
      {
        method: "POST",
        path: "/feed/posts/{postId}/saves",
        access: "auth",
        description: "Salva o post (DELETE remove). Lista em GET /feed/saved.",
      },
      {
        method: "POST",
        path: "/feed/posts/{postId}/shares",
        access: "auth",
        description: "Registra compartilhamento (contador).",
      },
    ],
  },
  {
    id: "busca",
    title: "Busca",
    description: "Busca unificada por pessoas, publicações, comunidades e vagas.",
    endpoints: [
      {
        method: "GET",
        path: "/search",
        access: "public",
        description:
          "Busca por termo livre. Cada item tem type (users, posts, communities, jobs) e pode ser filtrado/roteado pelo cliente.",
        request: `curl "${P}/search?q=java&limit=10"`,
        response: `200 OK
{"items":[{"id":"user_…","type":"users","title":"JavaScript-chan","subtitle":"…","image":"…"}],
 "nextCursor":null}`,
      },
    ],
  },
  {
    id: "perfis",
    title: "Perfis e ranking",
    description:
      "Perfis públicos com experiência, formação, certificações e emblema. O ranking é calculado pela plataforma (reputação/atividade) e é público.",
    endpoints: [
      {
        method: "GET",
        path: "/users/{username}",
        access: "public",
        description:
          "Perfil público: headline, empresa, skills, experiências, emblema, capa em HTML (bannerHtml).",
        request: `curl ${P}/users/ada`,
        response: `200 OK
{"id":"user_…","username":"ada","name":"Ada",
 "headline":"…","company":"…","skills":[…],"bioHtml":null,"bannerHtml":null,"openToWork":false}`,
      },
      {
        method: "GET",
        path: "/users/by-id/{userId}",
        access: "public",
        description: "Perfil por id.",
      },
      {
        method: "GET",
        path: "/profile/ranking",
        access: "public",
        description: "Ranking de perfis mais relevantes da rede.",
        request: `curl ${P}/profile/ranking`,
        response: `200 OK
[{"id":"user_…","username":"ada","name":"Ada","skills":[…]}]`,
      },
      {
        method: "PATCH",
        path: "/me/profile",
        access: "auth",
        description:
          "Edita o próprio perfil (nome, headline, skills, bio, bioHtml, bannerHtml, emblema…). Experiências, educação e certificações têm CRUD próprio em /me/experiences, /me/education, /me/certifications.",
      },
    ],
  },
  {
    id: "comunidades",
    title: "Comunidades",
    description:
      "Listagem, detalhe e feed de comunidade são públicos; entrar, publicar e administrar pedem sessão. A capa pode ser foto (cover) ou HTML/CSS (bannerHtml) — mesma tubulação da capa de perfil.",
    endpoints: [
      {
        method: "GET",
        path: "/communities",
        access: "public",
        description:
          "Lista comunidades (topic para filtrar, cursor para paginar). Com sessão, joined reflete participação.",
        request: `curl "${P}/communities?limit=10"`,
        response: `200 OK
{"items":[{"id":"community_…","name":"Muita IA pouco $","description":"…","members":1,
 "topic":"TECNOLOGIA","cover":null,"bannerHtml":null,"joined":false}],"nextCursor":null}`,
      },
      {
        method: "GET",
        path: "/communities/{communityId}",
        access: "public",
        description: "Detalhe da comunidade.",
      },
      {
        method: "GET",
        path: "/communities/{communityId}/feed",
        access: "public",
        description: "Feed de publicações da comunidade (mesma forma do feed).",
      },
      {
        method: "GET",
        path: "/communities/{communityId}/members",
        access: "public",
        description: "Membros e papéis (ADMIN).",
      },
      {
        method: "POST",
        path: "/communities/{communityId}/members",
        access: "auth",
        description:
          "Entra na comunidade (DELETE sai). Publicar nela: POST /feed/posts com communityId.",
      },
      {
        method: "POST",
        path: "/communities",
        access: "auth",
        description:
          "Cria comunidade (o criador vira ADMIN). PATCH edita; /transfer passa a administração; /favorite + /favorites para favoritas.",
      },
    ],
  },
  {
    id: "vagas",
    title: "Vagas",
    description:
      'Vagas internas (criadas na plataforma) e externas convivem na mesma listagem. Externas têm id com prefixo ext_, selo de plataforma (sourcePlatform) e URL da origem (sourceUrl) — o redirecionamento é sempre para quem publicou a vaga. Busca booleana: AND, OR, NOT, "frase exata" e parênteses no parâmetro query.',
    endpoints: [
      {
        method: "GET",
        path: "/jobs",
        access: "public",
        description:
          "Lista vagas. query (busca booleana no título), type, level, location e skills filtram só as internas (estruturais); sem filtros estruturais, externas entram junto.",
        request: `curl "${P}/jobs?query=java%20AND%20remoto&limit=20"`,
        response: `200 OK
{"items":[{"id":"ext_Remotive_2091144","title":"Content Reviewer - United States","company":"TELUS Digital",
 "location":"USA","postedAt":"2026-10-17T04:00:49Z","sourcePlatform":"Remotive",
 "sourceUrl":"https://remotive.com/remote-jobs/…"}],"nextCursor":null}`,
      },
      {
        method: "GET",
        path: "/jobs/{jobId}",
        access: "public",
        description: "Detalhe da vaga (interna ou externa).",
      },
      {
        method: "POST",
        path: "/jobs",
        access: "auth",
        description:
          "Publica vaga (reputação >= 150). PATCH edita, /close encerra, DELETE exclui. Candidaturas: POST /jobs/{id}/applications; status em PATCH /jobs/{id}/applications/{applicationId}; minhas candidaturas em GET /jobs/applications.",
      },
      {
        method: "GET",
        path: "/jobs/applications",
        access: "auth",
        description:
          "Candidaturas do próprio usuário (e as recebidas em GET /jobs/{jobId}/applications, para quem publicou).",
      },
    ],
  },
  {
    id: "eventos",
    title: "Eventos",
    description:
      "Vitrine de eventos profissionais. Eventos passados saem da vitrine e recusam RSVP; presença vira número agregado após 24h.",
    endpoints: [
      {
        method: "GET",
        path: "/events",
        access: "public",
        description:
          "Lista eventos (vitrine). Com sessão, attending reflete se o viewer confirmou presença.",
        response: `200 OK
{"items":[{"id":"event_…","title":"…","date":"2029-12-31","time":"23:59","format":"ONLINE","attendees":2,"attending":false,"expired":false}]}`,
      },
      {
        method: "GET",
        path: "/events/{eventId}",
        access: "public",
        description: "Detalhe do evento (attending do viewer quando autenticado).",
      },
      { method: "POST", path: "/events", access: "auth", description: "Cria evento." },
      {
        method: "POST",
        path: "/events/{eventId}/attendees",
        access: "auth",
        description: "Confirma presença (DELETE cancela).",
      },
    ],
  },
  {
    id: "mentoria",
    title: "Mentoria",
    description: "Mentores publicam horários livres; quem quer aprender pede sessão em um slot.",
    endpoints: [
      {
        method: "GET",
        path: "/mentors",
        access: "public",
        description: "Mentores e expertises.",
        response: `200 OK
{"items":[{"id":"mentor_…","expertise":["Pentest","RedTeam","Certificações"]}]}`,
      },
      {
        method: "GET",
        path: "/mentors/{mentorId}/slots",
        access: "public",
        description: "Horários livres do mentor.",
      },
      {
        method: "POST",
        path: "/mentors",
        access: "auth",
        description:
          "Torna-se mentor; POST /mentors/{id}/slots publica horários; /sessions pede/agenda sessão.",
      },
    ],
  },
  {
    id: "estatisticas",
    title: "Estatísticas",
    description: "Números públicos e agregados da rede — sem dado pessoal.",
    endpoints: [
      {
        method: "GET",
        path: "/stats/community",
        access: "public",
        description: "Usuários ativos (janela de 30 dias) e total da rede.",
        request: `curl ${P}/stats/community`,
        response: `200 OK
{"activeUsers":1031,"totalUsers":1370,"windowDays":30,"computedAt":"2026-10-17T14:20:39Z"}`,
      },
    ],
  },
  {
    id: "rede",
    title: "Rede (conexões e bloqueios)",
    description:
      "Conexões bidirecionais com aceite; bloqueio é permanente e esconde os dois lados do feed, comentários, busca e sugestões.",
    endpoints: [
      {
        method: "GET",
        path: "/network/summary",
        access: "auth",
        description: "Resumo da sua rede (conexões, pendentes).",
      },
      {
        method: "GET",
        path: "/network/suggestions",
        access: "auth",
        description: "Sugestões por afinidade (não por volume).",
      },
      {
        method: "GET",
        path: "/network/requests",
        access: "auth",
        description: "Pedidos de conexão recebidos.",
      },
      {
        method: "POST",
        path: "/network/connections/{targetUserId}",
        access: "auth",
        description: "Pedir conexão (PUT …/accept aceita; GET …/status consulta; DELETE desfaz).",
      },
      {
        method: "POST",
        path: "/network/blocks/{targetUserId}",
        access: "auth",
        description: "Bloqueia (DELETE desbloqueia; GET /network/blocks lista).",
      },
    ],
  },
  {
    id: "mensagens",
    title: "Mensagens",
    description:
      "Conversas diretas e de comunidade. Tudo aqui pede sessão — nada de mensagens é público.",
    endpoints: [
      {
        method: "GET",
        path: "/conversations",
        access: "auth",
        description: "Suas conversas (GET /conversations/search busca dentro delas).",
      },
      {
        method: "GET",
        path: "/conversations/{id}/messages",
        access: "auth",
        description: "Mensagens da conversa.",
      },
      {
        method: "POST",
        path: "/conversations/{id}/messages",
        access: "auth",
        description: "Envia mensagem (reações em …/messages/{messageId}/reactions).",
      },
      {
        method: "POST",
        path: "/conversations/direct",
        access: "auth",
        description: "Abre (ou recupera) a conversa direta com alguém.",
      },
      {
        method: "POST",
        path: "/conversations/{id}/read",
        access: "auth",
        description: "Marca como lida; /hide apaga para você (o outro lado mantém).",
      },
    ],
  },
  {
    id: "notificacoes",
    title: "Notificações e push",
    description:
      "Notificações no app e no celular (Web Push). Cada notificação traz href de destino no formato /api/….",
    endpoints: [
      {
        method: "GET",
        path: "/notifications",
        access: "auth",
        description: "Notificações do usuário (cursor).",
      },
      {
        method: "GET",
        path: "/push/config",
        access: "public",
        description: "Chaves públicas para assinar Web Push.",
      },
      {
        method: "POST",
        path: "/push/subscriptions",
        access: "auth",
        description: "Registra a assinatura push do navegador (DELETE remove).",
      },
    ],
  },
  {
    id: "midia",
    title: "Mídia",
    description:
      "Upload em três passos: (1) pede a assinatura; (2) sobe o arquivo no endereço que a resposta indicar (S3 = PUT direto na signedUrl com os headers dados; ImageKit = multipart); (3) usa o mediaId no post/comentário/perfil. Ninguém precisa de chave de terceiros — a plataforma assina.",
    endpoints: [
      {
        method: "POST",
        path: "/media/uploads",
        access: "auth",
        description:
          "Passo 1. purpose: POST_IMAGE | POST_VIDEO | AVATAR | BANNER | COVER. Teto de 500MB por arquivo (URL assinada vale 60 minutos).",
        request: `curl -X POST ${P}/media/uploads \\
  -H "X-Session-Token: $TOKEN" -H "Idempotency-Key: up-1" \\
  -H "Content-Type: application/json" \\
  -d '{"fileName":"media/abc/foto.png","mimeType":"image/png","size":10240,"purpose":"POST_IMAGE"}'`,
        response: `201 Created
{"id":"media_…","cdnUrl":"https://…","uploadUrl":"https://…(assinada)","provider":"S3","uploadHeaders":{…}}`,
      },
      {
        method: "GET",
        path: "/media/{mediaId}",
        access: "public",
        description: "Passo 3 (leitura): metadados + cdnUrl para renderizar.",
      },
      {
        method: "DELETE",
        path: "/media/{mediaId}",
        access: "auth",
        description: "Remove a mídia do dono.",
      },
    ],
  },
  {
    id: "moderacao",
    title: "Denúncias, moderação e recursos",
    description:
      "Qualquer pessoa autenticada pode denunciar conteúdo; cada denúncia avisa o suporte por e-mail. Um sistema automático pré-tri por IA e, só em violação grave e inequívoca, restringe o autor — que pode recorrer. A decisão final é sempre humana: recurso aceito remove a restrição; negado converte em banimento.",
    endpoints: [
      {
        method: "POST",
        path: "/reports",
        access: "auth",
        description:
          "Denuncia. targetType: POST | COMMENT | USER | JOB; reason: AI_GENERATED, FAKE_CONTENT, SCAM, DISCRIMINATION, PREJUDICE, HARASSMENT, SPAM, VIOLENCE, COPYRIGHT, OTHER.",
        request: `curl -X POST ${P}/reports \\
  -H "X-Session-Token: $TOKEN" -H "Idempotency-Key: rep-1" \\
  -H "Content-Type: application/json" \\
  -d '{"targetType":"POST","targetId":"post_…","reason":"SCAM","description":"Parece golpe de investimento"}'`,
        response: `201 Created
{"id":"report_…","targetType":"POST","reason":"SCAM","status":"PENDING","createdAt":"…"}`,
      },
      {
        method: "GET",
        path: "/reports/mine",
        access: "auth",
        description: "Denúncias que VOCÊ fez (acompanhamento; sem dados de terceiros).",
      },
      {
        method: "GET",
        path: "/me/sanctions",
        access: "auth",
        description: "Penalidades da sua conta e o estado dos seus recursos.",
        response: `200 OK
{"sanctions":[{"id":"sanc_…","type":"RESTRICTION","status":"ACTIVE","reason":"…","createdAt":"…"}],
 "appeals":[{"id":"appl_…","status":"PENDING","message":"…"}]}`,
      },
      {
        method: "POST",
        path: "/me/sanctions/appeals",
        access: "auth",
        description: "Recorre da restrição ativa (um recurso pendente por vez; humano decide).",
        request: `curl -X POST ${P}/me/sanctions/appeals \\
  -H "X-Session-Token: $TOKEN" -H "Content-Type: application/json" \\
  -d '{"message":"Foi discussão técnica, não discriminação."}'`,
      },
      {
        method: "GET",
        path: "/admin/reports",
        access: "admin",
        description:
          "Fila de denúncias (approve aplica penalidade e remove conteúdo; dismiss arquiva).",
      },
      {
        method: "GET",
        path: "/admin/appeals",
        access: "admin",
        description:
          "Fila de recursos. POST /admin/appeals/{id}/approve libera; /deny converte em banimento (sessões revogadas).",
      },
    ],
  },
  {
    id: "conta",
    title: "Suporte e conta",
    description:
      "Canal de suporte responde por e-mail e fica no painel admin; exclusão de conta anonimiza o conteúdo (nada de dado pessoal órfão).",
    endpoints: [
      {
        method: "GET",
        path: "/support/config",
        access: "public",
        description: "Se o canal de suporte está aberto (e o e-mail público, quando houver).",
      },
      {
        method: "POST",
        path: "/support/requests",
        access: "auth",
        description: "Abre pedido de suporte (vai por e-mail ao time + fila /admin/support).",
      },
      {
        method: "PUT",
        path: "/me/theme",
        access: "auth",
        description: "Preferências de tema que acompanham a conta entre dispositivos.",
      },
      {
        method: "GET",
        path: "/me/preferences",
        access: "auth",
        description:
          "Personalização da conta: assuntos que quer ver, assuntos que não gosta, módulos desativados, lembrete de madrugada e o Modo lite (menos animações e requisições para aparelho fraco).",
        request: `curl ${P}/me/preferences \
  -H "X-Session-Token: $TOKEN"`,
        response: `200 OK
{"likedTopics":["TECNOLOGIA"],"blockedTopics":[],"disabledModules":[],"nightRestReminder":true,"liteMode":false}`,
      },
      {
        method: "PUT",
        path: "/me/preferences",
        access: "auth",
        description:
          "Atualização parcial: só os campos enviados mudam (null preserva o que já estava salvo). Lista vazia volta ao padrão.",
        request: `curl -X PUT ${P}/me/preferences \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -d '{"liteMode":true}'`,
        response: `200 OK
{"likedTopics":["TECNOLOGIA"],"blockedTopics":[],"disabledModules":[],"nightRestReminder":true,"liteMode":true}`,
      },
    ],
  },
  {
    id: "temas",
    title: "Temas (galeria da comunidade)",
    description:
      "Pacotes de TOKENS validados por schema e com gate de contraste (>= 4.5:1) — sem CSS livre. O pacote é JSON; a instalação aplica na hora e a conta guarda o tema como preferência.",
    endpoints: [
      {
        method: "GET",
        path: "/temas/galeria?limit=60",
        access: "public",
        description: "Lista os temas publicados (mais recentes primeiro).",
        response: `[{"id":"tema_…","name":"Bruma Silenciosa","description":"…","packageJson":"{\\"palette\\":…}","modeDefault":"light","installs":12,"createdAt":"2026-10-17T18:20:11Z"}]`,
      },
      {
        method: "GET",
        path: "/temas/galeria/{themeId}",
        access: "public",
        description: "Um tema específico com o pacote completo.",
      },
      {
        method: "POST",
        path: "/temas/galeria",
        access: "auth",
        description:
          "Publica um tema (o gate de contraste recusa pacote ilegível com THEME_CONTRAST_LOW). Exige Idempotency-Key.",
        request: `{"name":"Meu Tema","description":"Cores da minha comunidade","modeDefault":"light",
 "packageJson":"{\\"palette\\":{\\"background\\":\\"#f5e6c8\\",…}}"}`,
        response: `{"id":"tema_…","status":"PUBLISHED"}`,
      },
      {
        method: "GET",
        path: "/temas/galeria/mine",
        access: "auth",
        description: "Os seus temas, em qualquer estado.",
      },
      {
        method: "POST",
        path: "/temas/galeria/{themeId}/install",
        access: "auth",
        description: "Instala na conta (conta a métrica de installs).",
      },
      {
        method: "POST",
        path: "/temas/galeria/{themeId}/report",
        access: "auth",
        description: "Denuncia o tema para moderação.",
      },
      {
        method: "POST",
        path: "/temas/galeria/{themeId}/hide",
        access: "auth",
        description: "O autor esconde o próprio tema.",
      },
    ],
  },
  {
    id: "faisca",
    title: "Faísca (carteira e cotação)",
    description:
      "A moeda interna é FRACIONADA: o ledger inteiro conta milésimos — 1 faísca = 1.000 mf (como os centavos do real). A cotação de REFERÊNCIA em BRL é publicada pela plataforma e financia a remuneração de criadores; não é câmbio — comprar faísca com dinheiro não existe. Transferências são estilo Pix: por username, instantâneas e irreversíveis, com Idempotency-Key obrigatória.",
    endpoints: [
      {
        method: "GET",
        path: "/coin/cotacao",
        access: "public",
        description:
          "A cotação de referência vigente + histórico (alimenta a mini bolsa). O total em circulação não é público.",
        response: `{"brlCents":1,"escala":1000,"atualizadaEm":"2026-10-18T10:00:00Z",
 "historico":[{"brlCents":1,"em":"2026-10-18T10:00:00Z"}]}`,
      },
      {
        method: "POST",
        path: "/coin/cotacao",
        access: "admin",
        description: "Publica nova cotação de referência (em centavos por 1 faísca).",
        request: `{"brlCents":2,"note":"reajuste de referência"}`,
        response: `{"brlCents":2,"em":"2026-10-18T10:05:00Z"}`,
      },
      {
        method: "GET",
        path: "/carteira",
        access: "auth",
        description:
          "Saldo, chave (username) e extrato. A primeira abertura executa o genesis idempotente (100 faíscas) e marca a presença do dia.",
        response: `{"balance":105000,"escala":1000,"cotacaoBrlCents":1,"chave":"ada-silva",
 "entries":[{"amount":5000,"kind":"REWARD","message":"Presença diária","createdAt":"2026-10-18T10:00:00Z"},
 {"amount":100000,"kind":"AIRDROP","message":"Distribuição inicial","createdAt":"2026-10-18T09:59:59Z"}]}`,
      },
      {
        method: "POST",
        path: "/carteira/transferencias",
        access: "auth",
        description:
          "Envia faíscas por username (amount em milésimos). Idempotency-Key obrigatória: o replay com a MESMA chave não duplica; com payload diferente, conflita.",
        request: `{"toUsername":"joao-silva","amount":1500,"message":"pelo mockup lindo"}`,
        response: `{"status":"SENT","amount":1500,"toUsername":"joao-silva"}`,
      },
    ],
  },
  {
    id: "jogos",
    title: "Jogos (agregador)",
    description:
      "O Énóis NÃO hospeda jogos: o criador envia o LINK de onde o jogo já está publicado (itch.io, site próprio), a moderação revisa, e o jogo roda EMBUTIDO num quadro isolado no app. A página do criador é pública em /games/{username}.",
    endpoints: [
      {
        method: "GET",
        path: "/games?limit=60",
        access: "public",
        description: "Catálogo de jogos publicados.",
        response: `[{"id":"game_…","userId":"user_…","username":"ada-silva","slug":"kawaii-survivors","title":"Kawaii Survivors",
 "description":"Survivor fofo com pixel art.","url":"https://ada.itch.io/kawaii","tags":"arcade,pixel","status":"PUBLISHED",
 "submittedAt":"2026-10-18T10:00:00Z"}]`,
      },
      {
        method: "GET",
        path: "/games/{username}",
        access: "public",
        description: "Os jogos publicados de um criador.",
      },
      {
        method: "GET",
        path: "/games/{username}/{gameSlug}",
        access: "public",
        description: "Um jogo específico (a rota que o app embute).",
      },
      {
        method: "GET",
        path: "/me/games",
        access: "auth",
        description: "Os seus envios, em qualquer estado (dono vê o próprio não-publicado).",
      },
      {
        method: "POST",
        path: "/games",
        access: "auth",
        description:
          "Envia um jogo para moderação — url obrigatoriamente https; slug único por criador.",
        request: `{"slug":"kawaii-survivors","title":"Kawaii Survivors","url":"https://ada.itch.io/kawaii",
 "description":"…","tags":"arcade,pixel"}`,
        response: `{"id":"game_…","slug":"kawaii-survivors","status":"SUBMITTED"}`,
      },
      {
        method: "POST",
        path: "/games/{gameId}/resubmit",
        access: "auth",
        description: "Reenvia um jogo rejeitado para nova rodada.",
      },
      {
        method: "POST",
        path: "/games/{gameId}/compartilhar",
        access: "auth",
        description:
          "G-share: publica a conquista no feed com a tag do jogo (texto ≤ 600; teto de 12/dia por pessoa). O texto/mídia vêm do JOGO por postMessage e o APP publica com o clique do jogador — a sessão nunca atravessa o iframe.",
        request: `{"texto":"Peguei nível 10 na fazendinha!","mediaIds":["media_…"]}`,
        response: `{"postId":"post_…","status":"SHARED"}`,
      },
      {
        method: "GET",
        path: "/admin/games?limit=30",
        access: "admin",
        description: "Fila de revisão.",
      },
      {
        method: "POST",
        path: "/admin/games/{gameId}/approve",
        access: "admin",
        description: "Aprova e publica.",
        request: `{"note":"carrega e roda"}`,
        response: `{"id":"game_…","status":"PUBLISHED"}`,
      },
      {
        method: "POST",
        path: "/admin/games/{gameId}/reject",
        access: "admin",
        description: "Recusa — o motivo é obrigatório e o criador lê.",
        request: `{"note":"o jogo não carrega"}`,
        response: `{"id":"game_…","status":"REJECTED"}`,
      },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace (temas por faíscas, com escrow)",
    description:
      "O criador lista um tema próprio por um preço em faíscas; a compra fica em ESCROW — as faíscas ficam retidas até o comprador confirmar (7 dias; liberação automática depois), e o criador recebe o preço menos 10% de taxa. Reembolso devolve 100%. Valores em milésimos de faísca.",
    endpoints: [
      {
        method: "GET",
        path: "/marketplace?limit=60",
        access: "public",
        description: "Itens à venda.",
        response: `[{"id":"mkt_…","sellerId":"user_…","itemKind":"THEME","itemId":"tema_…","title":"Tema à Venda",
 "price":40000,"status":"ACTIVE","createdAt":"2026-10-18T10:00:00Z"}]`,
      },
      {
        method: "GET",
        path: "/marketplace/mine",
        access: "auth",
        description: "As suas listagens.",
      },
      {
        method: "GET",
        path: "/marketplace/compras",
        access: "auth",
        description: "As suas compras (o painel do escrow: confirmar ou reembolso).",
      },
      {
        method: "GET",
        path: "/marketplace/vendas",
        access: "auth",
        description: "As suas vendas (acompanhar liberações).",
      },
      {
        method: "POST",
        path: "/marketplace",
        access: "auth",
        description:
          "Lista um tema seu (só o autor pode; o tema precisa estar publicado na galeria).",
        request: `{"itemId":"tema_…","title":"Tema à Venda","price":40000}`,
        response: `{"id":"mkt_…","status":"ACTIVE"}`,
      },
      {
        method: "POST",
        path: "/marketplace/{listingId}/buy",
        access: "auth",
        description: "Compra: as faíscas saem da carteira e ficam retidas.",
        response: `{"purchaseId":"mcmp_…","state":"HELD","price":40000}`,
      },
      {
        method: "POST",
        path: "/marketplace/purchases/{purchaseId}/confirm",
        access: "auth",
        description:
          "Confirmou que está tudo certo: libera 90% ao criador (10% de taxa à plataforma).",
        response: `{"purchaseId":"mcmp_…","state":"RELEASED"}`,
      },
      {
        method: "POST",
        path: "/marketplace/purchases/{purchaseId}/refund",
        access: "auth",
        description: "Reembolso dentro de 7 dias: devolve 100%.",
        response: `{"purchaseId":"mcmp_…","state":"REFUNDED"}`,
      },
    ],
  },
  {
    id: "servicos",
    title: "Serviços freelance (com escrow)",
    description:
      "Duas faces: OFERTAR (o profissional publica o que faz, modelo Fiverr — teto de 5 abertas por conta) e PEDIR (a demanda publica o que precisa, com orçamento em faixa e entregáveis OBRIGATÓRIOS — a lição dos microprojetos). Em faíscas, o contrato nasce HELD: entrega → aceite libera 90% (10% de taxa); reembolso devolve 100%. Em reais, o pagamento é combinado direto entre as partes e o Énóis não cobra taxa.",
    endpoints: [
      {
        method: "GET",
        path: "/servicos",
        access: "public",
        description: "Catálogo: ofertas ativas e pedidos abertos.",
        response: `{"ofertas":[{"id":"sl_…","category":"design","title":"Logo simples","price":30000,"deliveryDays":5,
 "deliverables":"SVG + PNG","status":"ACTIVE"}],
 "pedidos":[{"id":"sr_…","category":"código","title":"Página institucional","budgetMin":40000,"budgetMax":80000,
 "deliverables":"HTML + CSS publicados","status":"OPEN"}]}`,
      },
      {
        method: "GET",
        path: "/servicos/minhas",
        access: "auth",
        description: "Minhas ofertas e meus contratos (como comprador e como vendedor).",
      },
      {
        method: "POST",
        path: "/servicos/ofertas",
        access: "auth",
        description: "Publica uma oferta.",
        request: `{"category":"design","title":"Logo simples para o seu time","description":"Duas rodadas de ajuste…",
 "deliverables":"SVG + PNG em três tamanhos","price":30000,"deliveryDays":5}`,
        response: `{"id":"sl_…","status":"ACTIVE"}`,
      },
      {
        method: "POST",
        path: "/servicos/ofertas/{listingId}/contratar",
        access: "auth",
        description: "Contrata: as faíscas vão para o escrow.",
        response: `{"contractId":"sc_…","state":"HELD"}`,
      },
      {
        method: "POST",
        path: "/servicos/pedidos",
        access: "auth",
        description: "Publica um pedido (entregáveis obrigatórios; faixa válida).",
        request: `{"category":"código","title":"Página institucional","description":"…","deliverables":"HTML + CSS publicados",
 "budgetMin":40000,"budgetMax":80000}`,
        response: `{"id":"sr_…","status":"OPEN"}`,
      },
      {
        method: "POST",
        path: "/servicos/pedidos/{requestId}/propostas",
        access: "auth",
        description: "Manda proposta — o preço precisa estar DENTRO da faixa.",
        request: `{"message":"Entrego em uma semana, com revisão.","price":50000}`,
        response: `{"id":"sp_…","status":"SENT"}`,
      },
      {
        method: "GET",
        path: "/servicos/pedidos/{requestId}/propostas",
        access: "auth",
        description: "As propostas do pedido (só quem pediu vê).",
      },
      {
        method: "POST",
        path: "/servicos/pedidos/{requestId}/escolher",
        access: "auth",
        description: "Escolhe uma proposta: escrow retido e o pedido fecha.",
        request: `{"proposalId":"sp_…"}`,
        response: `{"contractId":"sc_…","state":"HELD"}`,
      },
      {
        method: "POST",
        path: "/servicos/contratos/{contractId}/entregar",
        access: "auth",
        description: "O vendedor entrega (nota do que foi feito).",
        request: `{"note":"SVG e PNG entregues no link X"}`,
        response: `{"contractId":"sc_…","state":"HELD"}`,
      },
      {
        method: "POST",
        path: "/servicos/contratos/{contractId}/aceitar",
        access: "auth",
        description: "O comprador aceita: libera 90% ao profissional.",
        response: `{"contractId":"sc_…","state":"RELEASED"}`,
      },
      {
        method: "POST",
        path: "/servicos/contratos/{contractId}/reembolso",
        access: "auth",
        description: "O comprador recusa: devolve 100%.",
        response: `{"contractId":"sc_…","state":"REFUNDED"}`,
      },
    ],
  },
  {
    id: "blogs",
    title: "Blogs",
    description:
      "Um blog por pessoa, em /blog/{username}. Os posts do blog ficam fora do feed principal; quem assina o blog recebe os posts novos por e-mail (se optou por isso).",
    endpoints: [
      {
        method: "GET",
        path: "/blogs/{slug}",
        access: "public",
        description: "Lê o blog e os posts publicados pelo slug do blog.",
        request: `curl ${P}/blogs/ada`,
        response: `200 OK
{"slug":"ada","username":"ada","title":"Blog da Ada","posts":[…]}`,
      },
      {
        method: "GET",
        path: "/blogs/me",
        access: "auth",
        description: "O blog de quem está autenticado (cria um em branco se não existir).",
      },
      {
        method: "PUT",
        path: "/blogs/me",
        access: "auth",
        description: "Cria ou atualiza o próprio blog (título, descrição, tema).",
      },
      {
        method: "POST",
        path: "/blogs/me/posts",
        access: "auth",
        description: "Publica um post no próprio blog (markdown ou HTML sanitizado).",
      },
      {
        method: "PATCH",
        path: "/blogs/me/posts/{postId}",
        access: "auth",
        description: "Edita um post próprio do blog.",
      },
      {
        method: "DELETE",
        path: "/blogs/me/posts/{postId}",
        access: "auth",
        description: "Remove um post próprio do blog.",
      },
    ],
  },
  {
    id: "groups",
    title: "Grupos",
    description:
      "Espaços privados com feed, tópicos e moderação próprios, independentes das comunidades. Entrada aberta entra na hora; entrada por pedido gera um pendente que os administradores aprovam ou recusam.",
    endpoints: [
      {
        method: "GET",
        path: "/groups/{slug}",
        access: "public",
        description: "Página pública do grupo (quem não é membro vê o que o grupo expõe).",
      },
      {
        method: "POST",
        path: "/groups/{groupId}/join",
        access: "auth",
        description: "Entra no grupo ou envia pedido (quando a entrada é por aprovação).",
      },
      {
        method: "GET",
        path: "/groups/{groupId}/members",
        access: "auth",
        description: "Lista de membros do grupo.",
      },
      {
        method: "POST",
        path: "/groups/{groupId}/topics",
        access: "auth",
        description: "Cria um tópico dentro do grupo (os administradores do grupo fazem isso).",
      },
      {
        method: "GET",
        path: "/groups/{groupId}/posts",
        access: "auth",
        description: "Feed do grupo: só o conteúdo marcado com os tópicos dele.",
      },
      {
        method: "POST",
        path: "/groups/{groupId}/posts",
        access: "auth",
        description: "Publica no feed do grupo (membros).",
      },
      {
        method: "POST",
        path: "/groups/{groupId}/requests/{requestId}/approve",
        access: "auth",
        description: "Aprova um pedido de entrada (administradores). Reject faz o simétrico.",
      },
    ],
  },
  {
    id: "services",
    title: "Serviços",
    description:
      "Ofertas de serviço entre pessoas da rede, com orçamento, contrato e entrega. O fluxo vai de pedido aberto a proposta, escolha, entrega e aceite (ou reembolso integral).",
    endpoints: [
      {
        method: "GET",
        path: "/servicos",
        access: "public",
        description: "Catálogo de serviços publicados.",
      },
      {
        method: "POST",
        path: "/servicos/ofertas",
        access: "auth",
        description: "Publica uma oferta de serviço (sujeita à moderação).",
      },
      {
        method: "POST",
        path: "/servicos/pedidos",
        access: "auth",
        description: "Abre um pedido de serviço.",
      },
      {
        method: "POST",
        path: "/servicos/pedidos/{requestId}/propostas",
        access: "auth",
        description: "Envia uma proposta para um pedido aberto.",
      },
      {
        method: "POST",
        path: "/servicos/pedidos/{requestId}/escolher",
        access: "auth",
        description: "Escolhe a proposta e fecha o contrato (o valor fica em custódia).",
      },
      {
        method: "POST",
        path: "/servicos/contratos/{contractId}/entregar",
        access: "auth",
        description: "Entrega o trabalho realizado (o cliente tem X dias para responder).",
      },
      {
        method: "POST",
        path: "/servicos/contratos/{contractId}/aceitar",
        access: "auth",
        description: "Aceita a entrega e libera o pagamento ao prestador.",
      },
      {
        method: "POST",
        path: "/servicos/contratos/{contractId}/reembolso",
        access: "auth",
        description: "Reembolso integral: devolve 100% ao cliente.",
      },
    ],
  },
  {
    id: "daily-games",
    title: "Jogos diários",
    description:
      "Três jogos que trocam a todo dia (Blocos, Palavras e Labirinto), com ranking geral e prêmios em faíscas.",
    endpoints: [
      {
        method: "GET",
        path: "/daily-games/blocks/today",
        access: "public",
        description:
          "O estado do jogo de Blocos de hoje (com sessão, inclui o progresso do jogador).",
      },
      {
        method: "POST",
        path: "/daily-games/blocks/today/start",
        access: "auth",
        description: "Inicia a partida de hoje.",
      },
      {
        method: "POST",
        path: "/daily-games/blocks/today/actions",
        access: "auth",
        description: "Executa uma ação na partida em andamento.",
      },
      {
        method: "GET",
        path: "/daily-games/blocks/leaderboard",
        access: "public",
        description: "Ranking do dia (e histórico).",
      },
      {
        method: "GET",
        path: "/daily-games/words/today",
        access: "public",
        description: "Estado do jogo de Palavras de hoje.",
      },
      {
        method: "GET",
        path: "/daily-games/rewards/prizes",
        access: "public",
        description: "Faixas de prêmio em faíscas por desempenho.",
      },
    ],
  },
];

export const apiUseCases: ApiUseCase[] = [
  {
    id: "widget",
    title: "Mostrar uma publicação do Énóis em outro site",
    description:
      "Um post público serve qualquer widget: leitura sem credencial, contadores e comentários inclusos. Roteiro de três chamadas, sem autenticação.",
    steps: [
      {
        note: "1. Busque o post (autor, contadores, mídia):",
        code: `curl ${P}/feed/posts/post_0f1e2d3c4b5a69788796a5b4c3d2e1f0`,
      },
      {
        note: "2. Busque a primeira página de comentários:",
        code: `curl "${P}/feed/posts/post_0f1e2d3c4b5a69788796a5b4c3d2e1f0/comments?limit=20"`,
      },
      {
        note: "3. Pagina enquanto houver nextCursor (mande o valor de volta em ?cursor=):",
        code: `curl "${P}/feed/posts/post_0f1e2d3c4b5a69788796a5b4c3d2e1f0/comments?cursor=<nextCursor>&limit=20"`,
      },
      {
        note: "Imagens de perfil e mídia vêm com caminho relativo — prefixe com https://enois.ia.br para renderizar.",
      },
    ],
  },
  {
    id: "vagas",
    title: "Mural de vagas com link para a origem",
    description:
      "A listagem junta vagas internas e agregadores públicos (Remotive, Jobicy, RemoteOK, Himalayas). Vagas externas têm id com prefixo ext_ e sempre uma sourceUrl — o clique vai para quem publicou a vaga.",
    steps: [
      {
        note: "1. Liste com busca booleana no título:",
        code: `curl "${P}/jobs?query=java%20AND%20(remoto%20OR%20h%C3%ADbrido)&limit=20"`,
      },
      {
        note: "2. Separe as externas pelo prefixo do id e use a origem:",
        code: `# externa: id "ext_Remotive_2091144" -> sourcePlatform "Remotive" + sourceUrl para redirecionar
# interna: id "job_…"      -> aplicação pela própria API (requer sessão)`,
      },
      {
        note: "3. Pagine com nextCursor; filtros estruturais (type/level/location/skills) limitam a vagas internas.",
      },
    ],
  },
  {
    id: "comunidade",
    title: "Feed de uma comunidade",
    description:
      "Conteúdo de uma comunidade específica, sem credencial — útil para site do evento ou da turma.",
    steps: [
      { note: "1. Encontre a comunidade:", code: `curl "${P}/communities?limit=20"` },
      { note: "2. Puxe o feed dela:", code: `curl "${P}/communities/$COMMUNITY_ID/feed?limit=20"` },
      { note: "3. Detalhe de cada post e comentários: mesmos endpoints do caso do widget." },
    ],
  },
  {
    id: "publicar",
    title: "Publicar com imagem (com sessão)",
    description:
      "Upload em três passos e depois a publicação. Funciona igual para comentário (mediaIds) e avatar.",
    steps: [
      {
        note: "1. Autentique-se e guarde o token:",
        code: `curl -X POST ${P}/auth/login -H "Content-Type: application/json" \\\n  -d '{"email":"ada@exemplo.com","password":"senha-forte-1"}'`,
      },
      {
        note: "2. Peça a assinatura do upload:",
        code: `curl -X POST ${P}/media/uploads -H "X-Session-Token: $TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"fileName":"media/abc/foto.png","mimeType":"image/png","size":10240,"purpose":"POST_IMAGE"}'`,
      },
      {
        note: "3. Suba o arquivo no uploadUrl que veio na resposta (PUT direto na S3 assinada, ou multipart no ImageKit).",
      },
      {
        note: "4. Publique com o mediaId:",
        code: `curl -X POST ${P}/feed/posts -H "X-Session-Token: $TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"type":"INSIGHT","content":"Olha isso","mediaIds":["media_…"]}'`,
      },
    ],
  },
  {
    id: "faisca",
    title: "Faísca: transferência estilo Pix e a cotação",
    description:
      "A moeda interna é fracionada (1 faísca = 1.000 mf) e transferida por username, com Idempotency-Key. A cotação de referência em BRL é pública; o total em circulação não é.",
    steps: [
      { note: "1. A cotação de referência (pública, sem token):", code: `curl ${P}/coin/cotacao` },
      {
        note: "2. Abra a carteira (a primeira abertura executa o genesis idempotente):",
        code: `curl ${P}/carteira -H "X-Session-Token: $TOKEN"`,
      },
      {
        note: "3. Envie 1,5 faísca (1.500 mf) para outra pessoa:",
        code: `curl -X POST ${P}/carteira/transferencias -H "X-Session-Token: $TOKEN" \
  -H "Idempotency-Key: pagamento-01" -H "Content-Type: application/json" \
  -d '{"toUsername":"joao-silva","amount":1500,"message":"pelo mockup lindo"}'`,
      },
      {
        note: "Repetir a chamada com a MESMA chave não duplica (replay do Pix). Transferência é irreversível — reversão só por moderação, com lançamento espelho no ledger.",
      },
    ],
  },
  {
    id: "escrow",
    title: "Escrow de ponta a ponta: comprar um tema",
    description:
      "Compra em faíscas com escrow: as faíscas ficam retidas até o comprador confirmar (7 dias) — o criador recebe 90% e a plataforma fica com 10%.",
    steps: [
      { note: "1. Veja o que está à venda:", code: `curl ${P}/marketplace` },
      {
        note: "2. Compre (as faíscas saem da carteira e ficam retidas):",
        code: `curl -X POST ${P}/marketplace/mkt_…/buy -H "X-Session-Token: $TOKEN"`,
      },
      {
        note: "3. Confirme depois de instalar o tema (libera 90% ao criador):",
        code: `curl -X POST ${P}/marketplace/purchases/mcmp_…/confirm -H "X-Session-Token: $TOKEN"`,
      },
      {
        note: "Arrependeu dentro de 7 dias? /refund devolve 100%. Sem decisão, a liberação para o criador é automática.",
      },
    ],
  },
  {
    id: "gshare",
    title: "Jogos: compartilhar conquista no feed",
    description:
      'O jogo roda num iframe de OUTRA origem, sem sessão nenhuma. Para oferecer "compartilhar conquista", ele fala com a página pai por postMessage; a página valida a origem, mostra a prévia e publica com o CLIQUE do jogador — o jogo nunca publica sozinho.',
    steps: [
      {
        note: "1. Dentro do jogo (iframe), pede o compartilhamento:",
        code: `window.parent.postMessage({
  type: "enois:share",
  texto: "Peguei nível 10 na fazendinha!",
  imagem: "data:image/png;base64,…"   // opcional
}, "*");`,
      },
      {
        note: "2. A página do Énóis valida a origem, mostra a prévia ao jogador e, no clique, sobe a imagem pela mídia e publica:",
        code: `curl -X POST ${P}/games/game_…/compartilhar -H "X-Session-Token: $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"texto":"Peguei nível 10 na fazendinha!","mediaIds":["media_…"]}'`,
      },
      {
        note: "O post nasce no feed com as tags game + o slug do jogo. Teto de 12/dia (429 SHARE_LIMIT). Protocolo completo em docs/GAMES.md.",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Painel de saúde da rede",
    description:
      "Números públicos, agregados, sem dado pessoal — prontos para dashboard ou relatório.",
    steps: [
      { note: "1. Atividade da rede:", code: `curl ${P}/stats/community` },
      { note: "2. Ranking de perfis:", code: `curl ${P}/profile/ranking` },
      { note: "3. Pulso por tema:", code: `curl "${P}/search?q=ia&limit=50"` },
    ],
  },
  {
    id: "moderacao",
    title: "Integração de moderação (admins)",
    description:
      "Para ferramentas do próprio time: a fila de denúncias e de recursos é acessível por sessão de administrador (REDE_ADMIN_EMAILS). O banimento só acontece por recurso negado — decisão sempre humana.",
    steps: [
      {
        note: "1. Veja a fila de denúncias (já com a pré-triagem da IA no campo ai_triage):",
        code: `curl "${P}/admin/reports?limit=30" -H "X-Session-Token: $ADMIN_TOKEN"`,
      },
      {
        note: "2. Decida uma denúncia:",
        code: `curl -X POST ${P}/admin/reports/$REPORT_ID/approve -H "X-Session-Token: $ADMIN_TOKEN" \\\n  -H "Content-Type: application/json" -d '{"note":"confirmado"}'`,
      },
      {
        note: "3. Julgue recursos (aprovar libera; negar ban):",
        code: `curl -X POST ${P}/admin/appeals/$APPEAL_ID/approve -H "X-Session-Token: $ADMIN_TOKEN"`,
      },
    ],
  },
];
