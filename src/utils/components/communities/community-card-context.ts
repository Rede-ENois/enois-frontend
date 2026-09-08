import { createContext } from "react";

import type { CommunityCardContextValue } from "@/types/components/communities/community-card-context-value";

export const CommunityCardContext = createContext<CommunityCardContextValue | null>(null);
