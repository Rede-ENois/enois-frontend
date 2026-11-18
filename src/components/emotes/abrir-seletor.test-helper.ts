/**
 * Abre o seletor pelo próprio botão do DS (o `EmotePickerTriggerButton`), como a pessoa faz: o
 * botão é o gatilho do Radix, e um gatilho de diálogo abre no `click`.
 */
export function botaoDoSeletor(onde: ParentNode = document) {
  return onde.querySelector<HTMLButtonElement>('[aria-label="Figurinhas"][aria-controls]');
}

export function abrirSeletor(onde: ParentNode = document) {
  const gatilho = botaoDoSeletor(onde);
  if (!gatilho) throw new Error("O botão do seletor não está na tela");
  gatilho.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
  gatilho.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));
  gatilho.click();
}
