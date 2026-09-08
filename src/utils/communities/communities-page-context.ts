import { createContext } from "react";

import type { CommunitiesPageContextValue } from "@/types/communities/communities-page-context-value";

export const CommunitiesPageContext = createContext<CommunitiesPageContextValue | null>(null);
