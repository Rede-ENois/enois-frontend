import type { QueryClient } from "@tanstack/react-query";

/** O que a varredura de fundo precisa saber da tela que a liga. */
export type FeedLiveScope = {
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  enabled: boolean;
};
