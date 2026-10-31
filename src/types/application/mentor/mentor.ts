import type { MentorRoomMode } from "./mentor-room-mode";

export type Mentor = {
  id: string;
  userId: string;
  expertise: string[];
  rating: number;
  sessions: number;
  price: string;
  /** Banner/capa do perfil de mentor (URL do CDN). */
  banner: string | null;
  /**
   * Preço da sessão em **milésimos de faísca** (`null` quando o mentor não aceita faíscas). A
   * conversão para texto está em `@/lib/faisca`.
   */
  sparksPrice: number | null;
  /** Sala externa da sessão (Google Meet, Jitsi...) — link https público para quem agenda. */
  meetingUrl: string | null;
  /** De onde vem a sala: Jitsi por sessão (padrão), sala fixa do Jitsi ou sala própria. */
  roomMode: MentorRoomMode;
  /**
   * Próxima vaga livre — **nulo** quando o mentor não tem nenhuma vaga futura (é o que a API
   * devolve: `nextAvailableSlot` termina em `orElse(null)`). Medido na QA em 2026-10-24: 2 de
   * 5 mentores da lista vinham com o campo nulo.
   */
  nextSlot: string | null;
};
