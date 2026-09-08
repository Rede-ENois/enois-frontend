import { texts } from "@/texts";

export const EDIT_PROFILE_INFO_SWITCHES = [
  { key: "open-to-work", field: "openToWork", label: texts.profile.edit.openToWork },
  { key: "mentor", field: "isMentor", label: texts.profile.edit.mentorAvailable },
] as const;
