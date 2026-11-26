import type { WrappedAssunto } from "./wrapped-assunto.js";
import type { WrappedComunidade } from "./wrapped-comunidade.js";
import type { WrappedEncerramento } from "./wrapped-encerramento.js";
import type { WrappedImpacto } from "./wrapped-impacto.js";
import type { WrappedInteracao } from "./wrapped-interacao.js";
import type { WrappedMetricas } from "./wrapped-metricas.js";
import type { WrappedPerfil } from "./wrapped-perfil.js";
import type { WrappedPublicacao } from "./wrapped-publicacao.js";
import type { WrappedRitmo } from "./wrapped-ritmo.js";
import type { WrappedTreta } from "./wrapped-treta.js";

/** A retrospectiva como o backend a entregou (antes de virar view model). */
export type WrappedRetrospectiva = {
  ano: number;
  versaoAlgoritmo: number;
  dadosInsuficientes: boolean;
  metricas: WrappedMetricas;
  assuntosPublicados: WrappedAssunto[];
  assuntosComentados: WrappedAssunto[];
  publicacoesMarcantes: WrappedPublicacao[];
  tretas: WrappedTreta[];
  interacoes: WrappedInteracao[];
  ritmo: WrappedRitmo;
  perfil: WrappedPerfil;
  impacto: WrappedImpacto;
  comunidades: WrappedComunidade[];
  encerramento: WrappedEncerramento;
};
