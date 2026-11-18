/**
 * Abre o seletor pelo próprio botão do DS (o `EmotePickerTriggerButton`), como a pessoa faz: o
 * botão nativo abre no `click`. O jsdom não tem PointerEvent, então o clique vai direto.
 */
export function botaoDoSeletor(onde: ParentNode = document) {
  return onde.querySelector<HTMLButtonElement>('[aria-label="Figurinhas"][aria-controls]');
}

export function abrirSeletor(onde: ParentNode = document) {
  const gatilho = botaoDoSeletor(onde);
  if (!gatilho) throw new Error("O botão do seletor não está na tela");
  gatilho.click();
}
