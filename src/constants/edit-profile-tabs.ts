import { texts } from "@/texts";

export const EDIT_PROFILE_TABS = [
  { key: "info", label: texts.profile.edit.tabs.info },
  { key: "experiences", label: texts.profile.edit.tabs.experiences },
  { key: "education", label: texts.profile.edit.tabs.education },
  { key: "certifications", label: texts.profile.edit.tabs.certifications },
] as const;
