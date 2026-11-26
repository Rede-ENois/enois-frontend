import type { Job } from "./job";

// A lista de vagas mostrada: a qual busca (`chave`) e a qual página (`cursor`) ela pertence, e
// as vagas delas.
export type Paginacao = { chave: string; jobs: Job[]; cursor: string | null };
