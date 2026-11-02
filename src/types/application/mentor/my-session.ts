import type { MentorRoomMode } from "./mentor-room-mode";
import type { SessionStatus } from "./session-status";

/** Sessão vista por quem agendou (mentorado): quem atende, quando e por quanto. */
export type MySession = {
  id: string;
  mentorId: string;
  mentorUsername: string | null;
  mentorName: string | null;
  mentorAvatar: string | null;
  startsAt: string | null;
  endsAt: string | null;
  message: string | null;
  status: SessionStatus;
  /** Preço pago em milésimos de faísca (`null` quando a sessão é gratuita). */
  priceSparks: number | null;
  /** Link da sala, congelado no agendamento (Jitsi por sessão, sala fixa ou sala própria). */
  roomUrl: string | null;
  /** Como a sala foi escolhida quando a sessão foi marcada. */
  roomMode: MentorRoomMode | null;
  createdAt: string;
};
