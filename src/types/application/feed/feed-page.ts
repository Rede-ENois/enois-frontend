import type { PageResponse } from "../api/page-response";
import type { PostView } from "./post-view";

/** Página do `GET /feed`: a primeira traz o marcador "Você está em dia" de antes desta visita. */
export type FeedPage = PageResponse<PostView> & {
  /** ISO or `null` (never marked). Only the first `FOR_YOU` page carries it; every other page sends `null`. */
  lastSeenAt?: string | null;
};
