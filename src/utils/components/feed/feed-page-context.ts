import { createContext } from "react";

import type { FeedPageContextValue } from "@/types/components/feed/feed-page-context-value";

export const FeedPageContext = createContext<FeedPageContextValue | null>(null);
