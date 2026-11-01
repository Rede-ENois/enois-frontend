import { dataCurta, dataDeEvento } from "@/lib/date/format";

const common = {
  enter: "Entrar",
  createAccount: "Criar conta",
  cancel: "Cancelar",
  save: "Salvar",
  saving: "Salvando...",
  create: "Criar",
  creating: "Criando...",
  publish: "Publicar",
  publishing: "Publicando...",
  sending: "Enviando...",
  loading: "Carregando...",
  close: "Fechar",
  remove: "Remover",
  edit: "Editar",
} as const;

export const texts = {
  common,

  emotes: {
    title: "Figurinhas",
    button: "Figurinhas",
    searchPlaceholder: "Buscar figurinha",
    loading: "Carregando figurinhas...",
    empty: "Nenhuma figurinha com esse nome.",
    error: "Não foi possível carregar as figurinhas agora.",
    hint: "As mais usadas primeiro. O código entra no texto — quem lê vê a figurinha.",
    count: (total: number) => `${total} ${total === 1 ? "figurinha" : "figurinhas"}`,
    page: (page: number, totalPages: number) => `Página ${page} de ${totalPages}`,
    previous: "Página anterior",
    next: "Próxima página",
  },

  coinEconomy: {
    title: "Economia da faísca",
    hint: "A cotação é recalculada no máximo uma vez por dia, às 03:10 (America/Sao_Paulo), e anda um passo conforme a movimentação dos últimos 30 dias. O botão roda a mesma conta: se o período já fechou, publica; se não, nada muda.",
    cofre: "No cofre",
    retorno: "Voltou ao cofre (30d)",
    emissao: "Emissão (30d)",
    giro: "Giro (30d)",
    escassez: "Escassez",
    indice: "Índice",
    cotacao: "Cotação",
    periodo: "Período decorrido",
    proxima: "Próxima avaliação",
    janela: "Janela do período",
    janelaAberta: "Aberta — publica agora",
    janelaFechada: "Fechada",
    recalculate: "Recalcular agora",
    calculating: "Recalculando...",
    published: "Cotação recalculada e publicada.",
    unchanged:
      "O período diário ainda não fechou: nada foi publicado. Veja a próxima avaliação no cartão.",
    error: "Não foi possível recalcular a cotação.",
  },

  /** Contas da comunidade no painel de monitorabilidade. */
  userMetrics: {
    title: "Contas da comunidade",
    hint: "O crescimento é a variação sobre a base do dia anterior. A projeção estende o ritmo médio dos últimos 7 dias: o mês inteiro dilui uma semana de lançamento e esconde a tendência atual.",
    total: "Total de contas",
    newToday: "Entraram hoje",
    new7: "Últimos 7 dias",
    new30: "Últimos 30 dias",
    growthToday: "Crescimento hoje",
    growth7: "Ritmo por dia (7d)",
    growth30: "Ritmo por dia (30d)",
    average7: "Média por dia (7d)",
    average30: "Média por dia (30d)",
    seriesTitle: "Entradas por dia (30 dias)",
    projection: "Projeção no ritmo de 7 dias",
    inDays: (days: number) => `Em ${days} dias`,
    chartLabel: (date: string, novas: string, total: string) =>
      `${date}: ${novas} novas contas, ${total} no total`,
  },

  /** Origem pública usada para montar links absolutos (miniatura de compartilhamento). */
  siteUrl: import.meta.env.VITE_SITE_URL ?? "https://enois.ia.br",

  brand: {
    name: "Énóis",
    prefix: "É",
    accent: "nóis",
  },

  navigation: {
    items: {
      feed: "Início",
      network: "Rede",
      communities: "Comunidades",
      messages: "Mensagens",
      saved: "Salvos",
      blogs: "Blogs",
      jobs: "Vagas",
      companies: "Empresas",
      mentoring: "Mentoria",
      events: "Eventos",
      groups: "Grupos",
      studyPairs: "Par de estudo",
      freelances: "Freelances",
      games: "Jogos",
      communityProjects: "Projetos da comunidade",
      marketplace: "Marketplace",
      services: "Contratar serviços",
      professionalProfile: "Perfil profissional",
    },
    context: { social: "Social", professional: "Profissional" },
  },

  groups: {
    seoTitle: "Grupos · Énóis",
    title: "Grupos",
    subtitle:
      "Espaços privados por interesse, projeto ou equipe — a conversa fica entre quem participa.",
    searchPlaceholder: "Buscar grupo...",
    empty: "Nenhum grupo encontrado.",
    members: (count: number) => `${count} ${count === 1 ? "membro" : "membros"}`,
    joinModeOpen: "Entrada aberta",
    joinModeApproval: "Entrada por aprovação",
    join: "Entrar no grupo",
    requestJoin: "Pedir para entrar",
    pending: "Pedido pendente",
    leave: "Sair do grupo",
    joined: "Você participa",
    create: "Criar grupo",
    createTitle: "Criar grupo",
    createDescription: "Escolha o nome e como as pessoas entram. Dá para mudar depois.",
    name: "Nome do grupo",
    namePlaceholder: "Ex.: Turma do café",
    description: "Descrição",
    descriptionPlaceholder: "Do que o grupo trata?",
    logo: "Logo do grupo",
    logoHint: "Uma imagem quadrada (JPG ou PNG).",
    bannerLabel: "Banner do grupo",
    bannerHint: "Uma foto de capa ou um cabeçalho em HTML.",
    bannerPhoto: "Foto",
    bannerHtml: "HTML",
    bannerHtmlHint: "Dá para trocar por um cabeçalho em HTML depois, na edição do grupo.",
    addLogo: "Escolher logo",
    changeImage: "Trocar",
    removeImage: "Remover",
    addBanner: "Escolher banner",
    uploadError: "Não foi possível enviar a imagem. Tente novamente.",
    joinModeLabel: "Como as pessoas entram",
    openLabel: "Aberto — entra na hora",
    approvalLabel: "Por aprovação — você decide",
    createAction: "Criar",
    creating: "Criando...",
    createError: "Não foi possível criar o grupo.",
    joinError: "Não foi possível entrar no grupo.",
    leaveError: "Não foi possível sair do grupo.",
    share: "Compartilhar",
    shareCopied: "Link do grupo copiado!",
    shareError: "Não foi possível compartilhar o grupo.",
    notFound: "Grupo não encontrado.",
    loadError: "Não foi possível carregar os grupos.",
    topics: "Tópicos",
    allTopics: "Tudo",
    noTopics: "Nenhum tópico ainda.",
    noTopicsHint: "Quem administra o grupo cria os tópicos.",
    newTopic: "Novo tópico",
    topicName: "Nome do tópico",
    topicNamePlaceholder: "Ex.: Avisos",
    topicCreateError: "Não foi possível criar o tópico.",
    renameTopic: "Renomear tópico",
    topicRenameSuccess: "Nome do tópico atualizado.",
    topicRenameError: "Não foi possível renomear o tópico.",
    feedEmpty: "Nenhuma publicação ainda.",
    composerPlaceholder: "Escreva para o grupo...",
    publish: "Publicar",
    publishing: "Publicando...",
    publishError: "Não foi possível publicar.",
    membersOnly: "Entre no grupo para ver o feed privado.",
    edit: "Editar",
    editTitle: "Editar grupo",
    save: "Salvar",
    saving: "Salvando...",
    saveError: "Não foi possível salvar.",
    react: "Reagir",
    reactError: "Não foi possível reagir.",
    commentsTitle: "Comentários",
    commentPlaceholder: "Comente...",
    commentAction: "Comentar",
    commenting: "Enviando...",
    commentError: "Não foi possível comentar.",
    noComments: "Nenhum comentário ainda.",
    adminTitle: "Administração",
    requestsTitle: "Solicitações de ingresso",
    noRequests: "Nenhuma solicitação pendente.",
    approve: "Aprovar",
    reject: "Recusar",
    requestError: "Não foi possível decidir a solicitação.",
    membersTitle: "Membros",
    removeMember: "Remover",
    removeMemberTitle: (name: string) => `Remover ${name}?`,
    removeMemberDescription:
      "A pessoa deixa de ver o conteúdo do grupo e precisa pedir entrada de novo para voltar.",
    removeError: "Não foi possível remover o membro.",
    transfer: "Transferir propriedade",
    transferTitle: (name: string) => `Passar a propriedade para ${name}?`,
    transferDescription:
      "Você continua como administrador; a partir daqui é essa pessoa quem responde pelo grupo.",
    transferError: "Não foi possível transferir a propriedade.",
    roleOwner: "Dono",
    roleAdmin: "Administrador",
    roleModerator: "Moderador",
    roleMember: "Membro",
    removeAction: "Remover",
    removePostTitle: "Remover publicação?",
    removePostDescription: "Ela some do feed do grupo; a ação fica registrada na auditoria.",
    removePostError: "Não foi possível remover a publicação.",
    editCommentLabel: "Editar comentário",
    editCommentError: "Não foi possível editar o comentário.",
    removeCommentTitle: "Remover comentário?",
    removeCommentDescription: "Ele some da publicação; a ação fica registrada na auditoria.",
    removeCommentError: "Não foi possível remover o comentário.",
  },

  appearance: {
    action: "Aparência",
    purchasedThemeApplied: "Tema aplicado.",
    purchasedThemeError: "Não foi possível aplicar o tema agora.",
  },

  errors: {
    unexpected: "Erro inesperado. Tente novamente.",
    details: {
      http: (status: number) => `HTTP ${status}`,
      postPath: (path: string) => `POST ${path}`,
    },
    /** Replaces the API message for codes whose raw text is not fit for the screen. */
    apiMessages: {
      /** Escrita com cookie de sessão sem o header anti-CSRF: só acontece com página desatualizada. */
      CSRF_REQUIRED:
        "Não foi possível confirmar que o pedido veio do Énóis. Recarregue a página e tente de novo.",
      UNSAFE_LINK:
        "Um dos links não é permitido. Use endereços que comecem com http://, https:// ou mailto:.",
      /** O mesmo código de verificação chegou duas vezes (ex.: clique duplo); só o primeiro vale. */
      TWO_FACTOR_CHALLENGE_ALREADY_USED:
        "Este código já foi usado. Se você já entrou, recarregue a página; senão, comece o login de novo.",
    } as Record<string, string>,
    knownCodes: {
      NETWORK_ERROR:
        "O navegador não conseguiu falar com a API. Se você estiver rodando localmente, verifique se o backend está em execução (ex.: `docker compose up` ou o servidor Java na porta 8081) e se a variável VITE_API_BACKEND no arquivo .env aponta para ele.",
      INVALID_CREDENTIALS:
        "E-mail ou senha incorretos. Confira os dados ou use 'Esqueci minha senha'.",
      SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
      MEDIA_TYPE_NOT_ALLOWED:
        "Esse tipo de arquivo não é aceito aqui. Foto de perfil, capa, banner e ícones só aceitam imagem; currículo só aceita PDF.",
      IMAGE_CONTENT_NOT_ALLOWED:
        "Esta imagem parece conter conteúdo pornográfico e não pode ser enviada. Se acredita que houve um engano, tente outra imagem.",
      IMAGE_CANNOT_BE_VERIFIED:
        "Não foi possível verificar esta imagem. Tente outro arquivo ou converta para JPG ou PNG.",
      IMAGE_MODERATION_UNAVAILABLE:
        "A verificação de imagens está indisponível no momento. Tente novamente mais tarde.",
      IMPORT_TOO_LARGE:
        "Esse arquivo do LinkedIn é grande demais para importar. Baixe de novo só os dados do perfil (sem mensagens e conexões) e tente outra vez.",
      IDEMPOTENCY_KEY_REQUIRED:
        "O backend rejeitou a requisição por falta de Idempotency-Key. Recarregue a página; se o problema persistir, há um bug no front-end (src/lib/api-client.ts).",
    },
  },

  auth: {
    signupClosed: {
      title: "Cadastros fechados no momento",
      description:
        "A criação de contas está pausada. Quem já tem conta entra normalmente; se você ainda não participa, acompanhe as novidades por aqui.",
    },
    fields: {
      fullName: "Nome completo",
      birthDate: "Data de nascimento",
      email: "E-mail",
      password: "Senha",
      newPassword: "Nova senha",
    },
    placeholders: {
      name: "Maria da Silva",
      email: "voce@exemplo.com",
      newPassword: "Mínimo de 8 caracteres",
      password: "Sua senha",
    },
    validation: {
      invalidEmail: "E-mail inválido",
      loginPasswordMin: "A senha precisa ter ao menos 6 caracteres",
      signupNameMin: "Como podemos te chamar?",
      passwordMin: "Use ao menos 8 caracteres",
      birthDateRequired: "Informe a data de nascimento.",
      birthDateFuture: "A data de nascimento não pode estar no futuro.",
      termsRequired: "É preciso confirmar que você tem 18 anos ou mais e aceitar os termos.",
    },
    password: {
      forgot: "Esqueci minha senha",
    },
    seo: {
      authTitle: "Entrar ou criar conta · Énóis",
      authDescription: "Acesse sua conta ou entre para o Énóis, uma rede humana feita por gente.",
      resetTitle: "Redefinir senha · Énóis",
      resetDescription: "Defina uma nova senha para sua conta no Énóis.",
    },
    captcha: {
      label: "Verificação de segurança",
      loading: "Carregando a pergunta...",
      placeholder: "Resposta",
      refresh: "Trocar pergunta",
      required: "Resolva a verificação de segurança para criar a conta.",
    },
    signup: {
      title: "Vamos começar.",
      subtitle: "Crie sua conta em menos de um minuto.",
      termsPrefix: "Confirmo que tenho 18 anos ou mais e aceito os ",
      termsLink: "Termos de Uso",
      termsAnd: " e a ",
      privacyLink: "Política de Privacidade",
      termsSuffix: ".",
    },
    login: {
      title: "Bem-vindo de volta.",
      subtitle: "Continue de onde parou.",
    },
    social: {
      google: "Continuar com Google",
      googleSignup: "Criar conta com Google",
      linkedin: "Entrar com LinkedIn",
      linkedinSignup: "Criar conta com LinkedIn",
      divider: "ou com e-mail",
      /** Aplicativo OAuth ainda em aprovação/verificação, então a entrada por ele falha. */
      pendingApproval: (provider: string) =>
        `O login com ${provider} está aguardando aprovação do OAuth e ainda não foi liberado. Entre com e-mail e senha por enquanto.`,
      /** O ambiente desligou o provedor: a API recusa o start com 403 `OAUTH_PROVIDER_DISABLED`. */
      providerDisabled: (provider: string) =>
        `O login com ${provider} não está disponível neste ambiente. Entre com e-mail e senha por enquanto.`,
      callbackError: "Não foi possível concluir o login social. Tente novamente.",
      /** O convite de login social expira em 15 min e é de uso único (voltar/reusar cai aqui). */
      stateExpired:
        "Esta tentativa de login expirou ou já foi usada. Feche este aviso, volte para a tela de entrada e clique no botão de novo — funciona na primeira tentativa.",
      /** O LinkedIn recusou publicar em nome da pessoa: produto "Share on LinkedIn" pendente no app. */
      linkedinScope:
        "O LinkedIn ainda não liberou a publicação por este aplicativo. Nada mudou na sua conta — você pode reconectar mais tarde; o time já está vendo isso.",
      callbackLoading: "Concluindo o login...",
      callbackTitle: "Entrando · Énóis",
      cancelled: "Você cancelou o login. Nada foi alterado na sua conta.",
      accountExists:
        "Essa conta já existe. Você não pode criar outra com o mesmo e-mail — entre com a senha que você já usa; depois, se quiser, vincule o Google pelo seu perfil.",
      emailRequired:
        "O provedor não informou um e-mail. Entre com e-mail e senha e vincule a conta depois.",
    },
    /** Estado do cadastro/login com a conta pendente de confirmação de e-mail. */
    pending: {
      title: "Confirme seu e-mail",
      description: (email: string) =>
        `Se este e-mail puder ser usado, você vai receber uma mensagem em ${email} com o próximo passo. A conta só é criada depois que você abrir o link.`,
      step1: "O link vale por 24 horas e só pode ser usado uma vez.",
      step2: "Confira a caixa de spam se não encontrar em alguns minutos.",
      step3: "A conta nasce (e o acesso libera) assim que o e-mail for confirmado.",
      resend: "Reenviar o link",
      sending: "Enviando...",
      sent: "Link reenviado. Confira seu e-mail.",
      failed: "Não foi possível enviar agora. Tente de novo em instantes.",
      limited: "Muitos reenvios seguidos. Aguarde cerca de uma hora antes de tentar de novo.",
      wrongEmail: "E-mail errado? Você pode criar outra conta ou falar com o suporte.",
    },
    /** Segundo fator: passo extra no login e tela de segurança. */
    twoFactor: {
      title: "Confirmação em duas etapas",
      totpHint: "Abra seu aplicativo authenticator e informe o código de 6 dígitos.",
      emailHint: "Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por 10 minutos.",
      code: "Código",
      codePlaceholder: "000000 ou código de recuperação",
      confirm: "Confirmar e entrar",
      resend: "Reenviar o código por e-mail",
      resent: "Código reenviado. Confira seu e-mail.",
      recoveryHint:
        "Perdeu o acesso ao app ou ao e-mail? Use um código de recuperação no lugar do código.",
      pageTitle: "Segurança da conta · Énóis",
      pageHeading: "Segurança e verificação",
      pageDescription:
        "Conta verificada sustenta a sua credibilidade na rede. Confirme o e-mail ou ative a verificação em duas etapas.",
      statusVerified: "Conta verificada",
      statusPending: "Conta não verificada",
      reputationZero:
        "Enquanto a conta não estiver verificada, a sua reputação fica multiplicada por zero.",
      emailSection: "E-mail",
      emailConfirmed: (email: string) => `E-mail confirmado: ${email}`,
      emailPending: "E-mail ainda não confirmado.",
      emailResend: "Reenviar o link de confirmação",
      emailResent: "Link reenviado. Confira seu e-mail.",
      totpSection: "Aplicativo authenticator",
      totpActive: "Ativo neste momento.",
      totpInactive: "Adicione uma camada a mais exigindo um código do app a cada login.",
      totpStart: "Configurar aplicativo",
      totpSetupTitle: "Adicione no seu aplicativo",
      totpSetupDescription:
        "Abra o Google Authenticator, 1Password ou outro app compatível e adicione a chave abaixo (ou cole a URI otpauth).",
      totpSecretLabel: "Chave para digitar no app",
      totpSecretCopied: "Chave copiada.",
      totpUriLabel: "URI otpauth (para colar no app)",
      totpCodeLabel: "Código mostrado no aplicativo",
      totpEnable: "Ativar verificação em duas etapas",
      totpDisable: "Desativar",
      totpBackupTitle: "Guarde os códigos de recuperação",
      totpBackupDescription:
        "Use um deles se perder o acesso ao aplicativo. Cada código vale uma vez e não serão mostrados de novo.",
      totpDone: "Entendi, guardei meus códigos",
      providerSection: "Segundo fator pelo provedor",
      providerActive:
        "Sua conta entra por Google/Apple, que confirma o e-mail e responde pela segunda etapa. É por isso que a conta já consta como verificada.",
      email2faSection: "Código por e-mail",
      email2faActive: "Ativo: a cada login enviamos um código para o seu e-mail.",
      email2faInactive: "Receba um código de 6 dígitos por e-mail em cada login.",
      email2faEnable: "Ativar por e-mail",
      email2faConfirmHint: "Enviamos um código para o seu e-mail. Informe-o para confirmar.",
      email2faConfirm: "Confirmar código",
      email2faDisable: "Desativar",
      passwordRequired: "Senha atual",
      passwordHelp: "Confirme sua senha atual.",
      /** Ligar ou desligar o segundo fator encerra a sessão nos outros aparelhos. */
      otherDevicesNotice: "Ativar ou desativar encerra sua sessão nos outros aparelhos.",
      /** Depois de 5 códigos errados o desafio é invalidado, mesmo para o código certo. */
      tooManyAttempts:
        "Muitas tentativas com código errado. Por segurança, comece o login de novo com e-mail e senha.",
      /** No código por e-mail, reenviar gera um código novo e zera as tentativas. */
      tooManyAttemptsEmail:
        "Muitas tentativas com código errado. Peça um novo código por e-mail e tente de novo.",
      backupLeft: (count: number) =>
        `${count} código${count === 1 ? "" : "s"} de recuperação ainda válido${count === 1 ? "" : "s"}.`,
      error: "Não foi possível concluir agora. Tente novamente.",
      wrongPassword: "Senha incorreta.",
      unavailable:
        "A verificação por aplicativo ainda não está disponível nesta instalação. Use o código por e-mail.",
      notConfigured:
        "Falta configurar a chave de segurança no servidor (REDE_SECURITY_ENCRYPTION_KEY).",
      verifyIdentity: "Verificar identidade",
    },
    verify: {
      title: "Confirmando e-mail · Énóis",
      confirmTitle: "Confirme seu e-mail",
      confirmDescription:
        "Clique no botão para ativar sua conta. O link vale por 24 horas e só funciona uma vez.",
      confirmButton: "Confirmar meu e-mail",
      verifying: "Confirmando seu e-mail...",
      doneTitle: "E-mail confirmado!",
      doneDescription: "Sua conta está ativa. Vamos te levar para o app.",
      goToApp: "Ir para o app",
      invalidTitle: "Link inválido",
      invalidDescription:
        "Este link de confirmação não é válido. Entre com seu e-mail e senha para receber um novo.",
      usedTitle: "Link já usado",
      usedDescription:
        "Este link já foi utilizado para confirmar a conta. Se ainda não conseguiu entrar, peça um novo link.",
      expiredTitle: "Link expirado",
      expiredDescription:
        "O link de confirmação vale por 24 horas. Entre com seu e-mail e senha para receber outro.",
      resend: "Pedir um novo link",
    },
    /** Vínculo de provedores na conta (só Google; Apple aparece apenas para desvincular). */
    links: {
      lastMethod:
        "Este é o único jeito de entrar na sua conta. Defina uma senha (em “Trocar senha”) antes de desvincular.",
      unlinkError: "Não foi possível desvincular agora. Tente novamente.",
      linkError: "Não foi possível iniciar a vinculação. Tente novamente.",
      /**
       * O backend responde OAUTH_NOT_CONFIGURED quando falta credencial do provedor (ver
       * `SocialLoginService.buildAuthorizationUrl`) — dizer isso é melhor que "tente novamente",
       * que manda a pessoa repetir um clique que nunca vai funcionar.
       */
      notConfigured: (provider: string) =>
        `O ${provider} ainda não está configurado no Énóis. Tente novamente mais tarde.`,
      /** Nome do provedor quando a tela não sabe qual foi (o rótulo vem de OAUTH_PROVIDER_LABELS). */
      providerFallback: "provedor",
      /** Publicação automática no LinkedIn (produto "Share on LinkedIn"). */
      linkedinSync: {
        saved: "Preferência de sincronização salva.",
        unavailable: "Não foi possível ligar a sincronização agora.",
      },
    },
    terms: {
      prefix: "Ao continuar, você concorda com os ",
      terms: "Termos",
      conjunction: " e com a ",
      privacy: "Política de Privacidade",
      end: ".",
    },
    forgot: {
      title: "Recuperar senha",
      checkEmail: "Verifique seu e-mail",
      sentDescription:
        "Se existir uma conta com esse e-mail, enviaremos um link para redefinir sua senha.",
      understood: "Entendi",
      description: "Informe o e-mail da sua conta e enviaremos um link de redefinição.",
      sendLink: "Enviar link",
    },
    reset: {
      invalidLink: "Link inválido ou expirado. Solicite uma nova redefinição de senha.",
      usedLink: "Este link já foi usado. Solicite uma nova redefinição de senha.",
      successTitle: "Senha redefinida!",
      successDescription: "Sua senha foi atualizada com sucesso. Já pode entrar na sua conta.",
      enterNow: "Entrar agora ",
      title: "Definir nova senha",
      description: "Escolha uma nova senha para acessar sua conta.",
      action: "Redefinir senha ",
      remembered: "Já lembrou sua senha? ",
    },
  },

  moderacaoReview: {
    title: "Revisão de denúncia",
    type: "Tipo",
    reporter: "Denunciante",
    reported: "Denunciado",
    noAuthor: "Autor não identificado para este alvo",
    content: "Conteúdo do post denunciado",
    confirmHint: "Confirme com a sua sessão de admin — cada ação é registrada.",
    penalize: "Penalizar o autor",
    warn: "Avisar o autor",
    deletePost: "Excluir o post",
    ban: "Banir o autor",
    removeCompany: "Remover a página empresarial",
    applied: "Ação aplicada.",
    actionError: "Não foi possível aplicar a ação.",
    alreadyReviewed: "Esta denúncia já foi revisada.",
    forbidden: "Sessão sem acesso de admin para esta fila.",
  },
  onboarding: {
    seoTitle: "Boas-vindas · Énóis",
    /** Sugestões de habilidade no primeiro passo: amplas, porque a rede não é só de tecnologia. */
    skillSuggestions: [
      "Comunicação",
      "Design",
      "Programação",
      "Fotografia",
      "Escrita",
      "Gestão de projetos",
      "Marketing",
      "Dados",
      "Música",
      "Ensino",
    ],
    errors: {
      INVALID_ASSUNTO:
        "Um dos assuntos escolhidos não existe mais. Revise a lista e tente de novo.",
      TOO_MANY_SKILLS: "Escolha até 20 habilidades.",
      TOO_MANY_ITEMS: "Você marcou mais itens do que o limite. Desmarque alguns e tente de novo.",
      SKILL_TOO_LONG: "Uma das habilidades ficou longa demais. Encurte e tente de novo.",
      CONFLICTING_PREFERENCE:
        "Um dos assuntos está na sua lista de assuntos que você não quer ver. Ajuste em Personalização.",
      generic: "Não deu pra salvar agora. Tente de novo em instantes.",
    } as Record<string, string>,
  },

  personalization: {
    saved: "Preferências salvas.",
    saveError: "Não foi possível salvar as preferências. Tente novamente.",
  },
  corporate: {
    seoTitle: "Perfil profissional · Énóis",
    title: "Perfil profissional",
    subtitle:
      "Uma versão profissional da mesma conta: a sua apresentação de trabalho, com @ próprio. Faixas, reputação e seguidores continuam sendo os da sua conta.",
    notCreatedTitle: "Você ainda não tem um perfil profissional",
    notCreatedBody:
      "Crie para publicar no feed corporativo, se candidatar a vagas com a sua identidade de trabalho e ter um @ profissional próprio.",
    username: "@ profissional",
    usernameHint: "3 a 30 caracteres: letras, números, ponto, hífen ou underline.",
    nametag: "Nametag (@ e fim da URL)",
    nametagHint:
      "É o @ do perfil e o endereço público dele. Não precisa ser igual ao do seu perfil social.",
    nametagChange: "Alterar nametag",
    nametagChanged: "Nametag alterado.",
    nametagWarning:
      "Ao alterar, o endereço antigo deixa de funcionar — quem salvou o link anterior não chega mais.",
    nametagInvalid: "Use 3 a 30 caracteres, começando e terminando em letra ou número.",
    name: "Nome profissional",
    headline: "Headline",
    bio: "Sobre (profissional)",
    bannerHtml: "Capa em HTML/CSS (opcional)",
    bannerHtmlHint:
      "Se preenchida, esta capa substitui a imagem. Roda isolada, como a capa do perfil social.",
    bannerHtmlPlaceholder: '<div style="...">...</div>',
    location: "Localização",
    industry: "Indústria / área",
    externalLinks: "Links (separados por vírgula)",
    create: "Criar perfil profissional",
    save: "Salvar",
    saved: "Perfil profissional salvo.",
    saveError: "Não foi possível salvar. Tente novamente.",
    activate: "Ativar perfil",
    activated: "Perfil profissional ativo.",
    deactivate: "Desativar",
    deactivated: "Perfil profissional desativado. Nada foi apagado.",
    statusLabel: "Estado",
    status: {
      DRAFT: "Rascunho (só você vê)",
      ACTIVE: "Ativo (aparece para todos)",
      DISABLED: "Desativado (só você vê)",
    },
    activateHint: "Para ativar, preencha a headline.",
    importTitle: "Trazer do perfil social",
    importBody:
      "Escolha o que quer trazer. Nada é copiado sem a sua escolha: marque só o que fizer sentido publicar profissionalmente.",
    importEmpty: "O seu perfil social não tem nada que possa ser trazido.",
    importConfirm: "Trazer selecionados",
    imported: "Campos trazidos do perfil social.",
    importField: {
      name: "Nome",
      headline: "Headline",
      bio: "Sobre",
      avatar: "Foto de perfil",
      banner: "Capa",
      bannerHtml: "Capa em HTML/CSS",
      location: "Localização",
    },
    changeAvatar: "Trocar foto",
    changeBanner: "Trocar capa",
    uploading: "Enviando...",
    uploadError: "Não foi possível enviar a imagem. Tente novamente.",
    publicProfile: {
      notFoundTitle: "Perfil profissional não encontrado",
      notFoundBody: "Este perfil pode não existir ou estar desativado.",
      postsTitle: "Publicações",
      empty: "Nenhuma publicação por aqui ainda.",
      editMine: "Editar o meu perfil profissional",
      backToFeed: "Voltar ao feed",
    },
  },
  account: {
    identity: {
      saved: "Identidade salva.",
      badgesFull: "Você já tem 5 emblemas.",
      error: "Não foi possível salvar. Tente novamente.",
    },
    linkedinImport: {
      done: (created: number, updated: number) => {
        const partes: string[] = [];
        if (created > 0) partes.push(`${created} ${created === 1 ? "item novo" : "itens novos"}`);
        if (updated > 0)
          partes.push(`${updated} ${updated === 1 ? "item atualizado" : "itens atualizados"}`);
        return `LinkedIn sincronizado: ${partes.join(" e ")}.`;
      },
      /** Reimportar SINCRONIZA: o que já existe é atualizado, não duplicado. */
      nothingNew: "Nada mudou: o que você marcou já está igual no seu perfil.",
      /** O perfil tem teto por seção; o que não coube fica claro em vez de falhar pela metade. */
      capReached:
        "Alguns itens não couberam: o perfil aceita até 10 experiências, 10 formações e 10 certificações.",
    },
    linkedinContacts: {
      autoOn: "Convite automático ligado: a fila está sendo enviada.",
      autoOff: "Convite automático desligado. Os contatos já importados ficam na fila.",
      imported: (invited: number, queued: number) => {
        const partes: string[] = [];
        if (invited > 0)
          partes.push(`${invited} ${invited === 1 ? "convite enviado" : "convites enviados"}`);
        if (queued > 0) partes.push(`${queued} na fila`);
        return partes.length > 0
          ? `Contatos importados: ${partes.join(" e ")}.`
          : "Contatos importados do LinkedIn.";
      },
    },
    menu: {
      blockedUsers: "Usuários bloqueados",
      /** O backend não confirmou: os cookies da sessão continuariam valendo. */
      logoutFailed: "Não foi possível sair agora. Sua sessão continua ativa neste aparelho.",
      logoutRetry: "Tentar de novo",
      pushDenied: "Permissão de notificação negada. Libere nas configurações do navegador.",
      pushUnavailable: "Este dispositivo não suporta notificações no celular.",
      pushServerOff: "As notificações no celular ainda não estão disponíveis.",
      pushError: "Não foi possível ativar as notificações. Tente novamente.",
      /** Rótulos do item de avisos no celular (o design system usa estes três estados). */
      pushToggleOff: "Ligar avisos",
      pushToggleOn: "Avisos ligados neste aparelho",
      pushToggleWorking: "Ligando avisos...",
    },
    changeEmail: {
      error: "Não foi possível alterar o e-mail. Tente novamente.",
    },
    changePassword: {
      error: "Não foi possível trocar a senha. Confira a senha atual.",
      errorCreate: "Não foi possível criar a senha. Tente novamente.",
    },
    deleteAccount: {
      error: "Não foi possível excluir a conta. Confira a senha.",
    },
  },

  landing: {
    seo: {
      title: "Énóis, uma rede social feita de gente, não de atenção",
      description:
        "Rede social gratuita feita por gente: conversas, trabalho, brincadeira e vizinhança no mesmo lugar. Sem anúncios, sem planos pagos e com um feed que termina quando o conteúdo acaba.",
      ogDescription:
        "Sem anúncio, sem paywall e sem esteira infinita. Uma rede humana em construção com as pessoas, e aberta para quem quiser ajudar.",
      ogImageAlt: "Identidade visual do Énóis com seu símbolo e slogan.",
    },
    /**
     * Números da comunidade. A janela vai escrita por extenso de propósito: é o número de quem
     * USOU a plataforma no período (sessão viva ou publicação), não o de contas criadas, sem a
     * frase inteira, o visitante lê "usuários" e entende "cadastros". Vem de cache do servidor
     * (~10 min), é público e agregado, e some sozinho da página se a consulta falhar.
     */
    community: {
      eyebrow: "Quem já está aqui",
      activeLabel: (days: number) => `pessoas usaram o énóis nos últimos ${days} dias`,
      totalLabel: "contas na plataforma",
      note: "Números públicos e agregados, sem identificar ninguém. O servidor recalcula a cada poucos minutos.",
    },
    nav: {
      proposal: "A proposta",
      practice: "Na prática",
      exists: "O que existe",
      community: "Comunidade",
      contribute: "Contribuir",
    },
    hero: {
      badge: "A rede é nossa",
      title: "Uma rede social não precisa viver da sua atenção.",
      description:
        "O énóis é uma rede humana: um lugar para conversar, trabalhar, aprender, brincar e construir junto. Sem anúncios, sem planos pagos e sem nada tentando prender você: quem decide quando a visita acaba é você.",
      join: "Entrar no énóis",
      proposal: "Conhecer a proposta",
      facts: {
        free: "Gratuita, sem plano pago",
        noAds: "Sem anúncio em nenhum canto",
        feedEnds: "O feed acaba, e avisa quando acaba",
      },
    },
    problem: {
      eyebrow: "De onde a gente veio",
      title: "Você entrou para conversar. A plataforma quer que você fique.",
      paragraphs: [
        "Quando a receita de uma rede vem da sua atenção, cada detalhe do produto empurra para o mesmo lado: mais tempo de tela, mais reação, mais retorno. Não é maldade de ninguém, é o modelo funcionando como foi desenhado.",
        "O énóis nasce de uma pergunta incômoda: e se a plataforma não precisasse ganhar quando você perde seu tempo? É essa pergunta que organiza o que a gente constrói aqui, e o que a gente se recusa a construir.",
      ],
      standardTitle: "O modelo que a gente questiona",
      standardPoints: [
        "Tempo de tela como a métrica que manda.",
        "Notificação desenhada para trazer você de volta.",
        "Alcance disputado em leilão de anúncio.",
        "Pessoa tratada como inventário publicitário.",
      ],
      oursTitle: "A aposta do énóis",
      oursPoints: [
        "A conta não fecha com publicidade, por isso não existe anúncio aqui.",
        "O que existe é para todo mundo: sem plano pago esperando na esquina.",
        "O feed termina quando o conteúdo acaba, e diz isso na sua cara.",
        "Gente de verdade moderando, com regras escritas antes de qualquer punição.",
        "A rede é humana antes de ser profissional: a foto do almoço e a vaga da empresa cabem no mesmo perfil.",
      ],
    },
    principles: {
      eyebrow: "Na prática",
      title: "Filosofia sem prática vira frase de parede.",
      description:
        "Estes são compromissos que dá para conferir no produto, não promessas para um futuro distante.",
      items: [
        {
          title: "Gratuito de verdade",
          text: "Sem anúncio, sem plano pago e sem versão premium que destrava o que a gratuita esconde. Todo mundo usa a mesma plataforma, com os mesmos recursos.",
        },
        {
          title: "O feed acaba",
          text: "Quando as publicações terminam, aparece o aviso: “Você chegou ao fim do feed.” A visita acaba quando você quiser, não quando o site decidir.",
        },
        {
          title: "A mídia não sequestra a tela",
          text: "Vídeo toca sem som e só enquanto está à vista; quando você rola para longe, ele para. Nada de som automático atrás do que você está lendo.",
        },
        {
          title: "Sua presença, do seu jeito",
          text: "Bio, capa e páginas aceitam HTML e CSS escritos por você; a cor do tema é escolhida por quem usa, não imposta pelo produto.",
        },
        {
          title: "Regras escritas, moderação real",
          text: "As diretrizes são públicas e valem para todo mundo, inclusive para quem denuncia. Denúncia pode ser acompanhada e é revisada por gente, não engavetada.",
        },
        {
          title: "Construção aberta",
          text: "Uma API pública documentada, um canal de suporte de verdade e um produto que muda com o que a comunidade aponta.",
        },
      ],
    },
    product: {
      eyebrow: "Sem maquete",
      title: "O que já está no ar",
      description:
        "Nada aqui é mockup nem promessa de roadmap: é o que existe hoje, funcionando. Parte abre sem conta nenhuma; o resto pede só um cadastro gratuito.",
      capture: {
        alt: "Captura da página pública de vagas do énóis, com filtros por nível, local e tipo e cartões de vagas abertas",
        caption: "Captura real da página de vagas, enois.ia.br/vagas, aberta sem login.",
      },
      groups: [
        {
          label: "Conversas",
          items: [
            "Publicações em vários tipos: pergunta, artigo, projeto, página, notícia, tutorial, oportunidade, avaliação e divertimento",
            "Mais de trinta assuntos para marcar do que cada post é",
            "Comentários com imagem, GIF e áudio, com reações, edição e respostas aninhadas",
            "Menções, salvos e a opção de ver só o que você ainda não tocou",
            "Páginas em HTML e CSS publicadas como post, com player de vídeo e áudio",
          ],
        },
        {
          label: "Comunidades e grupos",
          items: [
            "Comunidades com capa própria, feita de foto ou de HTML e CSS",
            "Canais privados por assunto, fora de todos os feeds",
            "Grupos com feed, tópicos e moderação em camadas",
            "Post fixado, denúncia e regras públicas em toda parte",
          ],
        },
        {
          label: "Trabalho e estudo",
          items: [
            "Vagas publicadas aqui e vindas de fontes públicas (Remotive, Jobicy, RemoteOK, Himalayas)",
            "Candidatura com triagem de quem publicou a vaga",
            "Empresas com perfil próprio e projetos de comunidade",
            "Mentoria com agenda de sessões",
            "Eventos online, presenciais ou híbridos, com confirmação",
            "Currículo em PDF no perfil, que viaja com a candidatura",
          ],
        },
        {
          label: "Brincadeira e criação",
          items: [
            "Jogos da comunidade, jogáveis no navegador, com avaliações e comentários",
            "Três jogos por dia: Palavras, Labirinto e Blocos, com prêmio em faíscas",
            "Loja de aparências, com molduras animadas de avatar",
            "Marketplace de temas e conteúdos, com o autor no catálogo",
            "Projetos de comunidade, com página própria e ciclo de revisão",
          ],
        },
        {
          label: "Gente e conta",
          items: [
            "Perfil e publicações com link público, que abrem sem login",
            "Bio, capa e páginas em HTML e CSS escritos por você",
            "Busca por pessoas, comunidades, vagas, eventos e jogos",
            "Conexões, pedidos, salvos, bloqueios e denúncias que você acompanha",
            "Mensagens diretas e de comunidade, com imagem, GIF e áudio",
            "Notificações no app e no celular",
          ],
        },
        {
          label: "O dinheiro é interno",
          items: [
            "Faíscas: a moeda circula entre as pessoas, sem dinheiro real",
            "Carteira com extrato, transferências instantâneas e resgate em bens",
          ],
        },
      ],
      links: {
        jobs: "Abrir as vagas",
        guidelines: "Ler as diretrizes",
        api: "Ver a API pública",
      },
    },
    build: {
      eyebrow: "Em construção",
      title: "Nada aqui é definitivo, de propósito.",
      paragraphs: [
        "O énóis não é um produto lacrado. É software vivo, feito e refeito a partir do que a comunidade aponta: o que confunde, o que trava, o que falta.",
        "A gente não promete perfeição, promete evolução e transparência sobre o que ainda não está resolvido, incluindo o que esta página ainda não conta.",
      ],
      channels: {
        contact: {
          label: "Falar com a gente",
          description:
            "Um canal de suporte de verdade, com registro e resposta, não um formulário que some.",
        },
        guidelines: {
          label: "Ler as diretrizes",
          description: "As regras da comunidade, escritas e públicas, valem para todo mundo.",
        },
        api: {
          label: "Construir em cima",
          description: "A API é pública e documentada: dá para integrar, automatizar e criar.",
        },
      },
    },
    contribute: {
      eyebrow: "Código aberto, processo combinado",
      title: "Contribuir não é bagunça.",
      description:
        "O código do Énóis é aberto, mas o processo é combinado. Antes de abrir um PR, a gente quer saber quem você é, o que quer resolver e se você leu as regras. Isso não é burocracia: é o que mantém o projeto saudável para quem usa e para quem mantém.",
      rulesTitle: "Como a gente trabalha",
      rules: [
        "Leia o guia de contribuição e o código de conduta antes de escrever código.",
        "Abra ou assuma uma issue: mudanças grandes precisam de conversa antes do PR.",
        "Mande mudanças pequenas, com teste e a descrição do problema que resolvem.",
        "A revisão é conversa técnica, não concurso. O merge é decisão de quem mantém.",
      ],
      guide: "Ler o guia de contribuição",
      guideUrl: "https://github.com/Rede-ENois/enois-backend/blob/main/CONTRIBUTING.md",
      formTitle: "Quero contribuir",
      formDescription:
        "Deixe seus dados básicos. O GitHub é o canal do trabalho; o e-mail serve só para falar sobre a contribuição.",
      fields: {
        name: "Nome",
        namePlaceholder: "Como podemos te chamar",
        github: "GitHub",
        githubPlaceholder: "@usuario ou https://github.com/usuario",
        email: "E-mail",
        emailPlaceholder: "voce@exemplo.com",
        area: "Área",
        areaPlaceholder: "Escolha uma área",
        experience: "Experiência",
        experiencePlaceholder: "Escolha uma faixa",
        message: "O que você quer contribuir?",
        messagePlaceholder:
          "Conte o que você já fez, o que quer aprender ou qual problema do projeto quer atacar.",
      },
      areas: {
        engineering: "Engenharia",
        design: "Design",
        product: "Produto",
        data: "Dados",
        infra: "Infraestrutura",
        docs: "Documentação",
        community: "Comunidade",
        other: "Outro",
      },
      experiences: {
        beginner: "Iniciante",
        intermediate: "Intermediário",
        advanced: "Avançado",
        maintainer: "Mantenedor(a)",
      },
      termsPrefix: "Li e aceito as ",
      termsLink: "regras de contribuição e os termos de uso",
      termsSuffix: ".",
      submit: "Enviar candidatura",
      confirm: "Confirmar meus dados",
      sending: "Enviando...",
      successTitle: "Recebemos sua candidatura",
      successDescription:
        "O registro fica na fila interna do projeto. Se houver uma issue ou um próximo passo para a sua área, a gente fala com você pelo GitHub ou pelo e-mail informado.",
      verifiedGithubHint:
        "O GitHub vem do seu vínculo verificado; ele não pode ser alterado por aqui.",
      verifiedSuccessTitle: "Dados confirmados",
      verifiedSuccessDescription:
        "Você já aparece no painel de contribuintes. A verificação é o próprio GitHub, sem aprovação manual.",
      again: "Enviar outra",
      error: "Não foi possível enviar agora. Tente de novo em alguns minutos.",
      validationName: "Informe seu nome (pelo menos 2 caracteres).",
      validationGithub: "Informe seu usuário do GitHub.",
      validationEmail: "Informe um e-mail válido.",
      validationTerms: "Para enviar, aceite as regras e os termos.",
    },
    finalCta: {
      eyebrow: "Chega junto",
      title: "A internet também é feita das escolhas da gente.",
      description:
        "O énóis ainda está evoluindo, e é agora que dá para ajudar a definir o que ele vai ser. Criar conta é gratuito, leva um minuto e não pede cartão.",
      free: "Acesso gratuito é princípio, não promoção: sem anúncio, sem plano pago e sem versão premium pela metade.",
      createAccount: "Fazer parte do énóis",
      existingAccount: "Já tenho conta",
      finePrint: "Sem cartão de crédito · Sem anúncios · Sem plano premium",
    },
    securityNote: {
      eyebrow: "Aviso a quem testa segurança",
      title: "Testem na sandbox, não contra a nossa API.",
      body: "Pedimos, por favor, que os testes de segurança sejam realizados em ambiente de sandbox, e não contra a nossa API. Temos os repositórios abertos, tudo é 100% open source, e damos autorização apenas para testes realizados em ambiente simulado. Todo teste executado contra a nossa API será encarado como crime cibernético e denunciado como tal.",
      closing:
        "Somos uma rede social sem fins lucrativos que quer ser melhor junto da comunidade. Pedimos que não tentem destruir ideias livres e gratuitas que apenas querem trazer o bem.",
      repoLink: "Ver os repositórios abertos",
    },
    footer: {
      copyright: (year: number) =>
        `© ${year} Énóis · Uma rede feita com as pessoas, todos os dias.`,
      tagline:
        "Uma rede social gratuita feita por gente, sem anúncios, sem paywall, em construção com quem usa.",
      sectionsLabel: "Nesta página",
      projectLabel: "O projeto",
      privacy: "Privacidade",
      terms: "Termos",
      contact: "Contato",
      api: "API pública",
      seals: "Selos",
      about: "Sobre o énóis",
      home: "Início",
      emotesTitle: "De onde vêm as figurinhas",
      emotes:
        "As figurinhas das conversas não são nossas nem foram feitas por nós: vêm do BetterTTV e do FrankerFaceZ, e cada uma continua pertencendo a quem a criou. O énóis não vende, não licencia e não usa essas imagens fora do site — mantém só uma cópia em cache, para elas abrirem na hora nas conversas. Se você é autor de uma figurinha e quer que ela saia do ar aqui, escreva pela página de contato e ela sai.",
      emotesRemoval: "Pedir a remoção de uma figurinha",
    },
  },

  /**
   * Página "Sobre o énóis" e o aviso de independência que também aparece no rodapé.
   *
   * O texto do `disclaimer` é o pedido da Mel, palavra por palavra: ele existe para afastar
   * confusão com organizações homônimas (por exemplo, a ONG de jornalismo de mesmo nome). Não é
   * uma promessa de proteção de marca — é uma declaração de identidade do projeto.
   */
  about: {
    seoTitle: "Sobre o énóis · Projeto independente e sem fins lucrativos",
    seoDescription:
      "O énóis é um projeto independente, comunitário e sem fins lucrativos. Leia o aviso de independência em relação a outras organizações e marcas de nome semelhante.",
    title: "Sobre o énóis",
    intro:
      "Uma rede social gratuita feita por gente, sem anúncios, sem paywall, em construção com quem usa.",
    independenceTitle: "Projeto independente",
    disclaimer:
      "O énóis é um projeto independente, comunitário e sem fins lucrativos, desenvolvido com o objetivo de promover conexões e interações entre pessoas. Não possuímos vínculo, afiliação ou associação com outras organizações ou marcas de nome semelhante, salvo quando expressamente informado.",
    contact: "Dúvidas sobre a identidade do projeto podem ser enviadas pela página de contato.",
    back: "Voltar para a página inicial",
  },

  feed: {
    seo: {
      title: "Énóis · Início",
      description: "Seu feed de insights, perguntas e projetos da comunidade profissional.",
    },
    you: "Você",
    refreshing: "Atualizando publicações…",
    loadingMore: "Carregando mais publicações...",
    endOfFeed: "Você chegou ao fim do feed.",
    loadMore: "Carregar mais",
    scrollToTop: "Voltar ao topo",
    empty: "Nada por aqui ainda. Publicações da sua rede aparecem neste feed.",
    composer: {
      removeMedia: "Remover mídia",
      topic: "Assunto",
      topicNone: "Sem assunto",
      topicHint: "Liga o post ao que a gente quer ver (ou não quer) na personalização.",
      schedule: "Agendar",
      scheduleDate: "Data e hora",
      scheduleConfirm: "Agendar publicação",
      scheduleHint: "O post só entra no feed na hora marcada.",
      scheduleDone: (date: string) => `Post agendado para ${date}.`,
      scheduleCancelled: "Agendamento cancelado.",
      scheduledTitle: (count: number) =>
        `${count} ${count === 1 ? "post agendado" : "posts agendados"}`,
      scheduledFor: (date: string) => `Vai ao ar em ${date}`,
      scheduledPage: "Página agendada",
      scheduleCancel: "Cancelar agendamento",
      publishedOffer: "Publicado! Que tal levar esse insight para o LinkedIn também?",
      linkedinShare: "Compartilhar no LinkedIn",
      placeholder: "Compartilhe algo que aprendeu hoje...",
      types: {
        insight: "Insight",
        article: "Artigo",
        business: "Corporativo",
        question: "Pergunta",
        project: "Projeto",
        opportunity: "Oportunidade",
        news: "Notícia",
        tutorial: "Tutorial",
        review: "Avaliação",
        divertido: "Divertido",
        moment: "Momento",
        momentHint: "Momento se apaga sozinho em 24 horas.",
        poll: "Enquete",
        pollHint: "O campo de cima é o título da enquete; abaixo entram de 2 a 6 alternativas.",
      },
      typePicker: {
        label: "Tipo",
        change: "Trocar o tipo da publicação",
      },
      article: {
        bodyLabel: "Texto do artigo",
        bodyPlaceholder: "Escreva o artigo. O campo de cima é o título que aparece no feed.",
        bodyHint:
          "Artigo aceita até 4.000 caracteres (post comum aceita 1.200) e o texto fica guardado separado do post.",
      },
      media: "Mídia",
      video: "Vídeo",
      mediaCount: (count: number) => `${count} ${count === 1 ? "mídia" : "mídias"}`,
      mediaSpoiler: "Marcar mídias como spoiler",
      mediaSpoilerActive: "Mídias marcadas como spoiler",
      uploadProgress: (progress: number) => `Enviando... ${progress}%`,
      imageChecking: "Verificando imagem...",
      imageCheckError: "Não foi possível verificar esta imagem. Remova e tente novamente.",
      publishError: "Erro ao publicar. Tente novamente.",
      publishErrorTitle: "Não foi possível publicar:",
      page: "Página",
      pagePlaceholder: "Cole aqui o HTML da sua página...",
      pageLabel: "HTML da página",
      pageDescription:
        "Uma página é uma coisa ou outra: o HTML dela é o conteúdo do post, sem texto separado. Imagem, vídeo e áudio por link https tocam dentro dela; scripts, formulários e requisições externas não rodam. Link de YouTube, Vimeo, Twitch, Dailymotion ou Spotify vira player embutido logo abaixo da página — o quadro em si não executa script, então o player é montado pelo próprio énóis. Documento (PDF) vira link e abre no visualizador do navegador.",
      pageEmpty: "Cole um HTML para ver a pré-visualização.",
      professionalSetupTitle: "Publique como profissional",
      professionalSetupBody:
        "Aqui no Profissional, o que você publica sai pelo seu perfil profissional. Crie ou ative o seu para começar.",
      professionalSetupCta: "Configurar perfil profissional",
      corporateDestination: (name: string) =>
        `Publicando como ${name}. Esta publicação vai para o feed profissional.`,
    },
    tabs: {
      forYou: "Para você",
      news: "Notícias",
      tutorials: "Tutoriais",
      opportunities: "Oportunidades",
      reviews: "Avaliações",
      fun: "Diversão",
      all: "Tudo",
      following: "Seguindo",
      discussions: "Discussões",
      unseen: "Ainda não vi",
      trending: "Em Alta",
      interacted: "Interações",
      projects: "Projetos",
      corporate: "Corporativo",
      type: "Tipo de feed",
      openList: "Escolher o tipo de feed",
      allTypes: "Todos os tipos",
    },
    sidebar: {
      connections: "Conexões",
      followers: "Seguidores",
      suggestions: "Sugestões para você",
      refreshSuggestions: "Ver outras sugestões",
      suggestionsDescription: "Com base em interesses e objetivos em comum.",
      connect: "Conectar",
      happeningNow: "Acontecendo agora",
      seeAllEvents: "Ver todos os eventos",
      confirmed: (count: number) => `${count} ${count === 1 ? "confirmado" : "confirmados"}`,
      eventMeta: (date: string, format: string, confirmed: string) =>
        `${date} · ${format} · ${confirmed}`,
    },
  },

  posts: {
    mediaSpoiler: {
      badge: "SPOILER",
    },
    /** Enquete: o voto é único e definitivo — a tela diz isso antes e depois de votar. */
    poll: {
      optionsLabel: "Alternativas",
      optionPlaceholder: (position: number) => `Alternativa ${position}`,
      addOption: "Adicionar alternativa",
      removeOption: "Remover alternativa",
      hint: "De 2 a 6 alternativas, até 120 caracteres cada.",
      vote: "Votar",
      voting: "Registrando seu voto...",
      votes: (total: number) => (total === 1 ? "1 voto" : `${total} votos`),
      noVotes: "Nenhum voto ainda",
      yourVote: "Seu voto",
      locked: "Voto único — não dá para trocar depois.",
      error: "Não foi possível registrar o voto agora.",
      alreadyVoted: "Você já votou nesta enquete — o voto não pode ser trocado.",
    },
    /** Fixar UM post no topo do feed da comunidade/grupo (a administração faz isso). */
    pin: {
      pin: "Fixar no topo",
      unpin: "Desafixar",
      pinned: "Fixado",
      error: "Não foi possível atualizar o fixado agora.",
    },
    page: {
      frameTitle: "Página publicada no post",
      loading: "Carregando a página...",
    },
    owner: {
      editDescription: "Atualize o texto. Tags, mídias e a comunidade continuam como estão.",
      deleteTitle: "Excluir publicação?",
      deleteDescription:
        "A publicação sai do feed para todo mundo e deixa de aparecer para quem acessar o link. As tags e mídias param de ser exibidas.",
      confirmDelete: "Excluir",
      edited: "Publicação atualizada.",
      deleted: "Publicação excluída.",
      undo: "Desfazer",
      error: "Não foi possível concluir. Tente novamente.",
    },
    /**
     * Selos de post: a sinalizacao ao lado da reacao. Nove selos em grade 3x3 no seletor; um por
     * pessoa por post (clicar de novo tira, clicar em outro troca).
     */
    seals: {
      error: "Nao foi possivel salvar o selo. Tente novamente.",
    },
    reactions: {
      error: "Não foi possível reagir. Tente novamente.",
      restrictedError: "Sua conta está restrita e não pode reagir agora. Veja em Penalidades.",
      sessionError: "Sua sessão expirou. Entre de novo para reagir.",
      rateLimitError: "Calma aí — muitas ações em pouco tempo. Aguarde um minuto e tente de novo.",
      /** Sem resposta do servidor (rede, bloqueio do proxy): não é recusa da reação. */
      networkError: "Não conseguimos falar com o servidor agora. Tente de novo em instantes.",
      emojis: {
        LIKE: "👍",
        LOVE: "❤️",
        LAUGH: "😂",
        ROFL: "🤣",
        WOW: "😮",
        SAD: "😢",
        ANGRY: "😡",
        DISGUST: "🤢",
        SKEPTICAL: "🤨",
        CELEBRATE: "🎉",
        SUPPORT: "💪",
        INSIGHTFUL: "💡",
        EYES: "👀",
        NOTE: "📝",
        FIRE: "🔥",
        CLAP: "👏",
        CLOWN: "🤡",
        NAILS: "💅",
      },
    },
    report: {
      title: "Denunciar post",
      action: "Denunciar",
      success: "Denúncia enviada. Você acompanha em Minhas denúncias.",
      error: "Não foi possível enviar a denúncia. Tente novamente.",
    },
    reposted: "Republicado no seu perfil.",
    alreadyReposted: "Você já republicou este post.",
    repostError: "Não foi possível republicar agora.",
    shareCopied: "Link da publicação copiado!",
    editPhoto: "Editar foto",
    comments: {
      placeholder: "Comente com contexto, dúvida ou referência...",
      pinError: "Não foi possível fixar o comentário.",
      editError: "Não foi possível salvar a edição. Tente de novo.",
      acceptError: "Não foi possível atualizar a resposta da dúvida. Tente de novo.",
    },
    notes: {
      sent: "Nota enviada para moderação.",
      error: "Não foi possível enviar a nota.",
    },
  },

  time: {
    now: "agora",
    minutesAgo: (minutes: number) => `há ${minutes} min`,
    hoursAgo: (hours: number) => `há ${hours} h`,
    daysAgo: (days: number) => `há ${days} ${days === 1 ? "dia" : "dias"}`,
  },

  profile: {
    seoFallbackTitle: "Perfil",
    seoFallbackDescription: "Perfil profissional",
    seoTitle: (name: string) => `${name} · Énóis`,
    notFound: "Pessoa não encontrada",
    backHome: "Voltar para o início",
    loadError: "Não foi possível carregar este perfil.",
    editProfile: "Editar perfil",
    message: "Mensagem",
    city: {
      add: "Informar cidade",
      edit: (place: string) => `Editar cidade: ${place}`,
      title: "Sua cidade",
      description:
        "Usamos sua cidade para sugerir comunidades e encontros por perto. Ela é separada do campo de localização livre.",
      saved: "Cidade atualizada.",
    },
    resume: {
      removed: "Currículo removido.",
      saved: "Currículo atualizado.",
      error: "Não foi possível salvar o currículo. Tente novamente.",
    },
    /** Etiqueta ao lado do nome: "vulgo Java". */
    aka: (value: string) => `vulgo ${value}`,
    connect: "Conectar",
    removeConnection: "Remover conexão",
    cancelRequest: "Cancelar solicitação",
    unblockUser: "Desbloquear",
    blockedBadge: "Você bloqueou esta pessoa. O conteúdo dela está escondido.",
    blockedTitle: "Usuários bloqueados",
    blockedSeoTitle: "Usuários bloqueados · Énóis",
    blockedDescription:
      "Estas pessoas estão escondidas para você: os posts, comentários e notificações delas não aparecem em lugar nenhum do app.",
    blockedEmpty: "Você não bloqueou ninguém.",
    blockedHint:
      "O bloqueio vale para sempre e os dois lados deixam de se ver. Desbloqueie aqui quando quiser.",
    blockedSince: (date: string | null) => (date ? `Bloqueado em ${dataCurta(date)}` : "Bloqueado"),
    mute: "Silenciar",
    unmute: "Remover silêncio",
    mutedTitle: "Usuários silenciados",
    mutedSeoTitle: "Usuários silenciados · Énóis",
    mutedDescription:
      "Estas pessoas estão silenciadas: os posts, mensagens e notificações delas não aparecem para você, mas elas não sabem.",
    mutedEmpty: "Você não silenciou ninguém.",
    mutedHint:
      "O silêncio esconde o conteúdo da pessoa sem que ela saiba. Diferente do bloqueio, a pessoa ainda pode ver você. Remova o silêncio aqui quando quiser.",
    mutedSince: (date: string | null) => (date ? `Silenciado em ${dataCurta(date)}` : "Silenciado"),
    openToWork: "Aberto a oportunidades",
    mentorAvailable: "Mentor disponível",
    connectionsMeta: (count: number) => `· ${count} ${count === 1 ? "conexão" : "conexões"}`,
    reputationMeta: (value: number) => `★ ${value} reputação`,
    /** A lista é de chegada: cada linha mostra há quanto tempo a pessoa entrou. */
    joinedToday: "chegou hoje",
    joinedDaysAgo: (days: number) => `há ${days} ${days === 1 ? "dia" : "dias"}`,
    recommendationQuote: (comment: string) => `"${comment}"`,
    imageUploadError: "Não foi possível enviar a imagem. Tente novamente.",
    avatarUnknown: "?",
    bannerHtml: {
      action: "Mudar capa",
      frameTitle: "Capa em HTML do perfil",
      saved: "Capa atualizada.",
      error: "Não foi possível salvar a capa. Tente novamente.",
    },
    bioHtml: {
      frameTitle: "Bio em HTML do perfil",
      saved: "Bio atualizada.",
      error: "Não foi possível salvar a bio. Tente novamente.",
    },
    projects: {
      title: "Projetos",
      saved: "Projeto salvo.",
      error: "Não foi possível salvar o projeto.",
    },
    githubImport: {
      imported: (created: number, skipped: number, invalid: number) => {
        const parts = [`${created} ${created === 1 ? "projeto importado" : "projetos importados"}`];
        if (skipped > 0) parts.push(`${skipped} já estava${skipped === 1 ? "" : "m"}`);
        if (invalid > 0) parts.push(`${invalid} inválido${invalid === 1 ? "" : "s"}`);
        return parts.join(" · ");
      },
      error: "Não foi possível importar agora. Tente de novo.",
      readmeSaved: "Bio atualizada com o README.",
      readmeError: "Não foi possível ler o README agora.",
    },
    sections: {
      about: "Sobre",
      skills: "Habilidades",
      goals: "Objetivos profissionais",
      recentPosts: "Publicações recentes",
      availability: "Status atual",
      recommend: "Recomendar",
      recommendations: "Depoimentos",
      ranking: "Ranking",
      links: "Links",
    },
    dashboard: {
      progressTitle: "Presença no Énóis",
      reputationLabel: "reputação",
      postsLabel: "publicações",
      connectionsLabel: "conexões",
      followersLabel: "seguidores",
      composer: {
        success: "Publicação enviada.",
        error: "Não foi possível publicar agora. Tente novamente.",
      },
    },
    /** O título continua "Ranking"; a linha abaixo dele diz QUEM está ali (chegada, não disputa). */
    newMembersHint: "Quem está chegando agora — os mais recentes primeiro.",
    noPosts: "Ainda não há publicações.",
    availabilityUnknown: "Não informada",
    recommendDescription: "Recomende este perfil para ajudar a comunidade.",
    recommendAction: "Recomendar",
    recommendTitle: (name: string) => `Recomendar ${name}`,
    recommendPlaceholder: "Descreva como conhece este profissional...",
    sendRecommendation: "Enviar recomendação",
    userFallback: "Usuário",
    cropAvatar: "Ajustar foto de perfil",
    cropCover: "Ajustar foto de capa",
    avatarFallback: "Avatar",
    edit: {
      usernameTaken: "Este username já está em uso",
      birthDateInvalid: "Informe uma data de nascimento válida — é preciso ter 18 anos ou mais.",
    },
  },

  blog: {
    seoFallbackTitle: "Blog",
    seoTitle: (name: string) => `${name} · Blog · Énóis`,
    seoDescription: (name: string) =>
      `O cantinho de ${name} no Énóis: textos, imagens e páginas do jeito que a pessoa escreveu.`,
    title: "Blogs",
    description:
      "Cantinhos de quem escreve por aqui: portfólio, diário, receitas, o que a pessoa quiser — sem passar pelo feed.",
    myBlog: "Meu blog",
    create: "Criar meu blog",
    edit: "Editar blog",
    newPost: "Novo post",
    subscribe: "Inscrever-se",
    subscribed: "Inscrito",
    unsubscribe: "Sair da inscrição",
    subscribeHint: "As novidades deste blog aparecem no seu Para você — e só lá.",
    empty: "Nenhum post ainda.",
    emptyDirectory: "Ainda não há blogs por aqui. Crie o seu.",
    searchPlaceholder: "Buscar blogs por título ou descrição...",
    searchEmpty: "Nenhum blog encontrado para esta busca.",
    postsCount: (count: number) => `${count} ${count === 1 ? "post" : "posts"}`,
    notFound: "Blog não encontrado.",
    backToBlogs: "Ver todos os blogs",
    /** Post escrito no editor livre: na lista não há resumo em texto, então o card diz o que é. */
    pagePost: "Página em HTML/CSS",
    editor: {
      postTitle: "Título do post",
      modeText: "Texto",
      modeHtml: "HTML/CSS",
      write: "Editar",
      preview: "Pré-visualizar",
      textHint: "Use Markdown para formatar o texto.",
      htmlHint: "Cole o HTML que quiser — ele é sanitizado antes de publicar.",
      publish: "Publicar",
      savePost: "Salvar",
      published: "Post publicado. Quem segue seu blog foi avisado.",
      draftSaved: "Rascunho salvo neste navegador.",
      draftSaveError:
        "Não foi possível salvar o rascunho neste navegador. Mantenha esta página aberta.",
      notifySubscribers: "Avisar os assinantes por e-mail",
      notifySubscribersHint:
        "Quem assina o seu blog recebe um e-mail com este post (além da notificação no app). Dá para desativar só para este post.",
      updated: "Post atualizado.",
      editPost: "Editar post",
      deletePost: "Excluir post",
      deleteHint: "O post sai do seu blog e do feed de quem segue. Não dá para desfazer.",
      deleted: "Post excluído.",
      error: "Não foi possível salvar. Tente novamente.",
    },
  },

  /**
   * Énóis Games: o catálogo, a página do criador e o player.
   *
   * O texto diz o que é verdade: o Énóis NÃO hospeda o jogo — ele roda onde o criador publicou, e
   * aqui é o convite. Quando o site de origem proíbe quadro, a tela explica em vez de fingir falha.
   */
  marketplace: {
    purchaseConfirmed: "Compra confirmada",
    purchaseHeld:
      "As faíscas ficam retidas com segurança até você confirmar que recebeu o conteúdo. Se algo der errado, o reembolso devolve tudo.",
    keepShopping: "Continuar comprando",
    details: "Ver detalhes",
    previewHint:
      "Amostra com as cores do pacote. O item pode incluir outros ajustes além da paleta.",
    soldBy: "Vendido por",
    noDescription: "Quem vende não escreveu uma descrição para este item.",
    escrowHint: "As faíscas ficam retidas até você confirmar que recebeu (ou por 7 dias).",
    buy: "Comprar",
    buying: "Retendo faíscas…",
    buyError: "Não foi possível comprar agora. Confira seu saldo e tente de novo.",
  },
  projects: {
    seoTitle: "Projetos da comunidade · Énóis",
    seoDescription:
      "Projetos criados por quem está aqui: apps, sites, pesquisas, arte e experimentos.",
    title: "Projetos da comunidade",
    description:
      "Espaço separado dos jogos para mostrar o que você construiu: link do projeto, repositório, categoria e tags. Envio passa pela moderação.",
    searchPlaceholder: "Buscar projeto, criador ou tag",
    orderRecent: "Recentes",
    orderTitle: "A-Z",
    submit: "Enviar projeto",
    loadMore: "Carregar mais",
    empty: "Nenhum projeto encontrado.",
    emptyHint: "Você fez algo? Envie o link e ele aparece aqui depois da revisão.",
    error: "Não foi possível carregar os projetos agora.",
    openProject: "Abrir projeto",
    openRepo: "Ver repositório",
    notFound: "Projeto não encontrado.",
    back: "Voltar",
    submittedBy: (name: string) => `por ${name}`,
    status: {
      SUBMITTED: "Em revisão",
      PUBLISHED: "Publicado",
      REJECTED: "Recusado",
      SUSPENDED: "Suspenso",
    },
    editor: {
      editTitle: "Editar projeto",
      saving: "Salvando…",
      cancel: "Cancelar",
      sent: "Projeto enviado para revisão.",
      updated: "Projeto atualizado.",
      error: "Não foi possível salvar o projeto.",
    },
    panel: {
      title: "Meus projetos",
      description: "Envie, edite, reenvie recusados e apague seus projetos.",
      resubmit: "Reenviar",
      remove: "Excluir",
      removed: "Projeto excluído.",
      reviewNote: (note: string) => `Recusado: ${note}`,
    },
  },
  games: {
    title: "Jogos",
    searchPlaceholder: "Buscar jogo, criador ou tag",
    /** Categorias de jogo: a comunidade e os jogos diários (que eram uma página à parte). */
    categoryCommunity: "Jogos da comunidade",
    categoryDaily: "Jogos diários",
    categoryHint: "Os jogos da comunidade e os desafios do dia moram no mesmo lugar.",
    allGamesTitle: "Todos os jogos",
    allGamesHint: "O catálogo inteiro da comunidade, para ir direto no que você procura.",
    allGamesShow: "Ver o catálogo",
    allGamesHide: "Esconder o catálogo",
    dailyNeedsAccount: "Os desafios do dia são para quem tem conta",
    dailyNeedsAccountHint:
      "Entre para jogar palavras, labirinto e blocos — e concuir os três rende faíscas.",
    dailyEnter: "Entrar para jogar",
    mostPlayed: "Mais jogados",
    alphabetical: "A-Z",
    loadMore: "Carregar mais",
    empty: "Nenhum jogo encontrado com esses filtros.",
    loading: "Carregando…",
    /** Página do criador. */
    developer: {
      notFound: "Criador não encontrado.",
      games: (count: number) => `${count} ${count === 1 ? "jogo" : "jogos"}`,
      followers: (count: number) => `${count} ${count === 1 ? "seguidor" : "seguidores"}`,
      follow: "Acompanhar",
      following: "Acompanhando",
      devChip: "Dev de jogos",
      editPage: "Editar minha página",
      noGames: "Nenhum jogo publicado ainda.",
    },
    /** Painel de quem publica. */
    panel: {
      title: "Painel do criador",
      description:
        "Aqui você edita a sua página de criador e acompanha a moderação dos seus jogos. Enviar um jogo novo é pelo botão da aba Jogos.",
      profileTitle: "Minha página de criador",
      displayName: "Nome de estúdio ou criador (opcional)",
      headline: "Uma linha sobre o que você faz",
      bio: "Sobre você ou o estúdio",
      links: "Links separados por vírgula (site, GitHub, itch.io)",
      gamesTitle: "Meus jogos",
      noGames: "Você ainda não enviou nenhum jogo.",
      view: "Ver página",
      saved: "Página salva.",
      error: "Não foi possível salvar agora.",
      /** Upload de imagem do jogo/criador (a mensagem real do backend manda quando existe). */
      uploadError: "Não foi possível enviar a imagem agora.",
      uploadAvatar: "Trocar foto",
      uploadCover: "Trocar capa",
      removeAvatar: "Remover foto",
      removeCover: "Remover capa",
      avatarHint: "Sua foto na página de criador (o Énóis usa a do perfil se não houver).",
      coverHint: "Capa do topo da sua página de criador.",
      edit: "Editar",
      analytics: "Números",
      newUpdate: "Publicar novidade",
      updatePublished: "Novidade publicada.",
      updateError: "Não foi possível publicar a novidade agora.",
      status: {
        SUBMITTED: "Na fila de revisão",
        PUBLISHED: "Publicado",
        REJECTED: "Recusado",
        SUSPENDED: "Fora do ar",
      },
    },
    /** Edição do jogo pelo dono (ficha, endereço, identidade visual e exclusão). */
    editor: {
      deleted: "Jogo excluído da loja.",
    },
    /** Página do jogo e player. */
    game: {
      play: "Jogar",
      playAgain: "Jogar de novo",
      fullscreen: "Tela cheia",
      mobileHint: "No celular, use Tela cheia (ou gire o aparelho) para jogar com mais espaço.",
      openAtOrigin: "Abrir no site do criador",
      loading: "Carregando o jogo…",
      /** O quadro não avisa quando o site recusa incorporação: a pessoa decide tentar de novo. */
      blocked:
        "O jogo não abriu aqui. O site do criador pode não permitir ser exibido dentro de outra página — abra na origem para jogar.",
      retry: "Tentar de novo",
      player: {
        loadingProgress: (progress: number) => `Carregando o jogo… ${progress}%`,
        progressLabel: "Progresso do carregamento do jogo",
        slow: "Está demorando mais que o normal. Jogos WebGL grandes podem levar alguns minutos, principalmente no celular — o jogo continua carregando.",
        ready: "Jogo pronto.",
        unverified:
          "Se o jogo não aparecer, o site do criador pode não permitir ser exibido dentro do Énóis — use “Abrir no site do criador”.",
        error: "O jogo avisou que não conseguiu iniciar.",
        errorDetail: (message: string) => `O jogo avisou que não conseguiu iniciar: ${message}`,
        fullscreenUnavailable:
          "Tela cheia não está disponível neste navegador. Gire o aparelho ou abra no site do criador.",
        unsupportedUrl: "Este endereço não pode ser aberto dentro do Énóis.",
      },
      favorite: "Guardar na biblioteca",
      unfavorite: "Tirar da biblioteca",
      favoriteError: "Não foi possível atualizar a biblioteca agora.",
      accountChanged:
        "Você trocou de conta. Use “Tentar de novo” para o jogo reconhecer a conta atual.",
      favorites: (count: number) => `${count} na biblioteca`,
      share: "Compartilhar",
      shareCopied: "Link do jogo copiado!",
      stats: (plays: number, players: number) =>
        plays === 1
          ? "1 sessão"
          : `${plays} sessões · ${players} ${players === 1 ? "pessoa jogou" : "pessoas jogaram"}`,
      plays: (count: number) =>
        `${count} ${count === 1 ? "partida iniciada" : "partidas iniciadas"}`,
      players: (count: number) => `${count} ${count === 1 ? "jogador" : "jogadores"}`,
      statsHint:
        "Partida iniciada conta cada vez que alguém aperta Jogar — não prova que o jogo terminou de carregar. Jogador conta cada conta uma vez; quem joga sem entrar conta a cada partida.",
      spend: {
        title: "O jogo quer gastar faíscas",
        amount: (value: string) => `${value} faíscas`,
        notice:
          "O gasto só acontece com a sua confirmação. O jogo nunca acessa a sua conta nem a sua sessão — ele apenas pediu.",
        refuse: "Recusar",
        confirm: "Confirmar gasto",
        confirming: "Confirmando…",
        done: "Gasto confirmado — as faíscas saíram da sua carteira.",
        error: "Não foi possível confirmar o gasto agora.",
      },
      achievement: {
        title: "Compartilhar conquista",
        notice: (title: string) =>
          `Publica no seu feed com a tag do jogo ${title}. A imagem e o texto vêm do jogo — confira antes de publicar.`,
        imageAlt: "Imagem enviada pelo jogo",
        cancel: "Cancelar",
        publish: "Publicar no feed",
        publishing: "Publicando…",
        done: "Conquista publicada no seu feed!",
        error: "Não foi possível publicar a conquista agora.",
        uploadsDisabled:
          "O envio de mídia está temporariamente desativado enquanto o armazenamento é migrado.",
      },
      about: "Sobre o jogo",
      details: "Ficha",
      genres: "Gêneros",
      languages: "Idiomas",
      controls: "Controles",
      requirements: "Requisitos",
      warnings: "Avisos de conteúdo",
      version: (value: string) => `Versão ${value}`,
      /** A compra ainda não existe: dizer "em breve" é melhor que esconder o preço. */
      priceSoon: (coins: number) => `${coins} faíscas · compra em breve`,
      free: "Grátis",
      updates: "Novidades do criador",
      noUpdates: "O criador ainda não publicou novidades.",
      by: "por",
      suspended: "Este jogo está fora do ar por decisão da moderação.",
      notPublished: "Este jogo ainda não está publicado — só você vê esta página.",
      external: "Jogo externo",
      reviewsTitle: "Avaliações",
      reviewsEmpty: "Ainda não há avaliações. Seja a primeira pessoa a avaliar.",
      reviewsAverage: (average: number, count: number) =>
        `${average.toFixed(1)} de 5 · ${count} avaliação${count === 1 ? "" : "ões"}`,
      reviewYour: "Sua avaliação",
      reviewRating: "Sua nota",
      reviewBody: "Conte o que achou do jogo (opcional)",
      reviewSubmit: "Publicar avaliação",
      reviewUpdate: "Atualizar avaliação",
      reviewRemove: "Remover minha avaliação",
      reviewSaved: "Avaliação salva.",
      reviewRemoved: "Avaliação removida.",
      reviewError: "Não foi possível salvar a avaliação.",
      reviewOwner: "Você não pode avaliar o próprio jogo.",
      reviewLogin: "Entre para avaliar este jogo.",
      commentsTitle: "Comentários",
      commentsEmpty: "Nenhum comentário ainda. Comece a conversa.",
      commentPlaceholder: "O que você quer dizer sobre o jogo?",
      commentSubmit: "Comentar",
      commentSaved: "Comentário publicado.",
      commentRemoved: "Comentário removido.",
      commentError: "Não foi possível publicar o comentário.",
      commentLogin: "Entre para comentar.",
      commentDelete: "Apagar",
    },
  },

  communities: {
    seoTitle: "Comunidades · Énóis",
    title: "Comunidades",
    description: "Encontre comunidades de gente, fóruns temáticos e círculos de mentoria.",
    topicsLabel: "Categorias",
    searchPlaceholder: "Pesquisar comunidades",
    empty: "Nenhuma comunidade encontrada.",
    createCommunity: "Criar comunidade",
    created: "Comunidade criada.",
    joined: "Você entrou na comunidade.",
    left: "Você saiu da comunidade.",
    actionError: "Não foi possível concluir. Tente novamente.",
    mineTitle: "Minhas comunidades",
    favoritesTitle: "Favoritas",
    emptyFiltered: "Nenhuma comunidade neste local.",
    topics: {
      all: "Todas",
      TECNOLOGIA: "Tecnologia",
      ENGENHARIA: "Engenharia",
      DESIGN: "Design",
      PRODUTO: "Produto",
      LIDERANCA: "Liderança",
      CARREIRA: "Carreira",
      FREELANCE: "Freelance",
      OUTROS: "Outros",
      GAMES: "Jogos",
      ART: "Arte",
      MUSIC: "Música",
      EDUCACAO: "Educação",
      CIENCIA: "Ciência",
      EMPREENDER: "Empreendedorismo",
      FINANCAS: "Finanças",
      MARKETING: "Marketing",
      RH: "Recursos humanos",
      DADOS: "Dados e IA",
      FUN: "Engraçado",
      QUALIDADE_VIDA: "Qualidade de vida",
      SAUDE: "Saúde",
      VIAGEM: "Viagem",
      COMIDA: "Comida e bebida",
      ESPORTES: "Esportes",
      CINEMA: "Cinema e séries",
      LIVROS: "Livros",
      FOTOGRAFIA: "Fotografia",
      CASA: "Casa e decoração",
      PETS: "Pets",
      PARENTALIDADE: "Parentalidade",
      RELACIONAMENTOS: "Relacionamentos",
      MODA: "Moda e estilo",
      POLITICA: "Política",
      RELIGIAO: "Religião",
    },
    memberCount: (count: number) => `${count} membro${count === 1 ? "" : "s"}`,
    participating: "Participando",
    enter: "Entrar",
    leave: {
      title: "Sair da comunidade?",
      description: (name: string) =>
        `Você deixa de participar de "${name}". Os posts dela deixam de aparecer para você até entrar de novo.`,
      confirm: "Sair",
    },
    ownerLeaveBlocked:
      "Você administra esta comunidade. Transfira a administração para outro membro antes de sair.",
    transfer: {
      action: "Transferir administração",
      title: "Transferir administração",
      description:
        "Escolha quem passa a administrar a comunidade. Você continua participando como membro.",
      empty: "Não há outros membros para receber a administração.",
    },
    delete: {
      action: "Excluir comunidade",
      title: "Excluir comunidade?",
      description:
        "A comunidade deixa de existir para todo mundo e os membros são desvinculados. Isso não pode ser desfeito.",
      confirm: "Excluir",
    },
    loadMore: "Carregar mais",
    create: {
      title: "Criar comunidade",
      name: "Nome",
      description: "Descrição",
      topic: "Tópico",
    },
    detail: {
      seoFallback: "Comunidade",
      createdBy: "Criada por ",
      edit: "Editar",
      editTitle: "Editar comunidade",
      composerPlaceholder: "Compartilhe algo com a comunidade...",
      feed: "Feed",
      emptyMember: "Nenhum post ainda. Seja o primeiro!",
      emptyGuest: "Entre na comunidade para ver o feed.",
      membersTitle: (count: number) => `Membros (${count})`,
      admin: "ADMIN",
      cover: "Capa",
      avatar: "Avatar",
      change: "Alterar",
      remove: "Remover",
      addCover: "Adicionar capa",
      addAvatar: "Adicionar avatar",
      cropCover: "Ajustar capa",
      cropAvatar: "Ajustar avatar",
      bannerHtml: {
        title: "Capa da comunidade",
        photoTab: "Foto",
        htmlTab: "HTML/CSS",
        label: "Capa em HTML/CSS",
        description: "Mesma coisa da capa do perfil: HTML+CSS com animação, sem script.",
        placeholder: '<style>\n  @keyframes brilho { ... }\n</style>\n<div class="capa">...</div>',
        empty: "A pré-visualização aparece aqui quando houver código.",
        frameTitle: "Pré-visualização da capa da comunidade",
      },
    },
  },

  studyPairs: {
    seoTitle: "Par de estudo · Énóis",
    seoDescription:
      "Encontre alguém com o mesmo objetivo e façam um check-in curto por semana sobre os estudos.",
    /** "Semana de 26 de out." */
    weekLabel: (monday: string) => `Semana de ${monday}`,
    matched: "Encontramos um par para você.",
    cancelError: "Não foi possível cancelar o pedido. Tente de novo.",
    endError: "Não foi possível encerrar o par. Tente de novo.",
    reenable: "Ligar par de estudo",
    reenableError: "Não foi possível ligar o par de estudo. Tente de novo.",
    search: {
      title: "Procurar por assunto",
      placeholder: "Ex.: Rust, inglês, entrevista",
      hint: "Digite pelo menos 2 letras para ver quem procura par com o mesmo assunto.",
      empty: "Ninguém procurando par com esse termo agora.",
      error: "Não foi possível buscar agora. Tente de novo em instantes.",
      results: (count: number) =>
        count === 1 ? "1 objetivo aberto encontrado" : `${count} objetivos abertos encontrados`,
      action: "Pedir par com esse objetivo",
      noTopic: "Sem tema",
    },
  },

  events: {
    seoTitle: "Eventos · Énóis",
    title: "Eventos da comunidade",
    description: "Webinars, meetups, workshops e encontros — online e presenciais.",
    createEvent: "Criar evento",
    formats: {
      ONLINE: "Online",
      IN_PERSON: "Presencial",
      HYBRID: "Híbrido",
    },
    /** "23 out · 08:00"; o ano só aparece quando não é o atual ("31 dez 2029 · 23:59"). */
    dateTime: (date: string, time: string) => `${dataDeEvento(date)} · ${time}`,
    loading: "Carregando eventos...",
    empty: "Nenhum evento por aqui ainda.",
    emptyRituals: "Nenhum ritual por aqui ainda.",
    createError: "Não foi possível criar o evento. Confira os dados e tente de novo.",
    edit: "Editar evento",
    editTitle: "Editar evento",
    saveEdit: "Salvar alterações",
    editSuccess: "Evento atualizado.",
    editError: "Não foi possível salvar o evento. Confira os dados e tente de novo.",
    editNotOwner: "Só quem criou o evento pode editar ou excluir.",
    remove: "Excluir",
    deleteTitle: "Excluir este evento?",
    deleteDescription:
      "O evento some da lista e quem confirmou presença perde a confirmação. Não dá para desfazer.",
    deleteSuccess: "Evento excluído.",
    deleteError: "Não foi possível excluir o evento.",
    recurrence: {
      timeRequired: "Eventos que se repetem precisam de horário.",
      notOwner: "Só quem criou o evento muda a repetição.",
      updateError: "Não foi possível mudar a repetição. Tente de novo.",
    },
    attendSuccess: "Presença confirmada.",
    attendError: "Não foi possível confirmar a presença.",
    cancelAttendanceSuccess: "Presença cancelada.",
    cancelAttendanceError: "Não foi possível cancelar a presença.",
    form: {
      title: "Título",
      date: "Data",
      time: "Horário",
      host: "Realizador",
      hostPlaceholder: "Comunidade X",
      format: "Formato",
      cover: "Capa",
      coverAction: "Enviar capa",
      coverUploading: "Enviando...",
      removeCover: "Remover capa",
      streamUrl: "Link da transmissão ao vivo",
      streamUrlPlaceholder: "https://...",
      location: "Localização",
      locationPlaceholder: "Rua, número, cidade",
    },
  },

  jobs: {
    visit: "Visitar vaga",
    applyByEmail: {
      resumeHint: "Currículo baixado: anexe no e-mail que acabou de abrir.",
      noProfile: "Entre na sua conta para usar o envio por e-mail.",
    },
    externalBadge: (platform: string) => `Vaga externa · ${platform}`,
    externalNotice: (platform: string) =>
      `Esta oportunidade foi publicada originalmente no ${platform}. A candidatura é feita na plataforma de origem.`,
    /** Cadastro manual de vaga externa (achada em outro site) por quem está na comunidade. */
    external: {
      registerButton: "Cadastrar vaga externa",
      registerError: "Não foi possível cadastrar a vaga externa.",
      myTitle: "Minhas vagas externas",
      myEmpty: "Você ainda não cadastrou vagas externas.",
      delete: "Excluir",
      deleteConfirm:
        "Excluir esta vaga externa? Ela deixa de aparecer para todo mundo — a vaga original continua no site de origem.",
      communityFilter: "Criadas no Énóis",
      applyByEmail: "Enviar candidatura",
    },
    freelancePage: {
      title: "Freelances",
      description:
        "Trabalhos pontuais com escopo fechado, prazo e faixa de valor — pagos em dinheiro ou em faíscas. Qualquer pessoa com conta verificada pode publicar.",
      create: "Publicar freela",
      /** Aviso no topo: contratar (publicar e conversar) exige conta verificada. */
      hiringNoticeTitle: "Quer contratar? Crie sua conta.",
      hiringNotice:
        "Publicar um freela e falar com quem se candidata exige uma conta verificada no Énóis — é o que mantém o combinado rastreável e protege os dois lados. Criar conta é gratuito.",
      hiringNoticeCta: "Criar conta",
      apply: "Candidatar-se",
      applyError: "Não foi possível enviar a mensagem.",
      empty: "Nenhum freela aberto agora.",
      emptyHint: "Publique o primeiro: escopo fechado, prazo e faixa de valor.",
      searchPlaceholder: "Buscar freelances por título ou escopo",
      searchEmpty: "Nenhum freela encontrado",
      searchEmptyHint: "Tente outra palavra ou limpe a busca para ver todos.",
      clearSearch: "Limpar busca",
      deadline: "Prazo",
      close: "Encerrar",
      closeTitle: "Encerrar este freela?",
      closeDescription:
        "Ele sai da lista de abertos. O título e o escopo deixam de aparecer para quem está procurando.",
      closed: "Freela encerrado.",
      createTitle: "Publicar freela",
      titleField: "Título do trabalho",
      scopeField: "Escopo fechado (o que será entregue)",
      budgetMin: "Valor mínimo (faíscas)",
      budgetMax: "Valor máximo (faíscas)",
      budgetMinCash: "Valor mínimo (R$)",
      budgetMaxCash: "Valor máximo (R$)",
      payment: "Pagamento",
      paymentCash: "Dinheiro (R$)",
      paymentFaiscas: "Faíscas",
      paymentCashHint:
        "O Énóis não cobra taxa em dinheiro: o valor é combinado direto com quem publicou.",
      paymentFaiscasHint:
        "Em faíscas, a plataforma retém 10% quando o pagamento é liberado — dinheiro não tem taxa.",
      deadlineField: "Prazo",
      submit: "Publicar",
      error: "Não foi possível salvar o freela.",
      saved: "Freela publicado.",
      edit: "Editar freela",
      editTitle: "Editar freela",
      saveEdit: "Salvar alterações",
      editSuccess: "Freela atualizado.",
      editError: "Não foi possível salvar o freela. Confira os dados e tente de novo.",
      editClosed: "Freela encerrado não pode ser editado.",
      remove: "Excluir",
      deleteTitle: "Excluir este freela?",
      deleteDescription:
        "Ele some da lista e das suas publicações. Propostas já abertas perdem a referência. Não dá para desfazer.",
      deleteSuccess: "Freela excluído.",
      deleteError: "Não foi possível excluir o freela.",
      notOwner: "Só quem publicou pode editar ou excluir o freela.",
    },
    seoTitle: "Vagas · Énóis",
    title: "Oportunidades",
    description: "Vagas filtradas por nível, localização, tipo e habilidades.",
    clearFilters: "Limpar filtros",
    filters: {
      level: "Nível:",
      location: "Local:",
      type: "Tipo:",
      locations: ["Remoto", "Híbrido", "Presencial"],
      /** O backend guarda o código (JUNIOR, INTERN...); a tela mostra o nome em português. */
      levels: { JUNIOR: "Júnior", MID: "Pleno", SENIOR: "Sênior", LEAD: "Liderança" },
      types: { CLT: "CLT", PJ: "PJ", FREELANCE: "Freelance", INTERN: "Estágio" },
    },
    /** Quantas habilidades o card da lista mostra antes do "+N". */
    moreSkills: (count: number) => `+${count}`,
    searchPlaceholder: "Buscar vagas (ex.: java -estágio)",
    /** Ajuda da busca booleana: mostra a sintaxe sem esconder o essencial. */
    searchHint:
      'Combine termos com AND/OU/NOT: "frase exata" nas aspas, -termo exclui, +termo exige e ( ) agrupa. Sem operador, os termos valem como E.',
    searchHelp: "Como buscar",
    skillsPlaceholder: "Habilidades (ex.: Java, Spring)",
    today: "Hoje",
    daysAgo: (days: number) => `Há ${days} ${days === 1 ? "dia" : "dias"}`,
    match: (score: number) => `${score}% match`,
    details: "Ver detalhes",
    apply: "Candidatar-se",
    applied: "Inscrito",
    appliedHint:
      "Sua candidatura foi enviada. A empresa entra em contato pelo seu e-mail cadastrado.",
    back: "Voltar para vagas",
    notFound: "Vaga não encontrada.",
    about: "Sobre a vaga",
    skills: "Habilidades",
    noSkills: "Sem habilidades informadas.",
    save: "Salvar",
    saved: "Salva",
    ownerBadge: "Você publicou esta vaga",
    applicationsCount: (count: number) =>
      `${count} candidatura${count === 1 ? "" : "s"} recebida${count === 1 ? "" : "s"}`,
    deleteJob: "Excluir vaga",
    abandonWarning: (count: number) =>
      `Vaga excluída com ${count} candidato(s) sem resposta. Isso reduz a sua credibilidade.`,
    deleteConfirm:
      "Excluir esta vaga? As candidaturas recebidas também são removidas. Se houver candidatos sem resposta, excluir reduz a sua credibilidade.",
    myJobs: "Minhas vagas",
    myApplications: "Minhas candidaturas",
    myJobsEmpty: "Você ainda não publicou vagas.",
    myApplicationsEmpty: "Você ainda não se candidatou a nenhuma vaga.",
    empty: "Nenhuma vaga encontrada com os filtros selecionados.",
    createJob: "Criar vaga",
    createJobTitle: "Publicar vaga",
    createJobDescription:
      "Descreva a oportunidade com clareza. Vagas falsas zeram a reputação acumulada do autor.",
    gate: {
      title: "Publicação liberada por reputação",
      requirement: (min: number) =>
        `É preciso ter mais de ${min} de reputação para publicar vagas.`,
      missing: (missing: number) => `Faltam ${missing} de reputação para desbloquear.`,
      current: (value: number) => `Sua reputação atual: ${value}.`,
      community:
        "A vaga também precisa estar de acordo com as regras da comunidade: nada de vaga falsa, golpe ou empresa que não confere. Denúncia confirmada derruba sua reputação.",
    },
    /** Só publica quem se declarar de acordo — a declaração fica registrada com data. */
    communityAgreement:
      "Declaro que esta vaga é real e que ela está de acordo com as regras da comunidade. Denúncia confirmada de vaga falsa reduz de forma progressiva a minha reputação.",
    fields: {
      title: "Título da vaga",
      titlePlaceholder: "Ex.: Pessoa Desenvolvedora Back-end",
      company: "Empresa",
      companyPlaceholder: "Nome da empresa",
      companyPage: "Publicar pela página da empresa",
      companyPageNone: "Nenhuma, só o nome",
      companyPageHint: "A vaga aparece na página da empresa e avisa quem segue.",
      location: "Local",
      type: "Tipo",
      level: "Nível",
      salaryMin: "Valor (obrigatório)",
      salaryMinPlaceholder: "Ex.: 1500 ou 8.000",
      salaryMax: "Até (opcional)",
      salaryMaxPlaceholder: "Ex.: 12.000",
      salaryPeriod: "Período",
      salaryPeriodHour: "por hora",
      salaryPeriodDay: "por dia",
      salaryPeriodMonth: "por mês",
      salaryPeriodYear: "por ano",
      salary: "Faixa salarial",
      currency: "Moeda",
      salaryHint: (symbol: string) =>
        `Informe só os números: a vaga aparece como "${symbol} 8.000 – ${symbol} 12.000".`,
      skills: "Habilidades (separadas por vírgula)",
      skillsPlaceholder: "Java, Spring, AWS",
      description: "Descrição (obrigatória)",
      descriptionPlaceholder: "Responsabilidades, requisitos e diferenciais...",
    },
    /** Formulário de candidatura montado por quem publica a vaga. */
    applicationForm: {
      section: "Formulário de candidatura",
      description:
        "Escolha o que perguntar a quem se candidatar. Os campos obrigatórios impedem o envio até serem respondidos.",
      add: "Adicionar campo",
      labelPlaceholder: "Ex.: Anos de experiência com Java",
      required: "Obrigatório",
      remove: "Remover campo",
      empty: "Sem campos: a candidatura vai com o perfil e uma mensagem livre.",
      types: {
        TEXT: "Resposta curta",
        TEXTAREA: "Resposta longa",
        NUMBER: "Número",
        LINK: "Link",
      },
    },
    author: {
      label: "Publicado por",
      reputation: (value: number) => `${value} reputação`,
      verified: "Conta verificada",
      notVerified: "Conta não verificada",
    },
    /** Candidaturas recebidas (lado do empregador). */
    applications: {
      link: "Ver candidaturas",
      title: "Candidaturas recebidas",
      titleFor: (job: string) => `Candidaturas · ${job}`,
      seoTitle: "Candidaturas · Énóis",
      empty:
        "Ninguém se candidatou ainda. Quem se candidatar aparece aqui, e você também recebe por e-mail e na conversa direta.",
      candidate: "Candidato",
      experience: (years: number, count: number) =>
        `${years} ${years === 1 ? "ano" : "anos"} de experiência · ${count} ${count === 1 ? "experiência" : "experiências"}`,
      skills: "Habilidades",
      answers: "Respostas",
      message: "Mensagem",
      reputation: (value: number) => `★ ${value} reputação`,
      openProfile: "Abrir perfil",
      sendMessage: "Conversar",
      backToJob: "Voltar para a vaga",
      error: "Não foi possível carregar as candidaturas.",
      snapshotHint: "Dados do perfil no momento da candidatura.",
      statusLabels: {
        APPLIED: "Recebida",
        IN_REVIEW: "Em análise",
        ADVANCED: "Avançou",
        NOT_SELECTED: "Não selecionada",
      },
      markInReview: "Marcar em análise",
      markAdvanced: "Marcar como avançou",
      markNotSelected: "Não selecionar",
      feedbackFrom: "Retorno da empresa",
      resume: "Currículo",
      backToReview: "Voltar para análise",
      statusUpdated: "Estado atualizado.",
      statusError: "Não foi possível atualizar o estado. Tente novamente.",
    },
    createAction: "Publicar vaga",
    createError: "Não foi possível publicar a vaga. Tente novamente.",
    editJob: "Editar vaga",
    updateError: "Não foi possível salvar a vaga. Tente novamente.",
    closeJob: "Encerrar vaga",
    closeConfirm:
      "Encerrar esta vaga? Ela deixa de receber candidaturas — as que já chegaram continuam disponíveis para triagem.",
    closed: "Encerrada",
    open: "Aberta",
    closedHint: "O processo seletivo desta vaga foi encerrado.",
    loadError: "Não foi possível carregar suas vagas. Tente de novo.",
    identityRequired:
      "Sua conta ainda não está verificada, e publicar/candidatar-se exige verificação. Confirme seu e-mail ou ative a verificação em duas etapas.",
    identityAction: "Verificar minha conta",
    retry: "Tentar de novo",
    fakeBadge: "Vaga marcada como falsa",
    report: {
      action: "Denunciar",
      title: "Denunciar vaga",
      reason: "Motivo",
      description: "Descrição (opcional)",
      fakeLabel: "Vaga falsa",
      fakeHint: "Golpe, vaga inexistente ou empresa que não confere.",
      fakeWarning:
        "Confirmada a denúncia, o autor perde toda a reputação acumulada. Denuncie apenas se tiver certeza.",
      success: "Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.",
      error: "Não foi possível enviar a denúncia. Tente novamente.",
    },
  },

  mentoring: {
    searchPlaceholder: "Buscar mentores por nome, usuário ou especialidade...",
    searchEmpty: "Nenhum mentor encontrado para esta busca.",
    seoTitle: "Mentoria · Énóis",
    loadError: "Não foi possível carregar os mentores agora.",
    retry: "Tentar de novo",
    empty: "Ainda não há mentores publicados. Se você pode ajudar outras pessoas, torne-se mentor.",
    createError: "Não foi possível publicar seu perfil de mentor. Tente novamente.",
    noSlot: "Sem horário publicado",
    /** Agendamento (mentorado). */
    bookTitle: (name: string) => `Agendar mentoria com ${name}`,
    pickSlot: "Escolha um horário",
    slotsLoading: "Carregando horários...",
    slotsError: "Não foi possível carregar os horários.",
    noSlots: "Esta pessoa ainda não publicou horários disponíveis. Tente novamente mais tarde.",
    message: "Mensagem (opcional)",
    messagePlaceholder: "Conte o que você quer trabalhar na sessão.",
    confirmBooking: "Confirmar agendamento",
    booking: "Agendando...",
    bookSuccess:
      "Sessão solicitada! O mentor recebe seu pedido e combina os detalhes com você pela mensagem.",
    bookError: "Não foi possível agendar este horário. Ele pode ter sido reservado agora.",
    /** Agenda (mentor). */
    manageSlots: "Minha agenda",
    slotDate: "Data",
    slotTime: "Hora de início",
    slotDuration: "Duração",
    slotAction: "Publicar horário",
    slotSuccess: "Horário publicado. Quem quiser agendar já consegue escolher.",
    slotError: "Não foi possível publicar o horário. Confira a data e tente de novo.",
    slotListTitle: "Horários publicados",
    slotEmpty: "Nenhum horário publicado ainda. Publique o primeiro abaixo.",
    slotDelete: "Remover",
    slotBooked: "reservado",
    slotDeleteError: "Não foi possível remover este horário.",
    bannerLabel: "Banner do perfil (opcional)",
    bannerHint: "Imagem de capa exibida no seu card de mentor.",
    bannerUpload: "Enviar banner",
    bannerRemove: "Remover banner",
    bannerError: "Não foi possível enviar o banner.",
    badge: "Mentoria nativa",
    title: "Aprenda com quem já passou por onde você quer chegar.",
    description:
      "Sessões reais com mentores verificados — sem performance, sem ruído. Avaliações honestas, trilhas de aprendizado e agendamento em um clique.",
    findMentor: "Encontrar mentor",
    becomeMentor: "Tornar-me mentor",
    becomeMentorTitle: "Tornar-se mentor",
    editMentor: "Editar perfil de mentor",
    editMentorTitle: "Editar perfil de mentor",
    alreadyMentor: 'Você já tem um perfil de mentor. Use "Editar perfil de mentor".',
    featured: "Mentores em destaque",
    featuredDescription: "Avaliados pela comunidade nas últimas 8 semanas.",
    expertise: "Especialidades (separadas por vírgula)",
    expertisePlaceholder: "Java, Spring, React",
    investment: "Investimento",
    free: "Gratuito",
    /** Pagamento em faíscas (a moeda interna, retida em escrow). */
    acceptSparks: "Aceitar faíscas como pagamento",
    acceptSparksHint:
      "O valor fica retido quando alguém agenda e só é liberado para você quando a sessão é concluída. A plataforma fica com 10% e o resto é seu.",
    sparksPrice: "Preço da sessão em faíscas",
    sparksPricePlaceholder: "50",
    sparksPriceHint:
      "Entre 50 e 10.000 faíscas. A taxa da plataforma (10%) já é descontada do seu lado.",
    sparksPriceInvalid: "Informe um preço entre 50 e 10.000 faíscas.",
    sparksAccepted: (price: string) => `aceita faíscas · ${price}`,
    sparksBalance: (balance: string) => `Seu saldo: ${balance} faíscas`,
    sparksBalanceLow: (balance: string, needed: string) =>
      `Saldo insuficiente: você tem ${balance} e a sessão custa ${needed} faíscas.`,
    sparksFeeNote: "Da liberação, a plataforma retém 10% e o mentor recebe o resto.",
    sparksEscrowNote:
      "O valor fica retido na sua carteira ao confirmar e volta integral se você cancelar antes do horário começar.",
    paidWithSparks: (price: string) => `pago com ${price} faíscas`,
    sparksInsufficientError: "Saldo de faíscas insuficiente para esta sessão.",
    sparksPriceRange: (min: string, max: string) => `${min} a ${max} faíscas`,
    freeSession: "Sessão gratuita",
    completeSession: "Concluir sessão",
    completeConfirm:
      "Confirma que a sessão aconteceu? O valor retido é liberado para o mentor, já com a taxa da plataforma descontada. Isso não pode ser desfeito.",
    completingSession: "Concluindo...",
    completeSuccess:
      "Sessão concluída. O valor foi liberado para o mentor, já com a taxa da plataforma descontada.",
    completeError: "Não foi possível concluir a sessão agora.",
    cancelSession: "Cancelar sessão",
    cancelConfirm:
      "Confirma o cancelamento? Se a sessão foi paga em faíscas, o valor volta integral para quem pagou. O horário futuro volta para a agenda.",
    cancellingSession: "Cancelando...",
    agendaKeep: "Voltar",
    cancelSuccess:
      "Sessão cancelada. Se houve pagamento em faíscas, o valor voltou integral para quem pagou.",
    cancelError: "Não foi possível cancelar a sessão agora.",
    mySessionsTitle: "Minhas sessões",
    mySessionsHint: "As mentorias que você agendou e em que pé estão.",
    mySessionsLoading: "Carregando suas sessões...",
    mySessionsError: "Não foi possível carregar suas sessões.",
    mySessionsEmpty: "Você ainda não agendou nenhuma mentoria.",
    mySessionsButton: "Minhas sessões",
    asMenteeTab: "Como mentorado",
    asMentorTab: "Como mentor",
    mentorFallback: "Mentor",
    schedule: "Agendar",
    rating: "Avaliação",
    sessions: "Sessões",
    nextSlot: "Próxima vaga",
    /** Disponibilidade semanal (card de edição). */
    meetingUrl: "Sala da sessão (opcional)",
    meetingRoom: "A sessão acontece nesta sala",
    meetingUrlPlaceholder: "https://meet.google.com/...",
    meetingUrlHint: "Google Meet, Jitsi ou outra sala externa. Quem agendar vê o link.",
    meetingUrlInvalid: "O link precisa começar com https://",
    /** Sala da sessão: Jitsi por sessão (padrão), sala fixa do Jitsi ou sala própria. */
    roomModeTitle: "Onde a sessão acontece",
    roomModeHint:
      "O Jitsi é o padrão: cada sessão ganha um link próprio, criado na hora do agendamento. Você pode usar uma sala fixa sua no Jitsi ou uma sala externa.",
    roomModeSession: "Jitsi — uma sala por sessão",
    roomModeSessionHint: "Nada para configurar. Quem agendar recebe o link da própria sessão.",
    roomModePermanent: "Jitsi — sala fixa",
    roomModePermanentHint:
      "Um link só, que você guarda e repete. Ele não aparece na vitrine: só quem agendou recebe.",
    roomModeCustom: "Minha própria sala",
    roomModeCustomHint: "Google Meet, Zoom ou outra sala externa. Quem agendar vê o link.",
    jitsiRoomName: "Nome da sala fixa (opcional)",
    jitsiRoomNamePlaceholder: "mel-mentoria",
    jitsiRoomNameHint:
      "Letras, números e hífen, de 3 a 100 caracteres. Sem nome, a sala usa o seu identificador aqui.",
    jitsiRoomNameInvalid: "Use só letras, números e hífen (3 a 100 caracteres).",
    permanentRoomTitle: "Sala fixa do Jitsi",
    permanentRoomHint: "As próximas sessões usam este link. Guarde para entrar quando precisar.",
    permanentRoomCopy: "Copiar link",
    permanentRoomCopied: "Link copiado.",
    permanentRoomError: "Não foi possível carregar a sala agora.",
    roomPerSessionNote: "A sala do Jitsi é criada no agendamento e o link aparece aqui.",
    roomPermanentNote: "A sessão usa a sala fixa do Jitsi do mentor; o link aparece aqui.",
    roomCustomNote: "A sessão usa a sala escolhida pelo mentor.",
    enterRoom: "Entrar na sala",
    dialIn: "Entrar por telefone",
    dialInTitle: "Entrar na sala por telefone",
    dialInHint:
      "A sessão é no Jitsi: quando não houver internet, dá para participar por telefone com o PIN da conferência.",
    dialInConference: "Conferência",
    dialInPin: "PIN",
    dialInNumbers: "Números para discar",
    dialInEmpty: "O Jitsi não informou números agora. Entre pelo link da sala.",
    dialInError: "Não foi possível carregar os números de discagem.",
    availabilityTitle: "Disponibilidade semanal",
    availabilityHint:
      "Marque os dias e horários em que você atende. Publicamos as próximas quatro semanas automaticamente — horário já reservado não é removido.",
    availabilityLoading: "Carregando sua disponibilidade...",
    availabilityError: "Não foi possível carregar sua disponibilidade.",
    availabilityAddTime: "Adicionar horário",
    availabilityRemoveTime: "Remover horário",
    availabilityTimeLabel: (day: string) => `Horário de ${day}`,
    availabilitySave: "Salvar disponibilidade",
    availabilitySaved: "Disponibilidade publicada. Os horários já aparecem para quem quer agendar.",
    availabilitySaveError: "Não foi possível salvar. Confira os horários e tente de novo.",
    availabilityFooter: "Horários de uma hora, no fuso de Brasília.",
    weekdays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
    /** Agenda de inscrições (mentor). */
    agendaButton: "Agenda de mentorias",
    agendaTitle: "Quem se inscreveu",
    agendaLoading: "Carregando inscrições...",
    agendaError: "Não foi possível carregar as inscrições.",
    agendaEmpty: "Ninguém se inscreveu ainda. Publique sua disponibilidade para receber pedidos.",
    agendaNoUpcoming: "Nenhuma sessão agendada no momento.",
    agendaUpcoming: "Próximas sessões",
    agendaHistory: "Histórico",
    agendaMessage: "Mensagem",
    agendaOpening: "Abrindo...",
    agendaMessageError: "Não foi possível abrir a conversa. Tente de novo.",
    menteeFallback: "Mentorado",
    statusScheduled: "Agendada",
    statusCompleted: "Concluída",
    statusCancelled: "Cancelada",
  },

  network: {
    seoTitle: "Rede · Énóis",
    title: "Sua rede",
    description: "Construa relacionamentos por afinidade, não por volume.",
    stats: {
      connections: "Conexões",
      requests: "Convites",
    },
    suggestionsTitle: "Pessoas que você pode conhecer",
    suggestionsDescription: "Quem tem mais conexões em comum com você aparece primeiro.",
    suggestionsEmpty: "Nenhuma sugestão por agora. Volte quando a sua rede crescer.",
    mutual: (count: number) => `${count} ${count === 1 ? "conexão" : "conexões"} em comum`,
    connectionsTitle: (count: number) => `Suas conexões (${count})`,
    connectionsEmpty: "Você ainda não tem conexões. Comece pelos convites e pelas sugestões acima.",
    connect: "Conectar",
    requested: "Convite enviado",
    connectFailed: "Não deu certo. Tente de novo.",
    remove: "Remover",
    removeTitle: (name: string) => `Remover ${name} das suas conexões?`,
    removeDescription:
      "A pessoa não é avisada. Para voltar a se conectar, é preciso mandar um novo convite.",
    keep: "Manter",
    reject: "Rejeitar",
    accept: "Aceitar",
  },

  messages: {
    seoTitle: "Mensagens · Énóis",
    title: "Mensagens",
    back: "Voltar",
    new: "Nova",
    searchContacts: "Buscar contatos...",
    noContact: "Nenhum contato encontrado",
    searchConversations: "Buscar conversas",
    noConversations: "Nenhuma conversa ainda",
    noArchived: 'Nada arquivado. O que você apagar "para mim" aparece aqui.',
    restoreSelected: (count: number) => `Restaurar ${count}`,
    restored: "Conversas de volta na caixa de entrada.",
    messagesDeleted: "Mensagens apagadas para você. O outro participante continua vendo.",
    messagesDeleteError: "Não foi possível apagar. Tente novamente.",
    restoreError: "Não foi possível restaurar. Tente novamente.",
    /** Menor de idade só conversa com quem tem conexão aceita (regra do backend). */
    minorRestricted:
      "Para proteger menores de idade, a conversa só é possível depois de uma conexão aceita.",
    openError: "Não foi possível abrir a conversa. Tente novamente.",
    selectConversation: "Selecione uma conversa ou comece uma nova para exibir as mensagens",
    sendError: "Não foi possível enviar a mensagem. Tente de novo.",
    e2eRequired:
      "Ative a criptografia ponta a ponta para enviar e ler mensagens. Suas conversas ficam protegidas e só você e o destinatário podem ler.",
    loadMoreConversations: "Carregar conversas antigas",
    tabs: {
      all: "Todas",
      jobs: "Vagas",
      freelances: "Freelas",
      services: "Serviços",
      archived: "Arquivadas",
    },
    selectMode: "Selecionar",
    cancelSelection: "Cancelar",
    selectAll: "Selecionar tudo",
    clearSelection: "Limpar seleção",
    deleteSelected: (n: number) => `Apagar (${n})`,
    deleteTitle: "Apagar conversas?",
    deleteDescription:
      "As conversas saem da SUA caixa. A outra pessoa continua com a conversa — isto apaga só para você.",
    deleteConfirm: "Apagar",
    deleted: "Conversas apagadas para você.",
    loadingOlder: "Carregando...",
    professionalPrompt:
      "Esta conversa é sobre uma oportunidade profissional. Deseja continuar com seu perfil social ou criar o profissional?",
    professionalPromptCta: "Criar perfil profissional",
    professionalPromptSocial: "Continuar com o social",
    businessDirectError: "Não foi possível abrir a conversa profissional. Tente novamente.",
    requireProfessionalProfile:
      "Ative o seu perfil profissional para iniciar uma conversa de trabalho.",
  },

  developersChrome: {
    start: "Começando",
    modules: "Módulos",
    useCases: "Casos de uso",
    startTitle: "Começando",
    intro:
      "Tudo sob a mesma base da API. As rotas de leitura pública não pedem credencial; as demais usam a sessão do Énóis no header X-Session-Token — o mesmo token que o app usa, obtido no login.",
    chromeIntroPublic:
      "Sem sessão você já consegue: ler post público e comentários, listar comunidades e o feed delas, vagas (com a origem), eventos, mentores, ranking, busca e estatísticas. Escrever (postar, comentar, reagir, denunciar…) pede a sessão de uma conta real.",
    versionTitle: "Versão da API",
    versionHint:
      "Chame pelo caminho versionado: são as mesmas rotas, com o endereço que não muda quando o backend cresce.",
    versionNote:
      "A v1 responde exatamente como a rota sem versão: mesmo corpo, mesmo envelope de erro (código, mensagem e instante). Quem quiser a lista do que existe na versão pede GET /api/v1 — o índice é gerado pelo próprio servidor, então ele não mente.",
    versionNow:
      "Por enquanto a v1 acompanha a API atual: é o mesmo contrato com o endereço fixo. Quando o contrato for congelado, a v1 passa a ser a referência e a rota sem versão vira a que muda.",
    paginationTitle: "Paginação",
    errorsTitle: "Erros",
    idempotencyHint:
      "Operações de escrita aceitam Idempotency-Key: repita a chamada com a mesma chave e a operação não duplica. Em algumas rotas de escrita a chave é obrigatória.",
    copy: "Copiar exemplo",
    copied: "Copiado",
    useCasesTitle: "Casos de uso",
    useCasesIntro:
      "Receitas de ponta a ponta com as chamadas reais — os exemplos de resposta abaixo são capturados da produção, não inventados.",
    securityHint:
      "descreve como reportar vulnerabilidades (resposta em até 90 dias, sem caça a recompensa).",
    guidelinesHint: "O que a plataforma tolera (e o que não tolera) está nas",
  },

  developers: {
    seoTitle: "API do Énóis · Desenvolvedores",
    seoDescription:
      "Documentação da API pública do Énóis: autenticação, endpoints, paginação, erros e políticas.",
    title: "API do Énóis",
    subtitle:
      "Construa clientes, ferramentas e integrações para o Énóis. Esta é a documentação oficial.",
    originsTitle: "Origens autorizadas",
    originsDescription:
      "Toda requisição ao backend precisa de uma origem cadastrada. O navegador manda Origin sozinho; chamadas de servidor (SSR, curl, integrações) precisam mandar X-Client-Origin: https://meuapp.com. A origem do próprio Énóis é liberada automaticamente; cadastre a do seu app abaixo. Rotas de administração e moderação aceitam apenas a origem do frontend.",
    originAdded: "Origem cadastrada.",
    originRemoved: "Origem removida.",
    originError: "Não foi possível cadastrar a origem.",
    sandboxTitle: "API pública = sandbox. Produção só com pedido aprovado",
    sandboxBody:
      "Os exemplos desta página apontam para o ambiente de testes (sandbox). Quem precisa falar com a API de produção abre um pedido no suporte com os dados abaixo — a gente confere e libera o acesso.",
    sandboxFields: [
      "Nome completo",
      "RG e CPF",
      "E-mail e telefone de contato",
      "Empresa/projeto e site (se houver)",
      "Tipo de integração (bot, painel, automação, app, cliente customizado) e o que ela vai fazer",
      "Volumes estimados de requisição e horários de uso",
    ],
    sandboxWhy:
      "Não queríamos frear quem integra: o ambiente separado nasceu por necessidade. Uma onda massiva de ataques e de testes rodando em produção (sondagem de cadastro, varredura de perfis, carga em endpoints de dinheiro) obrigou a separar o que é teste do que é dinheiro de verdade.",
    sandboxCta: "Abrir pedido de acesso à API de produção",
    philosophyTitle: "Filosofia",
    philosophy:
      "A API existe para ampliar o acesso à informação e automatizar processos — nunca para fabricar interação social. Publicar conteúdo automaticamente (IA, bots, integrações) é proibido; criar e agendar posts pela funcionalidade oficial, com você no controle, é permitido.",
    baseUrlHint: "Todas as rotas ficam sob",
    baseUrlNote:
      "Respostas JSON. Timestamps em UTC (ISO-8601). Identificadores são estáveis (prefixados por tipo). Toda requisição precisa de uma origem cadastrada: o navegador manda Origin; chamadas de servidor mandam X-Client-Origin.",
    pagination:
      "Listas paginam por cursor (não por offset). Use o nextCursor da resposta anterior:",
    errors: "Erros têm código e mensagem estáveis, e o HTTP status correspondente:",
    limits:
      "Há limites de tamanho e de taxa por operação. Operações de escrita aceitam Idempotency-Key para você repetir com segurança sem duplicar.",
    statusTitle: "Estado e contato",
    status:
      "Esta é a versão inicial. Escopos de terceiros (OAuth) e o portal completo estão em construção — documentamos apenas o que já existe.",
    securityLinkPrefix: "Vulnerabilidades: reporte em",
  },

  identity: {
    unavailable:
      "A verificação de identidade ainda não está disponível: o Énóis precisa de um provedor autorizado. Assim que houver, o botão fica ativo aqui.",
    resultOk: "Identidade verificada com sucesso.",
    resultError: "Não foi possível concluir a verificação. Você pode tentar de novo.",
  },

  support: {
    seoTitle: "Ajuda e suporte · Énóis",
    title: "Ajuda e suporte",
    subtitle: "Conte o que aconteceu e uma pessoa do nosso time responde por e-mail.",
    error: "Não foi possível enviar o pedido. Tente novamente em instantes.",
    contatoSeoTitle: "Contato · Énóis",
    contactTitle: "Fale com a gente",
    contactDescription:
      "Este é o canal de contato do Énóis. Quem tem conta abre um pedido pelo formulário; quem ainda não tem também consegue falar com o time.",
    contactAccountTitle: "Com uma conta",
    contactAccountDescription:
      "Abra um pedido de ajuda: ele fica registrado no nosso painel de atendimento e uma pessoa do time responde por e-mail.",
    contactEmailTitle: "Sem conta (ou prefere e-mail)",
    contactEmailDescription:
      "Escreva direto para o time de suporte. Conte o que aconteceu e informe o e-mail da sua conta, se tiver.",
  },

  suggestions: {
    seoTitle: "Sugestões · Énóis",
    title: "Sugestões",
    subtitle:
      "Tem uma ideia para o Énóis? Depois que o time aprova, ela vira uma issue pública no GitHub. Seu nome e seu e-mail nunca aparecem lá.",
    target: "Onde a ideia se aplica",
    targets: {
      BACKEND: "Servidor e regras (backend)",
      FRONTEND: "Telas e navegação (frontend)",
      DESIGN_SYSTEM: "Visual e componentes (design system)",
    } as Record<string, string>,
    titleLabel: "Título",
    titlePlaceholder: "Resuma a ideia em uma frase",
    bodyLabel: "Descreva a ideia",
    bodyPlaceholder: "O que você gostaria de ver e por quê?",
    publicNotice:
      "O texto vira público depois da aprovação. Não escreva dados pessoais, como e-mail, telefone ou endereço.",
    validationTitle: "O título precisa ter pelo menos 5 caracteres.",
    validationBody: "Descreva a ideia com pelo menos 20 caracteres.",
    action: "Enviar sugestão",
    sending: "Enviando...",
    error: "Não foi possível enviar a sugestão. Tente novamente em instantes.",
    successTitle: "Sugestão enviada",
    successDescription:
      "O time vai analisar. Se for aprovada, você acompanha o link da issue aqui embaixo.",
    newSuggestion: "Enviar outra",
    mineTitle: "Minhas sugestões",
    mineEmpty: "Você ainda não enviou sugestões.",
    mineError: "Não foi possível carregar suas sugestões.",
    openIssue: "Ver issue no GitHub",
    status: {
      PENDING: "Em análise",
      PUBLISHED: "Publicada",
      REJECTED: "Não aprovada",
    } as Record<string, string>,
    link: "Quer sugerir uma melhoria? Envie uma sugestão",
    admin: {
      empty: "Nenhuma sugestão nesta fila.",
      error: "Não foi possível carregar as sugestões.",
      approve: "Aprovar e publicar",
      reject: "Rejeitar",
      approved: "Sugestão aprovada e issue aberta.",
      rejected: "Sugestão rejeitada.",
      actionError: "Não foi possível concluir a ação.",
      publicWarning:
        "Ao aprovar, o título e o texto abaixo viram uma issue pública. Confira se não há dado pessoal.",
      filterPending: "Em análise",
      filterPublished: "Publicadas",
      filterRejected: "Rejeitadas",
    },
  },

  myReports: {
    seoTitle: "Minhas denúncias · Énóis",
    back: "Voltar",
    title: "Minhas denúncias",
    description:
      "Acompanhe o estado das denúncias que você fez. Cada denúncia também foi enviada ao nosso time de suporte.",
    empty: "Você ainda não fez denúncias.",
    emptyHint: "Se viu algo que quebre as diretrizes, use o botão denunciar no próprio conteúdo.",
    status: {
      PENDING: "Em análise",
      TRIAGED: "Triada",
      AUTO_PENALIZED: "Penalizada (automática)",
      APPROVED: "Procedente",
      DISMISSED: "Não procedente",
    } as Record<string, string>,
    target: {
      POST: "Publicação",
      COMMENT: "Comentário",
      USER: "Perfil",
      JOB: "Vaga",
    } as Record<string, string>,
    reason: {
      SEXUAL_CONTENT: "Nudez ou conteúdo sexual",
      AI_GENERATED: "Conteúdo gerado por IA",
      FAKE_CONTENT: "Conteúdo falso",
      SCAM: "Golpe",
      DISCRIMINATION: "Discriminação",
      PREJUDICE: "Preconceito",
      HARASSMENT: "Assédio",
      SPAM: "Spam",
      VIOLENCE: "Violência",
      COPYRIGHT: "Direitos autorais",
      OTHER: "Outro",
    } as Record<string, string>,
    viewPost: "Ver publicação",
    viewJob: "Ver vaga",
  },

  sanctions: {
    seoTitle: "Penalidades · Énóis",
    back: "Voltar",
    title: "Penalidades",
    description:
      "Restrições ativas na sua conta e o andamento dos seus recursos. A decisão final é sempre de uma pessoa do time.",
    empty: "Nenhuma penalidade na sua conta.",
    emptyHint: "Isto não é um histórico de elogios — é só o que de fato restringiu a conta.",
    type: {
      RESTRICTION: "Restrição",
      SUSPENDED: "Suspensão",
      BAN: "Banimento",
      PERMABAN: "Banimento permanente",
    } as Record<string, string>,
    statusLabel: {
      ACTIVE: "Ativa",
      REMOVED: "Removida",
    } as Record<string, string>,
    appealStatus: {
      PENDING: "Em análise",
      APPROVED: "Aceito",
      DENIED: "Negado",
    } as Record<string, string>,
    appealTitle: "Recorrer da restrição",
    appealDescription:
      "Chega em uma pessoa do time por que a penalidade foi um engano. Seja específico: contexto, intenção e o que a análise pode ter perdido.",
    appealPlaceholder: "Explique o contexto...",
    appealAction: "Enviar recurso",
    appealSent: "Recurso enviado. Avisamos aqui quando houver decisão.",
    appealError: "Não foi possível enviar o recurso. Tente de novo.",
    appealPending: "Seu recurso está em análise. Você será avisado da decisão.",
    restrictedNotice:
      "Sua conta está restrita: você não pode publicar nem comentar enquanto a restrição estiver ativa.",
    bannedNotice: "Sua conta está banida após revisão do recurso. Se precisar, fale com o suporte.",
    suspendedNotice:
      "Sua conta está suspensa: você não entra nem publica até recorrer ou o prazo terminar.",
    moderationTitle: "Moderação · recursos",
    moderationDescription:
      "Fila de recursos de penalidade automática. Aprovar remove a restrição; negar converte em banimento (sessões revogadas).",
    approve: "Aceitar recurso",
    deny: "Negar (banir)",
    moderationEmpty: "Nenhum recurso pendente.",
    decided: "Decisão registrada.",
    moderationError: "Não foi possível registrar a decisão.",
  },

  /**
   * Painel de moderador: candidatura (credibilidade >= 200 + aprovação) e votação das denúncias.
   * Admins (allowlist de username no backend) decidem candidaturas e podem punir qualquer usuário.
   */
  moderator: {
    tabSelector: "Escolher a aba do painel",
    panic: {
      done: (active: boolean) => (active ? "Modo pânico ATIVADO." : "Modo pânico desativado."),
      error: "Não foi possível alterar o modo pânico.",
    },
    seoTitle: "Painel de moderador · Énóis",
    back: "Voltar",
    title: "Painel de moderador",
    description:
      "Analise as denúncias e vote: punir remove o conteúdo e restringe o autor; descartar arquiva a denúncia. A votação fecha quando um lado atinge o quórum.",
    adminBadge: "Admin",
    moderatorBadge: "Moderador",
    error: "Não foi possível carregar o painel.",
    eligibility: {
      title: "Seja moderador",
      description: (min: number) =>
        `Quem tem pelo menos ${min} de credibilidade pode se candidatar. A candidatura é analisada por um administrador; aprovada, libera este painel.`,
      reputation: (value: number, min: number) =>
        `Sua credibilidade: ${value}. Para se candidatar é preciso pelo menos ${min}.`,
      low: (min: number) =>
        `Ainda não chegou lá. Participe das comunidades, receba recomendações e mantenha o perfil atualizado para ganhar credibilidade. O mínimo é ${min}.`,
      motivation: "Por que você quer moderar?",
      motivationPlaceholder:
        "Conte o que você faz na comunidade e como pretende analisar denúncias com justiça.",
      experience: "Experiência com moderação (opcional)",
      experiencePlaceholder: "Comunidades, projetos ou situações que já moderou...",
      availability: "Disponibilidade (opcional)",
      availabilityPlaceholder: "Ex.: algumas horas por semana, horários...",
      apply: "Enviar candidatura",
      sent: "Candidatura enviada. Você será avisado da decisão.",
      error: "Não foi possível enviar a candidatura.",
      pendingTitle: "Candidatura em análise",
      pendingBody:
        "Um administrador vai revisar sua candidatura. Você recebe uma notificação quando houver decisão.",
      rejectedTitle: "Candidatura recusada",
      revokedTitle: "Acesso de moderador revogado",
    },
    reports: {
      title: "Denúncias aguardando revisão",
      empty: "Nenhuma denúncia aguardando revisão.",
      reporter: "Denunciante",
      author: "Autor",
      noAuthor: "Autor não identificado",
      noContent: "Conteúdo indisponível (pode ter sido removido).",
      myVote: (vote: "PUNISH" | "DISMISS") =>
        vote === "PUNISH" ? "Seu voto: punir" : "Seu voto: descartar",
      punish: "Votar para punir",
      dismiss: "Votar para descartar",
      voteError: "Não foi possível registrar o voto.",
      openReview: "Revisão completa (admin)",
      adminActions: "Ações de admin",
      removePost: "Remover postagem",
      warn: "Dar aviso",
      removeTitle: "Remover a postagem denunciada",
      removeBody:
        "A postagem sai do ar e a denúncia é marcada como resolvida. O autor não é banido por esta ação.",
      removeDone: "Postagem removida; denúncia resolvida.",
      warnDone: "Aviso enviado ao autor; a postagem foi mantida.",
      removeCompany: "Remover página empresarial",
      removeCompanyTitle: "Remover a página empresarial denunciada",
      removeCompanyBody:
        "A página sai do diretório e deixa de existir para quem visita; a denúncia é marcada como resolvida. A conta do dono não é afetada — ele é avisado e pode recorrer.",
      removeCompanyDone: "Página empresarial removida; denúncia resolvida.",
      actionError: "Não foi possível concluir a ação.",
      filterAll: "Todas",
      reasons: {
        SEXUAL_CONTENT: "Nudez ou conteúdo sexual",
        AI_GENERATED: "IA gerada",
        FAKE_CONTENT: "Conteúdo falso",
        SCAM: "Golpe",
        DISCRIMINATION: "Discriminação",
        PREJUDICE: "Preconceito",
        HARASSMENT: "Assédio",
        SPAM: "Spam",
        VIOLENCE: "Violência",
        COPYRIGHT: "Direitos autorais",
        OTHER: "Outro",
      } as Record<string, string>,
      targets: {
        POST: "Publicação",
        COMMENT: "Comentário",
        USER: "Usuário",
        JOB: "Vaga",
        GAME: "Jogo",
        GROUP_POST: "Post de grupo",
        GROUP_COMMENT: "Comentário de grupo",
        COMPANY: "Página empresarial",
      } as Record<string, string>,
    },
    tabs: {
      reports: "Denúncias",
      games: "Jogos",
      projects: "Projetos",
      support: "Suporte",
      suggestions: "Sugestões",
      issues: "Issues",
      history: "Histórico",
      appeals: "Recursos",
      disputes: "Contestações",
      applications: "Candidaturas",
      users: "Usuários",
      emails: "E-mails",
      monitoring: "Monitorabilidade",
      contributors: "Contribuintes",
      githubContributions: "Contribuições GitHub",
      pulls: "Pull requests",
      notes: "Notas",
      suspicious: "Contas suspeitas",
      suspiciousPosts: "Posts suspeitos",
      notices: "Avisos",
      releaseNotes: "Novidades",
    },
    suspiciousPosts: {
      result: (deleted: number, failed: number) =>
        `${deleted} post(s) removido(s), ${failed} falha(s).`,
      error: "Não foi possível excluir os posts selecionados.",
    },
    suspicious: {
      result: (banned: number, already: number, failed: number) =>
        `${banned} banida(s), ${already} já estavam banidas, ${failed} falha(s).`,
      /** Quem falhou e por quê: sem isso, "N falha(s)" não diz o que fazer. */
      failures: (details: string) => `Falhas: ${details}`,
      blockedIps: (count: number) =>
        count === 0 ? "" : `${count} IP(s) bloqueado(s) junto com o lote.`,
      error: "Não foi possível banir as contas selecionadas.",
    },
    projects: {
      approved: "Projeto aprovado: já está em /projetos.",
      rejected: "Projeto recusado: o motivo vai para o painel do criador.",
      error: "Não foi possível revisar o projeto.",
    },
    games: {
      approved: "Jogo aprovado: já está no catálogo.",
      rejected: "Jogo recusado: o motivo vai para o painel do criador.",
      error: "Não foi possível decidir sobre o jogo.",
    },
    support: {
      moved: "Ticket atualizado.",
      error: "Não foi possível atualizar o ticket.",
      replySent: "Resposta enviada ao solicitante.",
      replyError: "Não foi possível enviar a resposta.",
    },
    notes: {
      approved: "Nota aprovada e publicada.",
      denied: "Nota negada.",
      error: "Não foi possível revisar a nota.",
    },
    pulls: {
      approved: "PR aprovado.",
      changesRequested: "Mudanças solicitadas.",
      reviewError: "Não foi possível enviar a revisão. Confira a permissão do seu GitHub.",
    },
    notices: {
      title: "Aviso da plataforma",
      description:
        "Um aviso por vez, em HTML e CSS. Publicar reescreve o que está no ar; tirar do ar some com ele.",
      none: "Nenhum aviso no ar.",
      live: (title: string, surface: string) => `No ar: ${title} (${surface}).`,
      titleLabel: "Título",
      titlePlaceholder: "Ex.: Manutenção no marketplace",
      surfaceLabel: "Onde aparece",
      surfaces: {
        BANNER: "Faixa no topo",
        MODAL: "Popup",
        BOTH: "Faixa e popup",
      } as Record<string, string>,
      surfaceHint: "A faixa tem altura fixa: um recado longo cabe melhor no popup.",
      htmlLabel: "Conteúdo (HTML e CSS)",
      htmlHint:
        "Sem JavaScript: o aviso é renderizado num quadro isolado, do mesmo jeito que o post de página.",
      emptyPreview: "Escreva um HTML para ver como fica.",
      formHint: "Quem já fechou o aviso volta a vê-lo depois de uma nova publicação.",
      publish: "Publicar aviso",
      republish: "Republicar alterações",
      publishing: "Publicando…",
      retire: "Tirar do ar",
      published: "Aviso publicado.",
      retired: "Aviso tirado do ar.",
      error: "Não foi possível publicar o aviso.",
    },
    releaseNotes: {
      published: "Novidades publicadas. O popup abre de novo para todo mundo.",
      retired: "Novidades tiradas do ar.",
      error: "Não foi possível publicar as novidades.",
      readErrorTitle: "Não deu para ler as novidades no ar",
      readErrorDescription:
        "Sem saber o que está publicado, o formulário fica fechado para você não sobrescrever nada sem querer.",
      retryRead: "Tentar de novo",
      liveSince: (raw: string) => {
        const at = new Date(raw);
        return Number.isNaN(at.getTime())
          ? ""
          : at.toLocaleString("pt-BR", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            });
      },
    },
    sanction: {
      title: "Punição por votação",
      description:
        "Moderadores propõem e votam. A punição só é aplicada quando mais da metade dos moderadores ativos concorda.",
      lockedTitle: "Votação ainda não disponível",
      locked: (count: number, min: number) =>
        `Hoje são ${count} moderador(es); a votação de punição abre a partir de ${min}. Antes disso, somente administradores podem punir.`,
      target: "Username do usuário",
      targetPlaceholder: "ex.: ana-silva",
      type: "Tipo de punição",
      reason: "Motivo",
      reasonPlaceholder: "Descreva o que aconteceu e por que a punição é necessária.",
      propose: "Abrir votação",
      proposed: "Votação aberta. Os moderadores podem votar no painel.",
      proposeError: "Não foi possível abrir a votação.",
      queueTitle: "Votações abertas",
      empty: "Nenhuma votação de punição aberta.",
      progress: (approve: number, reject: number, required: number) =>
        `Concordam: ${approve} · Rejeitam: ${reject} · Necessário: ${required}`,
      approve: "Concordar",
      reject: "Rejeitar",
      notePlaceholder: "Justificativa do seu voto (opcional)",
      voted: "Voto registrado.",
      voteError: "Não foi possível registrar o voto.",
      myVoteApprove: "Seu voto: concordar",
      myVoteReject: "Seu voto: rejeitar",
      cancel: "Encerrar votação",
      cancelTitle: "Encerrar a votação",
      cancelBody: (username: string) =>
        `Encerrar a votação de punição contra @${username}? Ninguém será punido por esta proposta.`,
      cancelled: "Votação encerrada.",
      cancelError: "Não foi possível encerrar a votação.",
      proposedBy: (username: string) => `Proposta de @${username}`,
    },
    admin: {
      adminsTitle: "Administradores",
      adminsEmpty: "Nenhum administrador além de você.",
      adminsAddLabel: "Username do novo admin",
      adminsAddPlaceholder: "ex.: ana-silva",
      adminsAdd: "Promover a admin",
      adminsPromoted: (username: string) => `@${username} agora é admin.`,
      adminsRevokeError: "Não foi possível atualizar o papel de admin.",
      adminsRevoke: "Remover admin",
      adminsRevokeTitle: "Remover administrador",
      adminsRevokeBody: (username: string) =>
        `Remover @${username} do papel de administrador? A pessoa perde o acesso administrativo.`,
      applicationsTitle: "Candidaturas a moderador",
      applicationsEmpty: "Nenhuma candidatura pendente.",
      applicant: "Candidato",
      motivation: "Motivação",
      experience: "Experiência",
      availability: "Disponibilidade",
      note: "Observação para o candidato (obrigatória ao recusar)",
      notePlaceholder: "Explique a decisão...",
      approve: "Aprovar",
      reject: "Recusar",
      approved: "Candidatura aprovada.",
      rejected: "Candidatura recusada.",
      decisionError: "Não foi possível registrar a decisão.",
      addModeratorTitle: "Adicionar moderador",
      addModeratorDescription:
        "Busque pelo nome ou @username: a pessoa entra direto como moderador, sem candidatura.",
      addModerator: "Adicionar",
      addModeratorError: "Não foi possível adicionar o moderador.",
      moderatorAdded: (username: string) => `@${username} agora é moderador.`,
      moderatorsTitle: "Moderadores ativos",
      moderatorsEmpty: "Nenhum moderador ativo.",
      revoke: "Remover",
      revokeTitle: "Remover moderador",
      revokeBody: (username: string) =>
        `Remover @${username} do time de moderação? A pessoa perde o acesso ao painel.`,
      revoked: "Moderador removido.",
      revokeError: "Não foi possível remover o moderador.",
      sanctionTitle: "Punir um usuário",
      sanctionDescription:
        "Restrição tira o direito de publicar e comentar; banimento derruba as sessões e impede um novo login. A punição fica registrada e o usuário pode recorrer.",
      username: "Nome ou @username",
      usernamePlaceholder: "Busque pelo nome ou @username",
      type: "Tipo de punição",
      restriction: "Restrição (não publica nem comenta)",
      ban: "Banimento (derruba a sessão)",
      reason: "Motivo",
      reasonPlaceholder: "Descreva o que aconteceu e por que a punição é necessária.",
      apply: "Aplicar punição",
      confirmTitle: "Confirmar punição",
      confirmBody: (username: string, type: "RESTRICTION" | "BAN") =>
        `Aplicar ${type === "BAN" ? "banimento" : "restrição"} em @${username}? A ação fica registrada.`,
      done: (username: string, type: "RESTRICTION" | "BAN") =>
        `@${username} punido com ${type === "BAN" ? "banimento" : "restrição"}.`,
      error: "Não foi possível aplicar a punição.",
    },
    penalties: {
      title: "Penalidades aplicadas",
      description:
        "Quem está penalizado agora. Remova uma penalidade aplicada por engano ou corrija o tipo e o motivo sem apagar o registro — a decisão fica registrada na conta de quem levou.",
      filterActive: "Ativas",
      filterRemoved: "Removidas",
      emptyActive: "Nenhuma conta penalizada agora.",
      emptyRemoved: "Nenhuma penalidade removida.",
      loadError: "Não foi possível carregar as penalidades.",
      removedAt: (date: string) => `Removida em ${date}`,
      createdAt: (date: string) => `Aplicada em ${date}`,
      typeRestriction: "Restrição",
      typeSuspended: "Suspensão",
      typeBan: "Banimento",
      typePermaban: "Banimento permanente",
      revoke: "Remover penalidade",
      edit: "Corrigir",
      revokeTitle: "Remover a penalidade",
      revokeBody: (username: string) =>
        `A conta de @${username} volta ao normal e a denúncia de origem é descartada. Se a penalidade era um banimento, o conteúdo que já saiu não volta.`,
      revokeReason: "Por que esta penalidade foi aplicada por engano?",
      revokeReasonPlaceholder: "Explique a correção (pelo menos 10 caracteres).",
      revoked: (username: string) => `Penalidade de @${username} removida.`,
      revokeError: "Não foi possível remover a penalidade.",
      editTitle: "Corrigir a penalidade",
      editBody: (username: string) =>
        `Ajustar a penalidade de @${username}. O registro é o mesmo: só o tipo e o motivo mudam.`,
      editType: "Tipo correto",
      editReason: "Motivo registrado",
      editReasonPlaceholder: "Descreva o motivo correto (pelo menos 10 caracteres).",
      save: "Salvar correção",
      edited: (username: string) => `Penalidade de @${username} corrigida.`,
      editError: "Não foi possível corrigir a penalidade.",
      reasonRequired: "Explique em pelo menos 10 caracteres.",
      cancel: "Cancelar",
      pending: "Salvando…",
    },
  },

  empresas: {
    seoTitle: "Empresas · Énóis",
    title: "Empresas",
    subtitle: "Quem está contratando na rede — a partir das vagas publicadas e agregadas.",
    searchPlaceholder: "Buscar empresa...",
    jobsCount: (n: number) => (n === 1 ? "1 vaga aberta" : `${n} vagas abertas`),
    empty: "Nenhuma empresa encontrada.",
  },
  /** Diálogo global de regularização da data de nascimento (ECA Digital). */
  /** Diálogo global de regularização da data de nascimento (ECA Digital). */
  ageGate: {
    saved: "Data de nascimento registrada. Você já pode publicar.",
    savedMinor:
      "Data registrada. Agora falta a autorização de um responsável para liberar a conta.",
    error: "Não foi possível salvar a data. Tente de novo.",
  },
  /** Aviso da plataforma publicado por um admin (faixa e/ou popup). */
  notices: {
    bannerLabel: "Aviso",
    close: "Fechar aviso",
    closeButton: "Entendi",
    dialogDescription: "Aviso publicado pela equipe do Énóis.",
    publishedOn: (raw: string | undefined) => {
      if (!raw) return "";
      const at = new Date(raw);
      if (Number.isNaN(at.getTime())) return "";
      return `Publicado em ${at.toLocaleString("pt-BR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })}.`;
    },
  },
  /** Canais privados por tema dentro das comunidades. */
  communityChannels: {
    title: "Canais privados",
    created: "Canal criado.",
    error: "Não foi possível criar o canal. Tente de novo.",
  },
  /** Página de um canal privado. */
  channelPage: {
    back: "Voltar para a comunidade",
    composerPlaceholder: "Escreva para este canal...",
    publish: "Publicar no canal",
    publishing: "Publicando...",
    empty: "Nada por aqui ainda. Comece a conversa.",
    private: "Este canal é privado: só membros da comunidade podem ler e publicar.",
    notMember: "Entre na comunidade para acessar este canal.",
    enter: "Entrar na comunidade",
    error: "Não foi possível carregar o canal.",
  },
  /** Área do responsável legal (ECA Digital). */
  guardian: {
    title: "Supervisão parental",
    subtitle: "Autorize ou acompanhe o uso do Énóis por um adolescente sob sua responsabilidade.",
    loginRequired:
      "Entre com a sua conta de adulto para responder ao convite e acompanhar os perfis supervisionados.",
    accepted:
      "Autorização registrada. A conta do adolescente já pode publicar, comentar e enviar mensagens.",
    rejected: "Convite recusado. A conta do adolescente continua somente leitura.",
    inviteTitle: "Pedido de autorização",
    inviteBody:
      "Um adolescente indicou você como responsável legal no Énóis. Aceitar autoriza o uso da rede por ele, com as proteções para menores de 18 anos.",
    bullet1: "Você pode revogar a autorização a qualquer momento.",
    bullet2: "Você não recebe acesso às conversas privadas nem à senha do adolescente.",
    bullet3: "A data de nascimento dele não fica pública.",
    accept: "Autorizar uso",
    reject: "Recusar",
    mineTitle: "Perfis que eu supervisiono",
    loading: "Carregando...",
    none: "Nenhum perfil supervisionado por esta conta.",
    since: (date: string) => `autorizado em ${date}`,
    revoke: "Revogar",
    revoked: "Autorização revogada. A conta voltou ao modo somente leitura.",
    error: "Não foi possível concluir agora. Tente de novo.",
    footer:
      "A autorização parental é registrada com data e versão dos termos. O Énóis não trata a declaração de idade como verificação oficial.",
  },
  /** Supervisão parental: menor sem responsável autorizado (ECA Digital). */
  parentalGate: {
    sent: "Convite enviado ao seu responsável.",
    emailFailed: "Não conseguimos enviar o e-mail agora. Tente novamente em instantes.",
    error: "Não foi possível enviar o convite. Tente de novo.",
  },

  frameShop: {
    title: "Carteira & estilo",
    subtitle: "Suas faíscas, suas escolhas.",
    walletTab: "Carteira",
    marketplaceTab: "Marketplace",
    storeTab: "Loja",
    ownedTab: "Minhas molduras",
    filters: {
      all: "Todas",
      simple: "Simples",
    },
    showMore: "Mostrar mais molduras",
    bought: "Moldura comprada. Agora você pode equipá-la.",
    buyError: "Não foi possível comprar a moldura. Confira seu saldo e tente novamente.",
    equipError: "Não foi possível atualizar a moldura. Tente novamente.",
  },

  /** Seasonal cosmetics: shop actions, status bubble, profile popover and the Saci events. */
  cosmetics: {
    bought: "Item comprado. Agora é só equipar.",
    lookBought: "Look comprado e vestido no seu perfil.",
    equipped: "Item equipado no seu perfil.",
    unequipped: "Item guardado. Ele continua seu.",
    /** One message per API error code of the shop, the status and the events. */
    errors: {
      ITEM_NOT_FOUND: "Esse item não existe mais na loja.",
      ALREADY_OWNED: "Você já tem tudo isso.",
      OUT_OF_SEASON: "Esse item está fora da temporada. Ele volta na próxima.",
      NOT_FOR_SALE: "Esse item é prêmio de evento e não está à venda.",
      INSUFFICIENT_SPARKS: "Você não tem faíscas suficientes para essa compra.",
      MAX_BADGES: "Você já mostra 5 emblemas. Guarde um antes de equipar outro.",
      NOT_OWNED: "Esse item ainda não é seu.",
      INVALID_STATUS_ICON: "Esse ícone não está disponível para você.",
      FIELD_TOO_LONG: "O status pode ter no máximo 60 caracteres.",
      ALREADY_CHOSEN: "Você já escolheu um time.",
      EVENT_CLOSED: "O evento já terminou.",
      INVALID_CHOICE: "Escolha o time do Saci ou o do Halloween.",
      SPOT_NOT_FOUND: "Esse esconderijo não existe.",
    } as Record<string, string>,
    genericError: "Não foi possível concluir agora. Tente de novo.",
    status: {
      action: "Status",
      title: "Seu status",
      description: "Um recado curto que aparece no seu cartão de perfil.",
      textLabel: "Texto",
      placeholder: "Procurando minha carapuça",
      iconLabel: "Ícone",
      noIcon: "Sem ícone",
      freeIcons: {
        cafe: "Café",
        estrela: "Estrela",
        coracao: "Coração",
        chip: "Chip",
      } as Record<string, string>,
      saved: "Status atualizado.",
    },
    peek: {
      open: (name: string) => `Abrir o cartão de ${name}`,
      loadError: "Não foi possível carregar este perfil.",
      retry: "Tentar de novo",
    },
    eventLoadError: "Não foi possível carregar o evento.",
    duelBannerDismiss: "Fechar o duelo",
    duelChosen: "Você entrou no time! O emblema já está no seu perfil.",
    huntFound: (found: number, total: number) => `Você achou o Saci! ${found} de ${total}.`,
    huntCompleted: "Você achou os 7 Sacis! O emblema Achei o Saci já é seu.",
  },

  wallet: {
    seoTitle: "Carteira · Énóis",
    back: "Voltar",
    title: "Faíscas",
    chaveLabel: "Sua chave",
    pay: "Pagar",
    payTitle: "Pagar com faíscas",
    toLabel: "Chave de destino (username)",
    toPlaceholder: "ex.: mari-silva",
    amountLabel: "Quantidade de faíscas",
    messageLabel: "Mensagem (opcional)",
    messagePlaceholder: "Por que você está enviando?",
    irreversible:
      "A transferência é instantânea, isenta de taxa e não tem reversão — confira o nome e o valor com calma.",
    confirm: "Confirmar transferência",
    sent: "Faíscas enviadas!",
    transferError: "Não foi possível transferir. Confira a chave e o saldo.",
    insufficientSparks: "Você não tem faíscas suficientes para esse valor.",
    recipientNotFound: "Não encontramos esse username. Confira a chave de destino.",
    selfTransfer: "Você não pode transferir faíscas para você mesmo.",
    history: "Extrato",
    notice:
      "A faísca existe só dentro do Énóis: circula entre pessoas e vale nos marketplaces da plataforma. Transferências são instantâneas e sem reversão.",
    historyEmpty: "Sem movimentações ainda. A faísca circula quando a comunidade circula.",
    kind: {
      AIRDROP: "Distribuição inicial",
      GENESIS_TREASURY: "Gênese",
      TRANSFER_OUT: "Transferência enviada",
      TRANSFER_IN: "Transferência recebida",
      REWARD: "Recompensa",
      PURCHASE: "Compra",
      SALE: "Venda",
      REFUND: "Reembolso",
      ADJUSTMENT: "Ajuste",
    } as Record<string, string>,
  },

  empresa: {
    editPanel: {
      title: "Editar empresa",
      saved: "Página atualizada!",
      error: "Não foi possível salvar a empresa.",
      uploadError: "O upload da imagem falhou.",
      memberAdded: "Membro adicionado!",
      memberError: "Não foi possível adicionar o membro.",
    },
    seoTitle: (name: string) => `${name} · Énóis`,
    notFound: "Não encontramos esta página de empresa.",
    someone: "Alguém",
    sizeOptions: {
      "1-10": "1 a 10 pessoas",
      "11-50": "11 a 50 pessoas",
      "51-200": "51 a 200 pessoas",
      "201-500": "201 a 500 pessoas",
      "500+": "Mais de 500 pessoas",
    } as Record<string, string>,
    roles: {
      OWNER: "Dono",
      ADMIN: "Admin",
      EDITOR: "Editor",
      RECRUITER: "Recrutador",
    },
    checklist: {
      logo: "Adicionar o logo",
      cover: "Adicionar uma capa",
      about: "Contar o que a empresa faz",
      website: "Informar o site",
      project: "Publicar o primeiro microprojeto",
    },
    created: "Página criada!",
    createError: "Não foi possível criar a página. Confira os dados e tente de novo.",
    published: "Microprojeto publicado!",
    projectError: "Não foi possível publicar. Revise os campos.",
    applySent: "Proposta enviada! A conversa com a empresa já está em Mensagens.",
    applyError: "Não foi possível enviar. Tente de novo.",
    selected: "Proposta escolhida. Avisamos a pessoa.",
    selectError: "Não foi possível escolher esta proposta. Tente de novo.",
    completed: "Microprojeto concluído!",
    completeError: "Não foi possível concluir. Tente de novo.",
    followError: "Não foi possível atualizar. Tente de novo.",
    report: "Denunciar página",
    reportHint:
      "Conte o que há de errado nesta página. A denúncia vai para a moderação e pode levar à remoção dela.",
  },

  guidelines: {
    seoTitle: "Diretrizes da comunidade · Énóis",
    seoDescription:
      "As regras do Énóis: o que é bem-vindo, o que não é tolerado, como funcionam as denúncias e as consequências.",
    title: "Diretrizes da comunidade",
    intro:
      "O Énóis é uma rede humana. O objetivo destas diretrizes é manter um ambiente onde as pessoas constroem reputação de forma honesta e se tratam com respeito.",
    welcomeTitle: "O que é bem-vindo",
    welcome: [
      "Conteúdo de qualquer área: o que você sabe, o que procura e o que quer construir com gente que te entende.",
      "Opiniões e debate, inclusive críticas fortes, desde que sobre ideias, empresas e trabalho, e não contra a pessoa.",
      "Publicação honesta sobre quem você é e o que faz.",
    ],
    zeroToleranceTitle: "Zero tolerância",
    zeroToleranceIntro:
      "Os itens abaixo levam à remoção imediata do conteúdo e, quando confirmados, ao banimento da conta — sem aviso prévio:",
    zeroTolerance: [
      "Racismo, homofobia, transfobia, intolerância religiosa, xenofobia ou qualquer forma de discriminação.",
      "Assédio, ameaça ou incitação à violência contra uma pessoa ou grupo.",
      "Golpes, fraudes e esquemas financeiros que prejudiquem outras pessoas.",
      "Nudez, pornografia e conteúdo sexual explícito, inclusive quando a imagem é o conteúdo e o texto não diz nada.",
      "Conteúdo ilegal, exploração ou sexualização de menores.",
    ],
    notWelcomeTitle: "O que não é bem-vindo",
    notWelcome: [
      "Discurso de ódio disfarçado de opinião e ataque pessoal em vez de crítica ao trabalho.",
      "Spam, publicidade não solicitada, correntes e engajamento artificial.",
      "Conteúdo falso ou enganoso, inclusive vagas falsas e avaliações compradas.",
      "Conteúdo gerado por IA publicado como se fosse sua experiência real, sem identificação.",
      "Exposição de dados pessoais de terceiros (doxxing).",
    ],
    reportsTitle: "Como funcionam as denúncias",
    reports: [
      "Qualquer pessoa pode denunciar conteúdo direto no botão denunciar. A denúncia chega ao time de moderação e ao suporte.",
      "Um sistema automatizado faz a pré-triagem para acelerar a análise, mas quem decide é sempre uma pessoa do time.",
      "Você acompanha o estado das suas denúncias em Minhas denúncias, no menu da conta.",
      "Denúncia falsa e repetida, feita para prejudicar alguém, também é violação.",
    ],
    penaltiesTitle: "Consequências",
    penalties: [
      "Primeira violação leve: remoção do conteúdo e aviso.",
      "Reincidência ou violação grave: perda de recursos (ex.: publicar, comentar) ou suspensão temporária.",
      "Zero tolerância (racismo, assédio, golpe): banimento permanente.",
    ],
    appealsTitle: "Recurso",
    appeals:
      "Se você acredita que uma medida foi aplicada por engano, fale com o suporte. Toda decisão pode ser revista por uma segunda pessoa do time.",
  },

  post: {
    seoTitle: "Publicação · Énóis",
    seoDescription: "Veja esta publicação no Énóis — rede humana gratuita, sem anúncios.",
    back: "Voltar",
    notFound: "Publicação não encontrada.",
  },

  notificationPreferences: {
    seoTitle: "Preferências de notificação · Énóis",
    title: "Preferências de notificação",
    description:
      "Escolha o que chega até você fora do app: o resumo semanal e os avisos no navegador.",
  },

  saved: {
    seoTitle: "Posts salvos · Énóis",
    back: "Voltar",
    title: "Posts salvos",
    count: (count: number) =>
      `${count} post${count === 1 ? "" : "s"} salvo${count === 1 ? "" : "s"}`,
    empty: "Nenhum post salvo ainda. Salve posts para encontrá-los facilmente depois.",
  },

  legal: {
    footer: {
      guidelines: "Diretrizes da Comunidade",
      backPrefix: "Voltar para a ",
      home: "página inicial",
    },
    updatedAt: "29 de outubro de 2026",
    terms: {
      seoTitle: "Termos de Uso · Énóis",
      seoDescription:
        "Termos de uso da rede humana Énóis — regras de uso, conduta, conteúdo e responsabilidades.",
      title: "Termos de Uso",
      sections: [
        {
          title: "1. Aceitação dos termos e idade mínima",
          text: 'Ao criar uma conta ou usar qualquer funcionalidade da plataforma Énóis ("plataforma"), você concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar com qualquer parte deles, não utilize a plataforma.\n\nA plataforma é destinada exclusivamente a pessoas com 18 anos ou mais, por exigência legal e por decisão da comunidade. Ao criar a conta, você declara e confirma ser maior de idade, e esse aceite é registrado com data e hora.',
        },
        {
          title: "2. Definições",
          text: '"Usuário" é qualquer pessoa que crie uma conta na plataforma. "Conteúdo" é todo material publicado por usuários, incluindo posts, comentários, mensagens, fotos, vídeos, vagas e avaliações. "Plataforma" refere-se ao site e aos aplicativos do Énóis.',
        },
        {
          title: "3. Cadastro e conta",
          text: "O cadastro é permitido apenas para maiores de 18 anos. Contas identificadas como de menores de idade serão encerradas, com remoção dos dados pessoais correspondentes.\n\nPara usar a plataforma, você deve fornecer informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas na sua conta.\n\nÉ proibido criar contas em nome de terceiros, criar múltiplas contas para burlar restrições ou fornecer informações falsas. Podemos suspender ou encerrar contas que violem estes Termos.",
        },
        {
          title: "4. Conduta do usuário",
          text: "Você concorda em não usar a plataforma para: (a) publicar conteúdo ilegal, difamatório, discriminatório, assediador, pornográfico, de nudez explícita ou que incite violência; (b) violar direitos de propriedade intelectual de terceiros; (c) enviar spam, phishing ou conteúdo malicioso; (d) tentar acessar sistemas ou contas de outros usuários sem autorização; (e) coletar dados de usuários sem consentimento.\n\nConteúdo sexual explícito, inclusive em imagens enviadas sem texto de apoio, é removido assim que identificado e a conta responsável é banida. Publicações que violem estas regras de conduta podem ser removidas, e a conta do infrator pode ser suspensa ou encerrada, sem prejuízo das medidas legais cabíveis.",
        },
        {
          title: "5. Conteúdo publicado",
          text: "Você mantém a titularidade do conteúdo que publica, mas concede à plataforma uma licença mundial, não exclusiva e gratuita para armazenar, processar e exibir esse conteúdo para operar e melhorar o serviço.\n\nAo publicar, você declara ter os direitos necessários sobre o conteúdo e que ele não viola direitos de terceiros. O conteúdo denunciado poderá ser analisado e removido pela equipe de moderação.",
        },
        {
          title: "6. Vagas e oportunidades",
          text: "As vagas e oportunidades publicadas na plataforma são de responsabilidade de quem as publica. O Énóis não garante a veracidade das ofertas nem realiza intermediação de contratação, atuando apenas como meio de divulgação.",
        },
        {
          title: "7. Serviços de terceiros",
          text: "A plataforma pode integrar serviços de terceiros, como provedores de mídia, hospedagem de arquivos e autenticação. Esses serviços possuem seus próprios termos e políticas, que devem ser consultados diretamente com os respectivos provedores.",
        },
        {
          title: "8. Disponibilidade e alterações",
          text: "Buscamos manter a plataforma disponível, mas não garantimos disponibilidade ininterrupta ou livre de erros. Podemos alterar, suspender ou descontinuar funcionalidades a qualquer momento, com ou sem aviso prévio.\n\nEstes Termos podem ser atualizados periodicamente. Alterações significativas serão comunicadas pela plataforma. O uso continuado da plataforma após a publicação das alterações constitui aceitação dos novos Termos.",
        },
        {
          title: "9. Limitação de responsabilidade",
          text: "Na máxima extensão permitida por lei, o Énóis não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma, incluindo perda de dados, lucros ou oportunidades de trabalho. A plataforma não garante resultados profissionais específicos, como contratações ou conexões.",
        },
        {
          title: "10. Encerramento",
          text: "Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar sua conta se identificarmos violação destes Termos, conduta prejudicial à comunidade ou risco legal. Ao encerrar a conta, seu perfil deixará de ser exibido, mas o conteúdo publicado poderá permanecer conforme permitido por lei.",
        },
        {
          title: "11. Legislação aplicável",
          text: "Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão resolvidas no foro da comarca da sede da plataforma, com preferência por meios alternativos de resolução de conflitos.",
        },
        {
          title: "12. Contato",
          text: "Dúvidas sobre estes Termos podem ser enviadas pela página de contato (enois.ia.br/contato) ou pelo e-mail de suporte informado nela.",
        },
        {
          title: "13. Moeda faísca (token de utilidade)",
          text: "A faísca é um token de utilidade da plataforma. Ela serve exclusivamente para acessar recursos e circular dentro do Énóis, como comprar aparências, temas, jogos ou serviços oferecidos por outros usuários, e não é dinheiro, moeda de curso legal, valor mobiliário, investimento ou ativo financeiro.\n\nA faísca não tem valor monetário garantido, não gera rendimento, juros, dividendos ou expectativa de lucro e não pode ser trocada por reais ou por qualquer outra moeda fora dos recursos expressamente previstos na plataforma. Não existe plano, promessa ou compromisso de listar a faísca em exchanges, corretoras, bolsas de valores ou qualquer mercado secundário.\n\nPodemos ajustar regras de emissão, preços, limites e formas de uso para manter o equilíbrio da economia interna. Saldos obtidos por fraude, abuso ou violação destes Termos podem ser revogados. Compras e transferências internas são finais, salvo quando a lei exigir o contrário.",
        },
        {
          title: "14. Contribuição open source",
          text: "O código do Énóis é aberto e recebe contribuições pelo GitHub. Contribuir não cria vínculo empregatício, sociedade, participação societária, direito a remuneração ou expectativa de retorno financeiro. A decisão sobre aceitar, revisar ou mesclar uma contribuição é dos mantenedores, conforme o guia de contribuição e o código de conduta.\n\nO formulário de contribuição da landing existe para organizar e documentar quem procura o projeto. Ao enviar, você declara que os dados são verdadeiros e autoriza o contato pelo GitHub ou pelo e-mail informado. O envio não garante aprovação, atribuição ou prioridade; o processo segue as regras publicadas no repositório.\n\nContribuições devem vir com issue ou discussão prévia quando mudarem arquitetura, contrato público, segurança ou dados. Mudanças pequenas, com teste e descrição clara, têm prioridade. O projeto não é uma bagunça: é aberto, com processo, revisão e responsabilidade sobre o que entra.",
        },
        {
          title: "15. Figurinhas de terceiros",
          text: "As figurinhas disponíveis nas conversas do Énóis não são criadas nem de propriedade da plataforma. Elas vêm de dois catálogos públicos de emotes, o BetterTTV e o FrankerFaceZ, e cada imagem continua pertencendo a quem a criou. A plataforma não reivindica direito autoral sobre essas artes.\n\nO Énóis não vende, não licencia, não sublicencia e não explora comercialmente essas imagens. O uso é acessório e não comercial: a plataforma mantém uma cópia temporária em cache, para que a figurinha abra imediatamente nas conversas em vez de depender do tempo de resposta dos sites de origem. Essa cópia não é oferecida para download, para redistribuição nem para uso fora do Énóis.\n\nSe você é autor ou titular de uma figurinha e não quer que ela apareça na plataforma, escreva pela página de contato (enois.ia.br/contato) informando o código e o endereço da figurinha. A remoção é feita assim que o pedido é confirmado, sem necessidade de justificativa, e o código correspondente passa a não ser mais exibido nas conversas.\n\nAs marcas, os nomes e os logotipos do BetterTTV e do FrankerFaceZ pertencem aos seus respectivos titulares. O Énóis não tem vínculo, patrocínio ou endosso dessas plataformas.",
        },
      ],
    },
    privacy: {
      seoTitle: "Política de Privacidade · Énóis",
      seoDescription:
        "Política de privacidade do Énóis — como coletamos, usamos e protegemos seus dados pessoais.",
      title: "Política de Privacidade",
      sections: {
        whoWeAre: {
          title: "1. Quem somos",
          paragraphs: [
            'Esta Política de Privacidade descreve como o Énóis ("nós", "nossa plataforma") coleta, usa, armazena e protege os dados pessoais de quem utiliza nossos serviços, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).',
          ],
        },
        collectedData: {
          title: "2. Dados coletados",
          intro: "Coletamos as seguintes categorias de dados:",
          providedLabel: "Dados fornecidos por você:",
          providedBody:
            "nome, e-mail, senha (armazenada de forma criptografada), username, cargo, empresa, localização, biografia, habilidades, objetivos, links externos, foto e banner de perfil, experiências profissionais, formação acadêmica e certificações.",
          usageLabel: "Dados gerados pelo uso:",
          usageBody:
            "posts, comentários, reações, mensagens, conexões, comunidades, candidaturas a vagas, sessões de mentoria, avaliações, notificações e preferências de tema.",
          technicalLabel: "Dados técnicos:",
          technicalBody:
            "endereço IP, tipo de navegador e dispositivo, páginas acessadas e registros de atividade, utilizados para fins de segurança e melhoria do serviço.",
        },
        other: [
          {
            title: "3. Base legal e finalidades",
            paragraphs: [
              "Tratamos seus dados com base no consentimento, na execução do contrato de uso, no legítimo interesse e no cumprimento de obrigações legais. Os dados são utilizados para:",
              "(a) criar e gerenciar sua conta; (b) exibir seu perfil e permitir interações entre usuários; (c) recomendar conexões, conteúdos e oportunidades; (d) permitir candidaturas a vagas e agendamento de mentorias; (e) enviar notificações e comunicados relevantes; (f) garantir segurança e prevenir fraudes; (g) cumprir obrigações legais.",
            ],
          },
          {
            title: "4. Compartilhamento de dados",
            paragraphs: [
              "Não vendemos seus dados pessoais. Compartilhamos dados apenas: (a) com provedores de infraestrutura, hospedagem, armazenamento de mídia e envio de e-mails, que atuam como operadores em nosso nome; (b) com autoridades, quando exigido por lei ou ordem judicial; (c) com outros usuários, conforme a visibilidade definida pelo próprio recurso (ex.: perfil público).",
            ],
          },
          {
            title: "5. Armazenamento e segurança",
            paragraphs: [
              "Seus dados são armazenados em servidores protegidos, com criptografia em trânsito (TLS) e controles de acesso. Senhas são armazenadas com hash criptográfico. Apesar dos nossos esforços, nenhum sistema é 100% seguro; em caso de incidente, notificaremos as autoridades e os usuários afetados conforme exigido pela LGPD.",
            ],
          },
          {
            title: "6. Retenção",
            paragraphs: [
              "Mantemos seus dados enquanto sua conta estiver ativa. Após solicitação de exclusão ou encerramento da conta, os dados serão removidos ou anonimizados, exceto quando a legislação exigir retenção por prazos específicos.",
            ],
          },
          {
            title: "7. Seus direitos",
            paragraphs: [
              "Nos termos da LGPD, você pode solicitar: (a) confirmação da existência de tratamento; (b) acesso aos seus dados; (c) correção de dados incompletos ou desatualizados; (d) anonimização, bloqueio ou eliminação de dados desnecessários; (e) portabilidade dos dados; (f) revogação do consentimento; (g) informação sobre compartilhamento.",
              "Para exercer seus direitos, envie uma solicitação pelos canais de contato indicados na seção 10. Responderemos no prazo legal de até 15 dias.",
            ],
          },
          {
            title: "8. Cookies e tecnologias similares",
            paragraphs: [
              "Utilizamos armazenamento local (localStorage) para manter sua sessão, preferências de tema e dados de autenticação. Não utilizamos cookies de publicidade de terceiros. Você pode limpar esses dados a qualquer momento pelas configurações do navegador, o que poderá encerrar sua sessão.",
            ],
          },
          {
            title: "9. Menores de idade",
            paragraphs: [
              "A plataforma é destinada a maiores de 16 anos. Não coletamos intencionalmente dados de menores sem consentimento dos responsáveis. Se identificarmos esse caso, os dados serão removidos imediatamente.",
            ],
          },
          {
            title: "10. Contato e encarregado (DPO)",
            paragraphs: [
              'Em caso de dúvidas sobre esta Política ou para exercer seus direitos, entre em contato pelo e-mail de suporte disponível na plataforma, indicando "LGPD" no assunto. Atenderemos sua solicitação no prazo legal.',
            ],
          },
          {
            title: "11. Alterações desta política",
            paragraphs: [
              "Esta Política pode ser atualizada para refletir mudanças legais ou no serviço. A data de atualização estará sempre indicada no topo da página e alterações relevantes serão comunicadas pela plataforma.",
            ],
          },
        ],
      },
    },
  },

  sealsPage: {
    seoTitle: "Selos de contribuição · Énóis",
    seoDescription:
      "Como o Énóis reconhece contribuições técnicas verificadas nos repositórios oficiais da organização Rede-ENois.",
    title: "Selos de contribuição",
    intro:
      "O Énóis reconhece quem ajuda a construir o projeto. Os selos vêm de contribuições verificadas nos repositórios oficiais: PRs integrados contam para Código e issues qualificadas contam para Issues. O nível sobe com a contagem — não é um produto comercial nem privilégio de moderação.",
    categoriesTitle: "Categorias e níveis",
    categoriesEmpty: "Nenhuma categoria disponível neste ambiente.",
    categories: {
      CODE: "Pull requests integrados contam automaticamente. PR revertido deixa de contar.",
      ISSUES: "Só issues qualificadas contam: label de qualificação ou validação de um mantenedor.",
    },
    tierRange: (min: number, max: number | null) =>
      max === null ? `${min}+` : min === max ? `${min}` : `${min}–${max}`,
    criteriaTitle: "Como o nível é calculado",
    criteria: [
      "PR integrado em um dos repositórios oficiais da organização Rede-ENois conta automaticamente.",
      "Issue conta quando tem label de qualificação ou é validada por um mantenedor.",
      "Autoria verificável pelo ID imutável da conta GitHub vinculada ao perfil.",
      "Cada categoria exibe apenas o nível mais alto alcançado.",
      "PR revertido ou issue invalidada deixam de contar e o nível é recalculado.",
      "Selo é reconhecimento de trabalho, não privilégio de moderação.",
    ],
    reposTitle: "Repositórios elegíveis",
    reposEmpty: "Nenhum repositório elegível configurado neste ambiente.",
    linkTitle: "Como vincular seu GitHub",
    linkSteps: [
      "Entre na sua conta do Énóis.",
      "Abra Segurança e toque em “Vincular GitHub”.",
      "Autorize o acesso de leitura ao perfil público do GitHub.",
      "A partir daí, PRs integrados e issues qualificadas nos repositórios elegíveis são sincronizados.",
    ],
    statesTitle: "Estados da evidência",
    states: {
      PENDING: "Pendente: issue coletada, aguardando qualificação por label ou mantenedor.",
      VALIDATED: "Validada: conta para o nível. PR integrado entra assim automaticamente.",
      REJECTED: "Recusada: não atende aos critérios; não conta.",
      CONTESTED: "Contestada: precisa de uma nova revisão.",
      REVOKED: "Revogada: deixou de contar, com registro de auditoria.",
    },
    privacyTitle: "O que fica público",
    privacy:
      "No perfil aparecem o nome do nível, a categoria, a data de concessão e os links das evidências validadas. Notas internas, suspeitas, e-mail e detalhes de revisão não são públicos.",
    cta: "Vincular GitHub",
    ctaHint: "É preciso ter uma conta no Énóis e entrar antes de vincular.",
  },

  root: {
    notFound: {
      code: "404",
      title: "Página não encontrada",
      description: "A página que você procura não existe ou foi movida.",
      home: "Voltar para o início",
    },
    error: {
      title: "Esta página não carregou",
      description:
        "Algo deu errado do nosso lado. Você pode tentar de novo ou voltar para o início.",
      retry: "Tentar de novo",
      home: "Voltar para o início",
    },
    seo: {
      title: "Énóis · Rede humana",
      description:
        "Rede social feita por gente, com conversas, trabalho, brincadeira e vizinhança no mesmo lugar. Sem anúncios, sem planos pagos e sem nada prendendo você.",
      ogDescription: "Construa relações de verdade, não apenas conexões.",
    },
  },

  pwa: {
    themeColor: "#6746f5",
    /** Descrição do manifesto do PWA: é a frase que o navegador mostra ao convidar a instalar. */
    manifestDescription:
      "Rede humana para conexões autênticas: conversa, comunidades, vagas, mentoria, brincadeira e construção junto.",
  },
} as const;
