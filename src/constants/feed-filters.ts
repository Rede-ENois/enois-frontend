import { texts } from "@/texts";
import type { HomeTab } from "@/types/routes/feed/home-tab";

/** Abas válidas da tela inicial (a URL carrega a escolhida). */
export const HOME_TABS: HomeTab[] = [
  "ALL",
  "FOR_YOU",
  "UNSEEN",
  "TRENDING",
  "INTERACTED",
  "CORPORATE",
];

export const TAB_LABELS: Record<HomeTab, string> = {
  ALL: texts.feed.tabs.all,
  FOR_YOU: texts.feed.tabs.forYou,
  UNSEEN: texts.feed.tabs.unseen,
  TRENDING: texts.feed.tabs.trending,
  INTERACTED: texts.feed.tabs.interacted,
  CORPORATE: texts.feed.tabs.corporate,
  // Legado (backend aceita mas frontend não mostra).
  FOLLOWING: texts.feed.tabs.following,
  RECENT: texts.feed.tabs.discussions,
  PROJECTS: texts.feed.tabs.projects,
  NEWS: texts.feed.tabs.news,
  TUTORIALS: texts.feed.tabs.tutorials,
  OPPORTUNITIES: texts.feed.tabs.opportunities,
  REVIEWS: texts.feed.tabs.reviews,
  FUN: texts.feed.tabs.fun,
};

/** Tipos de post para o filtro do feed "Tudo". */
export const POST_TYPE_FILTERS = [
  { value: "", label: texts.feed.tabs.allTypes },
  { value: "INSIGHT", label: "Insights" },
  { value: "QUESTION", label: "Dúvidas" },
  { value: "PROJECT", label: "Projetos" },
  { value: "NEWS", label: "Notícias" },
  { value: "TUTORIAL", label: "Tutoriais" },
  { value: "OPPORTUNITY", label: "Oportunidades" },
  { value: "REVIEW", label: "Avaliações" },
  { value: "DIVERTIDO", label: "Diversão" },
  { value: "ARTICLE", label: "Artigos" },
  { value: "POLL", label: "Enquetes" },
] as const;
