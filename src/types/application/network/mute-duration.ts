/**
 * Prazo de um silenciamento. Os valores são os que a API aceita (`POST /network/mutes/{id}` com
 * `{"duration": ...}`); `forever` é o "Sempre (até reativar)".
 */
export type MuteDuration = "24h" | "72h" | "7d" | "forever";
