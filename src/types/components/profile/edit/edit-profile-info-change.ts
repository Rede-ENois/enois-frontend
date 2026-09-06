import type { EditProfileInfoValues } from "./edit-profile-info-values";

export type EditProfileInfoChange = <K extends keyof EditProfileInfoValues>(
  field: K,
  value: EditProfileInfoValues[K],
) => void;
