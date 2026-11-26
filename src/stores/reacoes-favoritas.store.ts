import type { ReacoesFavoritasState } from "@/types/stores/reacoes-favoritas-state";
import type { ReacoesFavoritasStorageState } from "@/types/stores/reacoes-favoritas-storage-state";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  FAVORITAS_MAX,
  FAVORITAS_PADRAO,
  comFavorita,
  ehTipoDeReacao,
  moverFavorita,
  semFavorita,
} from "@/lib/reactions/favoritas";

/**
 * Traz a fileira guardada para uma forma válida.
 *
 * Nada do que veio do navegador é confiável: o código tem de ser uma reação (`LIKE`, `HEART_PURPLE`),
 * sem repetir e no máximo `FAVORITAS_MAX`; o resto da lista é descartado e o excesso, cortado. Lista
 * vazia vira o padrão — sem fileira, o seletor compacto ficaria só com o "+".
 */
function normalizar(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [...FAVORITAS_PADRAO];
  const fileira: string[] = [];
  for (const item of valor) {
    if (ehTipoDeReacao(item) && !fileira.includes(item) && fileira.length < FAVORITAS_MAX) {
      fileira.push(item);
    }
  }
  return fileira.length > 0 ? fileira : [...FAVORITAS_PADRAO];
}

export const useReacoesFavoritasStore = create<ReacoesFavoritasState>()(
  persist(
    (set) => ({
      favoritas: [...FAVORITAS_PADRAO],
      escolheu: false,

      // Só o que cabe é marcado: a fileira cheia ignora o toque numa reação nova.
      alternar: (tipo: string) =>
        set((s) => ({
          favoritas: s.favoritas.includes(tipo)
            ? semFavorita(s.favoritas, tipo)
            : comFavorita(s.favoritas, tipo),
          escolheu: true,
        })),

      mover: (tipo: string, direcao: -1 | 1) =>
        set((s) => ({ favoritas: moverFavorita(s.favoritas, tipo, direcao), escolheu: true })),
    }),
    {
      name: "enois-reacoes-favoritas",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s): ReacoesFavoritasStorageState => ({
        favoritas: s.favoritas,
        escolheu: s.escolheu,
      }),
      merge: (guardado, atual) => {
        const valor = (guardado ?? {}) as ReacoesFavoritasStorageState;
        return {
          ...atual,
          favoritas: normalizar(valor.favoritas),
          escolheu: valor.escolheu === true,
        };
      },
    },
  ),
);

/**
 * Traz a fileira guardada para dentro do store.
 *
 * O store nasce sem ler o navegador (`skipHydration`) para desenhar sempre o mesmo HTML no servidor
 * e no primeiro render; a leitura acontece uma vez, depois da montagem, por quem monta o seletor.
 */
export function hidratarReacoesFavoritas(): Promise<void> {
  return Promise.resolve(useReacoesFavoritasStore.persist.rehydrate());
}
