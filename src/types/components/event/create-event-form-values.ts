import type { CreateEventInput } from "@/types/application/event/create-event-input";

export type CreateEventFormValues = Omit<CreateEventInput, "cover">;
