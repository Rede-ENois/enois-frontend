/** Uma linha do console do nó: o que o runtime escreveu, com nível e instante. */
export type NetworkNodeObservabilityLine = {
  id: string;
  at: string;
  level: string;
  message: string;
};
