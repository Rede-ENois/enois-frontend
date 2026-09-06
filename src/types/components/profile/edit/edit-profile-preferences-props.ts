import type { EditProfileInfoChange } from "./edit-profile-info-change";
import type { EditProfileInfoValues } from "./edit-profile-info-values";

export type EditProfilePreferencesProps = {
  values: EditProfileInfoValues;
  onChange: EditProfileInfoChange;
};
