import { createContext } from "react";

import type { PostCommentsContextValue } from "@/types/components/post/post-comments-context-value";

export const PostCommentsContext = createContext<PostCommentsContextValue | null>(null);
