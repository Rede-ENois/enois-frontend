import type { PageResponse } from "@/types/application/api/page-response";
import type { Event } from "@/types/application/event/event";

/** Every cached events list (all and rituals), as `getQueriesData` returns it. */
export type EventListsSnapshot = [readonly unknown[], PageResponse<Event> | undefined][];
