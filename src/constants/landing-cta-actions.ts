import { texts } from "@/texts";
import { ArrowRight } from "lucide-react";

export const LANDING_CTA_ACTIONS = [
  {
    key: "signup",
    tab: "signup",
    label: texts.landing.cta.createAccount,
    variant: "default",
    icon: ArrowRight,
    className: "gap-2 rounded-full px-6",
  },
  {
    key: "login",
    tab: "login",
    label: texts.landing.cta.existingAccount,
    variant: "outline",
    icon: null,
    className: "rounded-full px-6",
  },
] as const;
