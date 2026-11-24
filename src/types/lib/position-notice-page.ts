import type { PositionNotice } from "./position-notice.js";

/** Página da lista paginada por posição nos testes de sincronia; o cursor é `o:<n>`. */
export type PositionNoticePage = { items: PositionNotice[]; nextCursor: string | null };
