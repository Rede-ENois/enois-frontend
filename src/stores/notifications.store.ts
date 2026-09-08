import { NOTIFICATIONS_INITIAL_STATE } from "@/constants/components/notifications/notifications-initial-state";
import type { NotificationsStore } from "@/types/stores/notifications-store";
import { create } from "zustand";

export const useNotificationsStore = create<NotificationsStore>()((set) => ({
  ...NOTIFICATIONS_INITIAL_STATE,
  openTab: (tab) => set({ tab }),
}));
