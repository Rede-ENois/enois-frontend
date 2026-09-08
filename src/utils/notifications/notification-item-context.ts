import { createContext } from "react";

import type { NotificationItemContextValue } from "@/types/notifications/notification-item-context-value";

export const NotificationItemContext = createContext<NotificationItemContextValue | null>(null);
