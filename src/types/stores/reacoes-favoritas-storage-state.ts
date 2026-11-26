/**
 * O que o navegador guarda da fileira: só a escolha, sem as ações do store.
 *
 * Lido de volta às cegas (o arquivo é editável e sobrevive a versões antigas), então cada campo
 * pode vir com qualquer coisa — de `null` a uma lista com mil códigos.
 */
export interface ReacoesFavoritasStorageState {
  favoritas?: unknown;
  escolheu?: unknown;
}
