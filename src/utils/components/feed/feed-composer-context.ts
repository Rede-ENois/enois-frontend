import { createContext } from "react";

import type { FeedComposerContextValue } from "@/types/components/feed/feed-composer-context-value";

export const FeedComposerContext = createContext<FeedComposerContextValue | null>(null);
