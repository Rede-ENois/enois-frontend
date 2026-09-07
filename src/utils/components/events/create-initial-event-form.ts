import type { CreateEventRequest } from "@/types/application/event/create-event-request";

export function createInitialEventForm(): CreateEventRequest {
  return {
    title: "",
    date: "",
    time: "",
    format: "ONLINE",
    host: "",
  };
}
