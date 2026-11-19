import type { HomeTab } from "@/types/routes/feed/home-tab";

/**
 * O que o seletor do feed pode pedir: uma aba, ou `null` para "sem `?aba=` na URL" — aí vale a
 * aba padrão da interface.
 */
export type FeedTabChoice = HomeTab | null;
