import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";

/**
 * Busca de uma página conferida pela varredura, guardada para não repetir o pedido na mesma volta.
 * `settled` só é preenchido quando `pending` resolve.
 */
export type FeedLiveTally = {
  pending: Promise<PageResponse<PostView> | null>;
  settled: PageResponse<PostView> | null;
};
