import type { CreateEventRequest } from "@/types/application/event/create-event-request";

export type CreateEventFormProps = {
  form: CreateEventRequest;
  setField: <K extends keyof CreateEventRequest>(field: K, value: CreateEventRequest[K]) => void;
  setFormat: (value: string) => void;
  formatOptions: readonly {
    value: CreateEventRequest["format"];
    label: string;
  }[];
  createPending: boolean;
  createDisabled: boolean;
  createEvent: () => void;
};
