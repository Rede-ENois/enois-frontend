import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";

/**
 * The pages the reader is looking at while a refresh brought posts at the top. The list keeps
 * rendering these; the new posts wait in the query cache until the reader takes them.
 */
export type HeldFeedPages = {
  pages: PageResponse<PostView>[];
  /** How many posts at the top of the first page the reader has not seen. */
  count: number;
};
