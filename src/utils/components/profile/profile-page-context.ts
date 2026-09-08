import { createContext } from "react";

import type { ProfilePageContextValue } from "@/types/components/profile/profile-page-context-value";

export const ProfilePageContext = createContext<ProfilePageContextValue | null>(null);
