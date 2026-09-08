import { createContext } from "react";

import type { NotificationItemContextValue } from "@/types/components/notification/notification-item-context-value";

export const NotificationItemContext = createContext<NotificationItemContextValue | null>(null);
