import { createContext } from "react";

import type { CommunityCardContextValue } from "@/types/communities/community-card-context-value";

export const CommunityCardContext = createContext<CommunityCardContextValue | null>(null);
