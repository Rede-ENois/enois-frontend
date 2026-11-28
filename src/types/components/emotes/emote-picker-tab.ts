/**
 * Aba do seletor de figurinhas: Recentes, É Nóis (o pacote oficial), De terceiros (BetterTTV e
 * FrankerFaceZ) e Da comunidade (o catálogo que a própria rede envia). "De terceiros" é o catálogo
 * que o nosso backend mantém em cache; não é "todas", porque cada origem tem a sua aba.
 */
export type EmotePickerTab = "recent" | "enois" | "third" | "community";

/**
 * O envio de uma figurinha nova não é uma aba do catálogo: é o botão ao lado das abas, que abre o
 * formulário. Fica fora de `EmotePickerTab` para não virar uma lista que alguém consiga escolher.
 */
