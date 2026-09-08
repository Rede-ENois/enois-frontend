import { createContext } from "react";

import type { useProfileHeaderController } from "@/utils/components/profile/use-profile-header-controller";

export const ProfileHeaderContext = createContext<ReturnType<typeof useProfileHeaderController> | null>(
  null,
);
