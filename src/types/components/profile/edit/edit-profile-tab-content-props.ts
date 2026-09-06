import type { EditProfileInfoChange } from "./edit-profile-info-change";
import type { EditProfileInfoValues } from "./edit-profile-info-values";
import type { EditProfileTab } from "./edit-profile-tab";

export type EditProfileTabContentProps = {
  tab: EditProfileTab;
  values: EditProfileInfoValues;
  usernameError: string;
  onChange: EditProfileInfoChange;
};
