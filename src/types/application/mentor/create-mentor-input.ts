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
  /** Sala externa da sessão (Google Meet, Zoom...); só o dono a recebe de volta, por `/room`. */
  meetingUrl?: string | null;
  /** Nome próprio para a sala fixa do Epapo; sem ele o nome vem do id do mentor. */
  roomSlug?: string | null;
};
