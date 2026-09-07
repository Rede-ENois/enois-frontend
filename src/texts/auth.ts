export const authTexts = {
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
} as const;
