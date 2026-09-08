import { createContext } from "react";

import type { JobsPageContextValue } from "@/types/components/jobs/jobs-page-context-value";

export const JobsPageContext = createContext<JobsPageContextValue | null>(null);
