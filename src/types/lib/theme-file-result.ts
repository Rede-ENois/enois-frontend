import type { ThemeFile } from "@/types/lib/theme-file";

/**
 * O que a leitura de um arquivo de tema devolve.
 *
 * Cada recusa tem motivo próprio porque a tela explica coisas diferentes: "não é JSON" e "é de uma
 * versão mais nova do app" pedem ações distintas de quem está importando.
 */
export type ThemeFileResult =
  | { ok: true; file: ThemeFile; collectionName: string | null }
  | { ok: false; reason: "json" | "format" | "version" | "collection" | "settings" };
