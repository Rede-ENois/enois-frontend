import { RegisterMentorDialogContext } from "@/utils/components/mentoring/register-mentor-dialog-context";
import { RegisterMentorFormContext } from "@/utils/components/mentoring/register-mentor-form-context";
import { useRegisterMentorDialogController } from "@/utils/components/mentoring/use-register-mentor-dialog-controller";
import { useRegisterMentorFormController } from "@/utils/components/mentoring/use-register-mentor-form-controller";

import { RegisterMentorDialog } from "@/components/register-mentor-dialog";

export function RegisterMentorDialogProvider() {
  const dialog = useRegisterMentorDialogController();
  const form = useRegisterMentorFormController(dialog.close);

  return (
    <RegisterMentorDialogContext.Provider value={dialog}>
      <RegisterMentorFormContext.Provider value={form}>
        <RegisterMentorDialog />
      </RegisterMentorFormContext.Provider>
    </RegisterMentorDialogContext.Provider>
  );
}
