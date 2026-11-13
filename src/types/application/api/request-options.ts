export type RequestOptions = {
  idempotent?: boolean;
  fingerprint?: boolean;
  /**
   * Sinal de cancelamento da requisição. O TanStack Query entrega um `AbortSignal` em cada
   * `queryFn`; repassá-lo ao `fetch` faz a busca antiga (termo anterior da pesquisa, tela que
   * saiu) ser abortada de verdade, em vez de continuar ocupando a rede e resolvendo depois por
   * cima do resultado mais novo.
   */
  signal?: AbortSignal;
};
