/** Página de avisos que os testes da lista de avisos servem para cada uma das duas listas. */
export type NoticeListTestPage = {
  items: { id: string; read: boolean; kind: string; createdAt: string }[];
  nextCursor: string | null;
};
