import type { EditProfileInfoChange, EditProfileInfoValues } from "./edit-profile-info";
import type { EditProfileTab } from "./edit-profile-tab";

export type EditProfileTabContentProps = {
  tab: EditProfileTab;
  values: EditProfileInfoValues;
  usernameError: string;
  onChange: EditProfileInfoChange;
};
