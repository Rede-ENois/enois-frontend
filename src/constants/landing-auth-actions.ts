import { texts } from "@/texts";

export const LANDING_AUTH_ACTIONS = [
  {
    key: "login",
    tab: "login",
    label: texts.common.enter,
    variant: "ghost",
    className: "h-8 rounded-full px-3 text-sm",
  },
  {
    key: "signup",
    tab: "signup",
    label: texts.common.createAccount,
    variant: "default",
    className: "h-8 rounded-full px-4 text-sm",
  },
] as const;
