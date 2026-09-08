import { createContext } from "react";

import type { PostCardContextValue } from "@/types/components/post/post-card-context-value";

export const PostCardContext = createContext<PostCardContextValue | null>(null);
