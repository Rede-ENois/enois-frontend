import type { Mentor } from "./mentor";
import type { MentorRoomMode } from "./mentor-room-mode";

/**
 * Corpo do cadastro/edição do mentor. O `meetingUrl` entra aqui porque é dado que o DONO envia;
 * ele não existe mais no tipo `Mentor` (vitrine), que não publica o link.
 */
export type CreateMentorInput = Pick<
  Mentor,
  "expertise" | "price" | "banner" | "sparksPrice" | "roomMode"
> & {
  /** Sala externa da sessão (Google Meet, Jitsi...); só o dono a recebe de volta, por `/room`. */
  meetingUrl?: string | null;
  /** Nome próprio para a sala permanente do Jitsi; sem ele o slug vem do id do mentor. */
  jitsiRoom?: string | null;
};
