import { createContext } from "react";

import type { PostActionsContextValue } from "@/types/components/post/post-actions-context-value";

export const PostActionsContext = createContext<PostActionsContextValue | null>(null);
