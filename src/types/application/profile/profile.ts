export type Profile = {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  email: string;
  company: string | null;
  location: string | null;
  avatar: string | null;
  banner: string | null;
  /** Emblema (PNG pequeno) exibido ao lado do nome; URL de mídia, como avatar e banner. */
  badge: string | null;
  bio: string | null;
  /** Bio em HTML/CSS já sanitizada; quando presente, o perfil mostra ela no lugar do texto. */
  bioHtml?: string | null;
  /** Capa em HTML/CSS já sanitizada; quando presente, ocupa o lugar da imagem da capa. */
  bannerHtml?: string | null;
  skills: string[];
  goals: string[];
  availability: string | null;
  portfolio: string | null;
  externalLinks: string[];
  openToWork: boolean;
  /** Preferencia da conta: mostrar a secao de ranking no perfil (padrao true). */
  showRanking?: boolean;
  isMentor: boolean;
  connectionsCount?: number;
  followersCount?: number;
  reputation?: number;
  /** Total de publicações do perfil social. Ausente quando a leitura não calcula contagens. */
  postsCount?: number | null;
  /** Apelido: entra entre parênteses depois do nome (preferência da pessoa). */
  nickname?: string | null;
  /** Data de nascimento ISO (aaaa-mm-dd) — quem tem conta antes do campo pode ter null. */
  birthDate?: string | null;
  /** Nome social: substitui o nome de cadastro para todo mundo quando existe. */
  socialName?: string | null;
  /** Pronomes: aparecem só no perfil, como lembrete de como tratar a pessoa. */
  pronouns?: string | null;
  /** Vulgo: como a pessoa é conhecida (etiqueta ao lado do nome, só no perfil). */
  aka?: string | null;
  /** Moldura de avatar equipada (loja de cosméticos). */
  avatarFrame?: string | null;
  /** Fonte segura escolhida para o nome do perfil. */
  nameFont?: import("@/types/application/cosmetics/profile-name-font").ProfileNameFont | null;
  /** Cor hexadecimal escolhida para o nome do perfil. */
  nameColor?: string | null;
  /** Tema declarativo do nome do perfil, com fonte, paleta e efeito seguros. */
  nameTheme?: import("@/types/application/cosmetics/profile-name-theme").ProfileNameTheme | null;
  /** Cor da tag "Contribuinte" abaixo do nome; só quem tem contribuição verificada escolhe. */
  contributorTagColor?: string | null;
  /** Currículo em PDF (endereço no storage) — só o dono recebe estes dois campos. */
  resumeUrl?: string | null;
  resumeName?: string | null;
  /** Até 5 emblemas; o primeiro acompanha o nome por todo o app. */
  badges?: string[] | null;
  /** Shop items equipped on the profile card (cosmetic catalog ids). */
  cardTheme?: string | null;
  nameplate?: string | null;
  bannerItem?: string | null;
  profileEffect?: string | null;
  /** Status bubble: up to 60 characters and a cosmetic icon key. */
  statusText?: string | null;
  statusIcon?: string | null;
};
