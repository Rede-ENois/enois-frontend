/** Uma versão de documento legal, sem o texto (é o que a lista traz). */
export type DocumentoResumo = {
  id: string;
  /** DIRETRIZES | TERMOS_DE_USO */
  tipo: string;
  versao: number;
  titulo: string;
  resumo: string | null;
  exigeAceite: boolean;
  aprovado: boolean;
  vigente: boolean;
  vigenteDesde: string | null;
};
