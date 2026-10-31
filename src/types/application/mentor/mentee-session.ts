import type { MentorRoomMode } from "./mentor-room-mode";
import type { SessionStatus } from "./session-status";

/** Inscrição recebida pelo mentor (visão do dono da agenda). */
export type MenteeSession = {
  id: string;
  menteeId: string;
  menteeUsername: string | null;
  menteeName: string | null;
  menteeAvatar: string | null;
  slotId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  message: string | null;
  status: SessionStatus;
  /** Preço pago em milésimos de faísca (`null` quando a sessão é gratuita). */
  priceSparks: number | null;
  /** Link da sala, congelado no agendamento. */
  roomUrl: string | null;
  /** Como a sala foi escolhida quando a sessão foi marcada. */
  roomMode: MentorRoomMode | null;
  createdAt: string;
};
