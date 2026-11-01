import type { Mentor } from "./mentor";
import type { MentorRoomMode } from "./mentor-room-mode";

export type CreateMentorInput = Pick<
  Mentor,
  "expertise" | "price" | "banner" | "meetingUrl" | "sparksPrice" | "roomMode"
> & {
  /** Nome próprio para a sala permanente do Jitsi; sem ele o slug vem do id do mentor. */
  jitsiRoom?: string | null;
};
