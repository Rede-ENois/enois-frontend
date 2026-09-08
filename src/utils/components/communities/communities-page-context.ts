import { createContext } from "react";

import type { CommunitiesPageContextValue } from "@/types/components/communities/communities-page-context-value";

export const CommunitiesPageContext = createContext<CommunitiesPageContextValue | null>(null);
