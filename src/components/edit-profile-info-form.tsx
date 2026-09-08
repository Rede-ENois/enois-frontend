import { EditProfileInfoFields } from "@/components/edit-profile-info-fields";
import { EditProfileInfoSwitches } from "@/components/edit-profile-info-switches";

export function EditProfileInfoForm() {
  return (
    <div className="space-y-5">
      <EditProfileInfoFields />
      <EditProfileInfoSwitches />
    </div>
  );
}
