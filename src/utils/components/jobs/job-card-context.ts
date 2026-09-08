import { createContext } from "react";

import type { JobCardContextValue } from "@/types/components/jobs/job-card-context-value";

export const JobCardContext = createContext<JobCardContextValue | null>(null);
