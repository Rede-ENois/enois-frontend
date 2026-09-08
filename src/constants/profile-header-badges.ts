import { texts } from "@/texts";

export const PROFILE_HEADER_BADGES = [
  {
    key: "open-to-work",
    field: "openToWork",
    label: texts.profile.openToWork,
    className: "text-growth",
  },
  {
    key: "mentor",
    field: "isMentor",
    label: texts.profile.mentorAvailable,
    className: "text-primary",
  },
] as const;
