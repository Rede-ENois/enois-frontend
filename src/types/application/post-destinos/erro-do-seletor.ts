/** O que o seletor de destinos mostra quando a última tentativa falhou: qual linha e por quê. */
export type ErroDoSeletor = {
  destinoId: string | null;
  mensagem: string;
};
