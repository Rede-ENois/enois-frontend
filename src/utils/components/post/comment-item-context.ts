import { createContext } from "react";

import type { CommentItemContextValue } from "@/types/components/post/comment-item-context-value";

export const CommentItemContext = createContext<CommentItemContextValue | null>(null);
