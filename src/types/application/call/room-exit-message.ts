/**
 * Aviso que a sala (o Epapo, em outro domínio) manda ao painel quando a pessoa sai dela.
 *
 * Vem por `postMessage` porque o painel não lê nada de dentro do iframe. `reason` é só uma
 * etiqueta curta do motivo, nunca dado de quem estava na sala.
 */
export interface RoomExitMessage {
  type: "enois:call-room-exit";
  reason?: string;
}
