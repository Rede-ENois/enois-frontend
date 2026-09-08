import { createContext } from "react";

import type { MentorCardContextValue } from "@/types/components/mentoring/mentor-card-context-value";

export const MentorCardContext = createContext<MentorCardContextValue | null>(null);
