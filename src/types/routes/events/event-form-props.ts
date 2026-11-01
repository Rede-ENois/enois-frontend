import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { Event } from "@/types/application/event/event";

export type EventFormProps = {
  /** Evento em edição; sem ele, o formulário cria um novo. */
  initial?: Event | null;
  onSave: (data: CreateEventRequest) => void;
  isPending: boolean;
  /** Última recusa do servidor: os códigos de cidade aparecem sob o campo. */
  error?: unknown;
};
