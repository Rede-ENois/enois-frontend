import type { MentorRoomMode } from "./mentor-room-mode";

/** Sala configurada pelo mentor (visão do dono) — o link permanente não é público. */
export type MentorRoom = {
  roomMode: MentorRoomMode;
  /** Link que a próxima sessão usa; `null` em EPAPO_SESSION (a sala nasce no agendamento). */
  roomUrl: string | null;
  meetingUrl: string | null;
  /** Nome da sala fixa no Epapo (derivado do id quando o mentor não escolheu um). */
  roomSlug: string | null;
};
