/**
 * Uma requisição a API auxiliar em aberto no nó.
 *
 * <p>`route` é o **nome** da rota como está na lista assinada, nunca a URL: o destino vive só na
 * configuração que o nó recebeu, e o pedido manda o nome para o runtime resolver contra ela.</p>
 */
export type NetworkApiRequest = {
  taskId: string;
  nodeId: string | null;
  /** O nome da rota pedida; `null` quando o payload da tarefa não pôde ser lido. */
  route: string | null;
  /** O estado da tarefa, como o Control Plane o nomeia (PENDING, DISPATCHED, …). */
  status: string;
  attempt: number;
  deadline: string;
  createdAt: string;
};
