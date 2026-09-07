export const feedTexts = {
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
} as const;
