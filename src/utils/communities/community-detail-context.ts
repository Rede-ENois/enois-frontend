import { createContext } from "react";

import type { CommunityDetailContextValue } from "@/types/components/communities/community-detail-context-value";

export const CommunityDetailContext = createContext<CommunityDetailContextValue | null>(null);
