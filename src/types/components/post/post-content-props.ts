import type { ReactNode } from "react";

import type { PostProps } from "./post-props";

export type PostContentProps = PostProps & {
  reactionSummary: ReactNode;
};
