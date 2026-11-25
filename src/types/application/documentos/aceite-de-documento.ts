export type AceiteDeDocumento = {
  id: string;
  documentoId: string;
  tipo: string;
  versao: number;
  /** ACEITE_EXPLICITO | CADASTRO — de onde o aceite veio. */
  origem: string;
  aceitoEm: string;
};
