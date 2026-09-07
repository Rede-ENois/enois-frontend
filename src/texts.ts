const common = {
  enter: "Entrar",
  createAccount: "Criar conta",
  cancel: "Cancelar",
  confirm: "Confirmar",
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
  add: "Adicionar",
  back: "Voltar",
  profile: "Perfil",
} as const;

export const texts = {
  common,

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
      jobs: "Vagas",
      mentoring: "Mentoria",
      events: "Eventos",
    },
    openMenu: "Abrir menu",
    expandMenu: "Expandir menu",
    collapseMenu: "Recolher menu",
    drawerTitle: "Menu de navegação",
  },

  accessibility: {
    close: "Fechar",
    closeAlert: "Fechar alerta",
    systemAlerts: "Alertas do sistema",
  },

  theme: {
    light: "Tema claro",
    dark: "Tema escuro",
    system: "Tema do sistema",
  },

  search: {
    action: "Buscar",
    placeholder: "Buscar pessoas, comunidades, vagas...",
    noResults: (query: string) => `Nenhum resultado para "${query}"`,
  },

  mentions: {
    username: (username: string) => `@${username}`,
  },

  notifications: {
    title: "Notificações",
    markAllRead: "Ler tudo",
    overflowCount: "9+",
    tabs: {
      new: "Novas",
      history: "Histórico",
    },
    emptyNew: "Nenhuma notificação nova.",
    emptyHistory: "Nenhum histórico ainda.",
    markRead: "Lida",
    accept: "Aceitar",
    unreadLabel: (count: number) =>
      `${count} ${count === 1 ? "notificação não lida" : "notificações não lidas"}`,
  },

  errors: {
    unexpected: "Erro inesperado. Tente novamente.",
    details: {
      show: "Mostrar detalhes",
      hide: "Ocultar detalhes",
      copied: "Copiado!",
      copy: "Copiar detalhes",
      error: (message: string) => `Erro: ${message}`,
      suggestion: (hint: string) => `Sugestão: ${hint}`,
      http: (status: number) => `HTTP ${status}`,
      postPath: (path: string) => `POST ${path}`,
    },
    knownCodes: {
      NETWORK_ERROR:
        "O navegador não conseguiu falar com a API. Se você estiver rodando localmente, verifique se o backend está em execução (ex.: `docker compose up` ou o servidor Java na porta 8081) e se a variável VITE_API_BACKEND no arquivo .env aponta para ele.",
      INVALID_CREDENTIALS:
        "E-mail ou senha incorretos. Confira os dados ou use 'Esqueci minha senha'.",
      SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
      IDEMPOTENCY_KEY_REQUIRED:
        "O backend rejeitou a requisição por falta de Idempotency-Key. Recarregue a página; se o problema persistir, há um bug no front-end (src/lib/api-client.ts).",
    },
  },

  auth: {
    hero: {
      eyebrow: "Networking com propósito",
      quote: '"Encontrei aqui as conversas que mudaram minha carreira."',
      person: "Marina Rocha",
      role: "Engenheira Sênior · Nubank",
      stats: [
        { value: "120k+", label: "Profissionais" },
        { value: "2.8k", label: "Mentores ativos" },
        { value: "640", label: "Comunidades" },
      ],
    },
    fields: {
      fullName: "Nome completo",
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
    },
    password: {
      show: "Mostrar senha",
      hide: "Ocultar senha",
      forgot: "Esqueci minha senha",
    },
    seo: {
      authTitle: "Entrar ou criar conta · Énóis",
      authDescription: "Acesse sua conta ou comece sua jornada profissional na Énóis.",
      resetTitle: "Redefinir senha · Énóis",
      resetDescription: "Defina uma nova senha para sua conta na Énóis.",
    },
    signup: {
      title: "Vamos começar.",
      subtitle: "Crie sua conta em menos de um minuto.",
    },
    login: {
      title: "Bem-vindo de volta.",
      subtitle: "Continue de onde parou.",
    },
    social: {
      google: "Continuar com Google",
      apple: "Continuar com Apple",
      divider: "ou com e-mail",
      unavailable: (provider: string) =>
        `Função não implementada: login com ${provider} ainda não está configurado.`,
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
      successTitle: "Senha redefinida!",
      successDescription: "Sua senha foi atualizada com sucesso. Já pode entrar na sua conta.",
      enterNow: "Entrar agora ",
      title: "Definir nova senha",
      description: "Escolha uma nova senha para acessar sua conta.",
      action: "Redefinir senha ",
      remembered: "Já lembrou sua senha? ",
    },
  },

  landing: {
    seo: {
      title: "Énóis · Rede profissional gratuita e humana",
      description:
        "Uma rede profissional diferente. Sem paywalls, sem métricas de vaidade. Apenas conexões reais, mentoria e conhecimento compartilhado — tudo gratuito para sempre.",
      ogDescription: "Sua carreira merece um lugar seguro e gratuito para crescer.",
    },
    nav: {
      philosophy: "Filosofia",
      features: "Recursos",
      community: "Comunidade",
    },
    hero: {
      badge: "Uma rede profissional feita para pessoas",
      title: "Cresça na sua carreira",
      titleAccent: "em um lugar seguro e gratuito",
      description:
        "Énóis conecta profissionais por conhecimento, mentoria e propósito, não por métricas de popularidade.",
      free: "100% gratuito. Sem anúncios. Sem planos pagos.",
      join: "Entrar na comunidade",
      explore: "Explorar a plataforma",
      benefits: {
        noVanity: "Sem métricas de vaidade",
        safe: "Ambiente moderado e seguro",
        freeForever: "Para sempre gratuito",
      },
    },
    philosophy: {
      eyebrow: "Nossa filosofia",
      titlePrefix: "Profissionalismo com ",
      titleAccent: "coração",
      description:
        "Acreditamos que o crescimento profissional acontece quando pessoas se conectam de forma autêntica, sem barreiras, sem ruído, sem custo.",
      alwaysFree: "Sempre gratuito para todos os profissionais",
      values: {
        authenticity: {
          title: "Autenticidade",
          description:
            "Perfis baseados em competências reais, não em palavras-chave ou conexões vazias.",
        },
        collaboration: {
          title: "Colaboração",
          description:
            "Um ambiente onde o sucesso é construído em conjunto, não às custas de outros.",
        },
        learning: {
          title: "Aprendizado",
          description: "Conhecimento compartilhado é a verdadeira moeda da plataforma.",
        },
        safety: {
          title: "Segurança",
          description: "Espaço moderado, livre de assédio, spam e autopromoção.",
        },
      },
    },
    features: {
      eyebrow: "Na prática",
      title: "O que você encontra aqui",
      description:
        "Tudo o que você precisa para crescer profissionalmente, sem os excessos das redes tradicionais.",
      items: {
        discussions: {
          title: "Discussões com profundidade",
          description:
            "Conteúdo relevante e conversas significativas, sem algoritmo de engajamento vazio.",
        },
        mentoring: {
          title: "Mentoria nativa",
          description:
            "Encontre mentores verificados, agende sessões e acompanhe sua trilha de aprendizado.",
        },
        communities: {
          title: "Comunidades fortes",
          description: "Grupos profissionais e fóruns temáticos para troca contínua entre pares.",
        },
        connections: {
          title: "Conexões por afinidade",
          description: "Sugestões baseadas em habilidades, objetivos e interesses, não em volume.",
        },
        recruiting: {
          title: "Recrutamento honesto",
          description:
            "Match entre empresas e candidatos com transparência sobre faixa salarial e cultura.",
        },
        wellbeing: {
          title: "Bem-estar digital",
          description: "Notificações respeitosas e um ambiente que valoriza o seu tempo e atenção.",
        },
      },
    },
    cta: {
      title: "Sua carreira merece um espaço melhor",
      description:
        "Entre para uma comunidade que valoriza autenticidade, colaboração e aprendizado, sem pagar nada por isso. Sem planos, sem anúncios, sem surpresas.",
      createAccount: "Criar conta gratuita",
      existingAccount: "Já tenho conta",
      finePrint: "Sem cartão de crédito · Sem anúncios · Sem plano premium · ",
      freeForever: "Para sempre grátis",
    },
    footer: {
      copyright: (year: number) =>
        `© ${year} Énóis · Feito com cuidado para profissionais como você.`,
      privacy: "Privacidade",
      terms: "Termos",
      contact: "Contato",
    },
  },

  feed: {
    seo: {
      title: "Énóis · Início",
      description: "Seu feed de insights, perguntas e projetos da comunidade profissional.",
    },
    you: "Você",
    composer: {
      placeholder: "Compartilhe algo que aprendeu hoje...",
      types: {
        insight: "Insight",
        article: "Artigo",
        question: "Pergunta",
        project: "Projeto",
      },
      media: "Mídia",
      video: "Vídeo",
      mediaCount: (count: number) => `${count} ${count === 1 ? "mídia" : "mídias"}`,
      uploadProgress: (progress: number) => `Enviando... ${progress}%`,
      publishError: "Erro ao publicar. Tente novamente.",
    },
    tabs: {
      forYou: "Para você",
      all: "Tudo",
      following: "Seguindo",
      discussions: "Discussões",
      projects: "Projetos",
    },
    sidebar: {
      connections: "Conexões",
      followers: "Seguidores",
      suggestions: "Sugestões para você",
      suggestionsDescription: "Com base em interesses e objetivos em comum.",
      connect: "Conectar",
      happeningNow: "Acontecendo agora",
      confirmed: (count: number) => `${count} ${count === 1 ? "confirmado" : "confirmados"}`,
      eventMeta: (date: string, format: string, confirmed: string) =>
        `${date} · ${format} · ${confirmed}`,
    },
  },

  posts: {
    types: {
      insight: "Insight",
      question: "Pergunta",
      project: "Projeto",
      opportunity: "Oportunidade",
      article: "Artigo",
    },
    tag: (tag: string) => `#${tag}`,
    authorTime: (time: string) => `· ${time}`,
    reactions: {
      title: "Reações",
      empty: "Nenhuma reação ainda",
      react: "Reagir",
      reactedWith: (emoji: string) => `Reagiu com ${emoji}`,
      emojis: {
        LIKE: "👍",
        LOVE: "❤️",
        LAUGH: "😂",
        WOW: "😮",
        SAD: "😢",
        CELEBRATE: "🎉",
        SUPPORT: "💪",
        INSIGHTFUL: "💡",
      },
    },
    report: {
      title: "Denunciar post",
      reason: "Motivo",
      description: "Descrição (opcional)",
      action: "Denunciar",
    },
    share: "Compartilhar",
    comments: {
      empty: "Nenhum comentário ainda. Seja o primeiro a comentar.",
      placeholder: "Comente com contexto, dúvida ou referência...",
      send: "Enviar comentário",
      reply: "Responder",
      replyingTo: (name: string) => `respondendo a ${name}`,
      delete: "Excluir",
    },
    video: {
      watchOn: (provider: string) => `Clique para assistir no ${provider}`,
      icons: {
        cinema: "🎬",
        television: "📺",
        play: "▶️",
        web: "🌐",
      },
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
    waitingResponse: "Aguardando resposta",
    connected: "Conectado",
    connect: "Conectar",
    openToWork: "Aberto a oportunidades",
    mentorAvailable: "Mentor disponível",
    connections: (count: number) => `${count} ${count === 1 ? "conexão" : "conexões"}`,
    connectionsMeta: (count: number) => `· ${count} ${count === 1 ? "conexão" : "conexões"}`,
    reputation: (value: number) => `${value} reputação`,
    reputationMeta: (value: number) => `★ ${value} reputação`,
    rankingPosition: (position: number) => `${position}º`,
    recommendationQuote: (comment: string) => `"${comment}"`,
    uploadingIndicator: "...",
    avatarUnknown: "?",
    sections: {
      about: "Sobre",
      skills: "Habilidades",
      goals: "Objetivos profissionais",
      recentPosts: "Publicações recentes",
      availability: "Disponibilidade",
      recommend: "Recomendar",
      recommendations: "Recomendações",
      ranking: "Ranking",
      links: "Links",
    },
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
      title: "Editar perfil",
      tabs: {
        info: "Informações",
        experiences: "Experiências",
        education: "Educação",
        certifications: "Certificações",
      },
      fields: {
        name: "Nome",
        username: "Username (URL do perfil)",
        headline: "Headline",
        bio: "Bio",
        company: "Empresa",
        location: "Localização",
        availability: "Disponibilidade",
        portfolio: "Portfólio",
        externalLinks: "Links externos (um por linha)",
        skills: "Habilidades (separadas por vírgula)",
        goals: "Objetivos (separados por vírgula)",
      },
      placeholders: {
        username: "seu-username",
        headline: "Cargo ou frase de destaque",
        availability: "Ex.: Disponível para freelas",
        portfolio: "https://...",
      },
      openToWork: "Aberto a oportunidades",
      mentorAvailable: "Mentor disponível",
      experienceFields: {
        title: "Cargo",
        company: "Empresa",
        location: "Local",
        description: "Descrição",
        startDate: "Início",
        endDate: "Fim",
      },
      educationFields: {
        school: "Instituição",
        degree: "Grau",
        field: "Campo",
        description: "Descrição",
        startDate: "Início",
        endDate: "Fim",
      },
      certificationFields: {
        name: "Nome",
        issuer: "Emissor",
        description: "Descrição",
        issueDate: "Data de emissão",
        expirationDate: "Data de expiração",
        credentialUrl: "URL da credencial",
      },
      emptyExperience: "Nenhuma experiência adicionada",
      emptyEducation: "Nenhuma formação adicionada",
      emptyCertification: "Nenhuma certificação adicionada",
      currentlyHere: "Atualmente aqui",
    },
  },

  communities: {
    seoTitle: "Comunidades · Énóis",
    title: "Comunidades",
    description: "Encontre grupos profissionais, fóruns temáticos e círculos de mentoria.",
    createCommunity: "Criar comunidade",
    topics: {
      all: "Todas",
      TECNOLOGIA: "Tecnologia",
      ENGENHARIA: "Engenharia",
      DESIGN: "Design",
      PRODUTO: "Produto",
      LIDERANCA: "Liderança",
      CARREIRA: "Carreira",
      FREELANCE: "Freelance",
    },
    members: (count: number) =>
      `${count.toLocaleString("pt-BR")} ${count === 1 ? "membro" : "membros"}`,
    memberCount: (count: number) => `${count} membro${count === 1 ? "" : "s"}`,
    participating: "Participando",
    enter: "Entrar",
    loadMore: "Carregar mais",
    create: {
      title: "Criar comunidade",
      name: "Nome",
      description: "Descrição",
      topic: "Tópico",
    },
    detail: {
      seoFallback: "Comunidade",
      seoTitle: (name: string) => `${name} · Énóis`,
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
    months: [
      "",
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ],
    hostedBy: (host: string) => `por ${host}`,
    dateTime: (date: string, time: string) => `${date} · ${time}`,
    attend: "Confirmar presença",
    form: {
      title: "Título",
      date: "Data",
      time: "Horário",
      host: "Realizador",
      hostPlaceholder: "Comunidade X",
      format: "Formato",
    },
  },

  jobs: {
    seoTitle: "Vagas · Énóis",
    title: "Oportunidades",
    description: "Vagas filtradas por nível, localização, tipo e habilidades.",
    clearFilters: "Limpar filtros",
    filters: {
      level: "Nível:",
      location: "Local:",
      type: "Tipo:",
      locations: ["Remoto", "Híbrido", "Presencial"],
    },
    searchPlaceholder: "Buscar por título ou empresa...",
    skillsPlaceholder: "Habilidades (ex.: Java, Spring)",
    today: "Hoje",
    daysAgo: (days: number) => `Há ${days} ${days === 1 ? "dia" : "dias"}`,
    match: (score: number) => `${score}% match`,
    details: "Ver detalhes",
    apply: "Candidatar-se",
    empty: "Nenhuma vaga encontrada com os filtros selecionados.",
  },

  mentoring: {
    seoTitle: "Mentoria · Énóis",
    badge: "Mentoria nativa",
    title: "Aprenda com quem já passou por onde você quer chegar.",
    description:
      "Sessões reais com mentores verificados — sem performance, sem ruído. Avaliações honestas, trilhas de aprendizado e agendamento em um clique.",
    findMentor: "Encontrar mentor",
    becomeMentor: "Tornar-me mentor",
    becomeMentorTitle: "Tornar-se mentor",
    featured: "Mentores em destaque",
    featuredDescription: "Avaliados pela comunidade nas últimas 8 semanas.",
    expertise: "Especialidades (separadas por vírgula)",
    expertisePlaceholder: "Java, Spring, React",
    investment: "Investimento",
    free: "Gratuito",
    mentorFallback: "Mentor",
    schedule: "Agendar",
    rating: "Avaliação",
    sessions: "Sessões",
    nextSlot: "Próxima vaga",
    editTitle: "Editar mentoria",
    deleteTitle: "Excluir mentoria",
    deleteDescription:
      "Tem certeza que deseja excluir sua mentoria? Esta ação não pode ser desfeita.",
    deleting: "Excluindo...",
    delete: "Excluir",
  },

  network: {
    seoTitle: "Rede · Énóis",
    title: "Sua rede",
    description: "Construa relacionamentos por afinidade, não por volume.",
    stats: {
      connections: "Conexões",
      following: "Seguindo",
      requests: "Solicitações",
      suggestions: "Sugestões",
    },
    pendingTitle: "Solicitações pendentes",
    pendingCount: (count: number) =>
      `${count} ${count === 1 ? "solicitação pendente" : "solicitações pendentes"}`,
    received: "Recebidas",
    sent: "Enviadas por você",
    matchesTitle: "Pessoas que combinam com você",
    matchesDescription: "Com base em habilidades, objetivos e comunidades em comum.",
    connected: "Conectado",
    commonInterests: "3 interesses em comum",
    remove: "Remover",
    requested: "Solicitado",
    connect: "Conectar",
    requestSent: "Você enviou a solicitação",
    wantsToConnect: "Quer se conectar com você",
    cancel: "Cancelar",
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
    selectConversation: "Selecione uma conversa ou comece uma nova para exibir as mensagens",
    noMessages: "Nenhuma mensagem ainda",
    inputPlaceholder: "Escreva uma mensagem...",
    conversationFallback: "Conversa",
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
      copyright: (year: number) => `© ${year} Énóis · Rede profissional gratuita e humana`,
      terms: "Termos de Uso",
      privacy: "Política de Privacidade",
      lastUpdated: "Última atualização: ",
      backPrefix: "Voltar para a ",
      home: "página inicial",
    },
    updatedAt: "15 de agosto de 2026",
    terms: {
      seoTitle: "Termos de Uso · Énóis",
      seoDescription:
        "Termos de uso da rede profissional Énóis — regras de uso, conduta, conteúdo e responsabilidades.",
      title: "Termos de Uso",
      sections: [
        {
          title: "1. Aceitação dos termos",
          text: 'Ao criar uma conta ou usar qualquer funcionalidade da plataforma Énóis ("plataforma"), você concorda com estes Termos de Uso. Se não concordar com qualquer parte deles, não utilize a plataforma.',
        },
        {
          title: "2. Definições",
          text: '"Usuário" é qualquer pessoa que crie uma conta na plataforma. "Conteúdo" é todo material publicado por usuários, incluindo posts, comentários, mensagens, fotos, vídeos, vagas e avaliações. "Plataforma" refere-se ao site e aos aplicativos do Énóis.',
        },
        {
          title: "3. Cadastro e conta",
          text: "Para usar a plataforma, você deve fornecer informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas na sua conta.\n\nÉ proibido criar contas em nome de terceiros, criar múltiplas contas para burlar restrições ou fornecer informações falsas. Podemos suspender ou encerrar contas que violem estes Termos.",
        },
        {
          title: "4. Conduta do usuário",
          text: "Você concorda em não usar a plataforma para: (a) publicar conteúdo ilegal, difamatório, discriminatório, assediador ou que incite violência; (b) violar direitos de propriedade intelectual de terceiros; (c) enviar spam, phishing ou conteúdo malicioso; (d) tentar acessar sistemas ou contas de outros usuários sem autorização; (e) coletar dados de usuários sem consentimento.\n\nPublicações que violem estas regras de conduta podem ser removidas, e a conta do infrator pode ser suspensa ou encerrada, sem prejuízo das medidas legais cabíveis.",
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
          text: "Na máxima extensão permitida por lei, o Énóis não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma, incluindo perda de dados, lucros ou oportunidades profissionais. A plataforma não garante resultados profissionais específicos, como contratações ou conexões.",
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
          text: "Dúvidas sobre estes Termos podem ser enviadas pelo e-mail de suporte disponível na plataforma ou pelo formulário de contato em nossas comunidades.",
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

  root: {
    notFound: {
      code: "404",
      title: "Page not found",
      description: "The page you're looking for doesn't exist or has been moved.",
      home: "Go home",
    },
    error: {
      title: "This page didn't load",
      description: "Something went wrong on our end. You can try refreshing or head back home.",
      retry: "Try again",
      home: "Go home",
    },
    seo: {
      title: "Énóis · Networking profissional humano",
      description:
        "Plataforma de networking profissional com foco em conexões genuínas, mentoria, comunidades e desenvolvimento de carreira.",
      ogDescription: "Construa relacionamentos profissionais reais — não apenas conexões.",
    },
  },
} as const;
