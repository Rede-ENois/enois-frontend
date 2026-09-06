import type { ReactNode } from "react";

import type { PostView } from "@/lib/api";

export type PostContentProps = {
  post: PostView;
  reactionSummary: ReactNode;
};
