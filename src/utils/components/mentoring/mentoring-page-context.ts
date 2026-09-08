import { createContext } from "react";

import type { MentoringPageContextValue } from "@/types/components/mentoring/mentoring-page-context-value";

export const MentoringPageContext = createContext<MentoringPageContextValue | null>(null);
