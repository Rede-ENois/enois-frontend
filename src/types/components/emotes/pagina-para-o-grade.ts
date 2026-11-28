/**
 * Uma página de catálogo no formato que a grade do seletor desenha: o código sem os dois-pontos e
 * o endereço da miniatura, seja qual for o catálogo (terceiros, comunidade).
 */
export type PaginaParaOGrade = {
  items: { code: string; thumb: string }[];
  page: number;
  total: number;
  totalPages: number;
};
