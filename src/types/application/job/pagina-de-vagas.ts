import type { PageResponse } from "@/types/application/api/page-response";

import type { Job } from "./job";

// Uma página da lista de vagas: a primeira vem com `nextCursor: null` e as de "carregar mais"
// pelo `nextCursor` dela.
export type PaginaDeVagas = PageResponse<Job>;
