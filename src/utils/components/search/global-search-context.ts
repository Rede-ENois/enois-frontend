import { createContext } from "react";

import type { GlobalSearchContextValue } from "@/types/components/global-search/global-search-context-value";

export const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);
