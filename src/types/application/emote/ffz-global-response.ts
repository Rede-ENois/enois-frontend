import type { FfzSet } from "./ffz-set";

/** Resposta de `api.frankerfacez.com/v1/set/global`: os sets padrão e o catálogo completo. */
export type FfzGlobalResponse = {
  default_sets?: number[];
  sets?: Record<string, FfzSet>;
};
