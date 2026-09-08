import { createContext } from "react";

import type { FeedProfileSummaryContextValue } from "@/types/components/feed/feed-profile-summary-context-value";

export const FeedProfileSummaryContext = createContext<FeedProfileSummaryContextValue | null>(null);
