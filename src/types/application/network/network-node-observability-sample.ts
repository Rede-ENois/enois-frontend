/**
 * Um ponto do quadro ao vivo de um nó, como o Control Plane o devolve.
 *
 * <p>`null` é medida ausente: o nó não reportou naquele minuto, e a tela faz lacuna. `0` seria uma
 * medida de nó ocioso; são coisas diferentes.</p>
 */
export type NetworkNodeObservabilitySample = {
  sampledAt: string;
  cpuPercent: number | null;
  memoryMb: number | null;
  diskFreeMb: number | null;
  runningTasks: number | null;
  mode: string | null;
  activity: string | null;
};
