import { texts } from "@/texts";

export const NOTIFICATION_TABS = [
  {
    key: "novas",
    label: texts.notifications.tabs.new,
    className:
      "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-light transition",
  },
  {
    key: "historico",
    label: texts.notifications.tabs.history,
    className: "flex-1 py-2.5 text-[12px] font-light transition",
  },
] as const;
