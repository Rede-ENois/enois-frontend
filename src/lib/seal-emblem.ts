const EMBLEM_NAME = /^[a-z0-9-]+$/;

/** URL do emblema fixo de um nível de selo; `undefined` quando a API não informou um nome válido. */
export function sealEmblemSrc(emblem: string | null | undefined): string | undefined {
  return emblem && EMBLEM_NAME.test(emblem) ? `/seals/${emblem}.png` : undefined;
}
