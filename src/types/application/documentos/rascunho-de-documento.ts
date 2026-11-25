/** O rascunho criado pelo admin (não vigente até publicação explícita). */
export type RascunhoDeDocumento = {
  id: string;
  tipo: string;
  versao: number;
  titulo: string;
  aprovado: boolean;
  vigente: boolean;
};
