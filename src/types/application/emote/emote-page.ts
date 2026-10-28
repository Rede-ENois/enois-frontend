/** Uma página do seletor: os itens pedidos e os limites para montar os controles. */
export type EmotePage<T> = {
  items: T[];
  page: number;
  totalPages: number;
};
