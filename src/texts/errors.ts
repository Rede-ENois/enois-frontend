export const errorsTexts = {
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
} as const;
