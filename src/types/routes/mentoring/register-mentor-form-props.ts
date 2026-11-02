import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { MentorRoomMode } from "@/types/application/mentor/mentor-room-mode";

export type RegisterMentorFormProps = {
  onSave: (data: CreateMentorInput) => void;
  isPending: boolean;
  initialExpertise?: string;
  initialPrice?: string;
  initialBanner?: string;
  initialMeetingUrl?: string;
  /** Sala escolhida no perfil; ausente quando o mentor ainda não existe. */
  initialRoomMode?: MentorRoomMode;
  initialJitsiRoom?: string | null;
  /** Preço em faíscas já publicado, em milésimos — `undefined` quando não aceita faíscas. */
  initialSparksPrice?: number;
  /** Presente ao editar: mostra a disponibilidade semanal dentro do card de edição. */
  mentorId?: string;
};
