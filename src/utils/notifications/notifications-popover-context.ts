import { createContext } from "react";

import type { NotificationsPopoverContextValue } from "@/types/notifications/notifications-popover-context-value";

export const NotificationsPopoverContext = createContext<NotificationsPopoverContextValue | null>(
  null,
);
