export type ListaDoSeletorProps = {
  /** Abriu/fechou de fora (o Radix do diálogo): o app acompanha. */
  onAbertoMudou: (open: boolean) => void;
  /** Escolheu uma figurinha: o código entra no texto. */
  onSelect: (code: string) => void;
  /** Abriu o envio: a próxima abertura da lista é na aba da comunidade, com a nova na grade. */
  onEnviar: () => void;
  /** Aba aberta ao montar: o catálogo, ou a comunidade de volta ao envio. */
  abaInicial: "third" | "community";
};
