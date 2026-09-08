import { texts } from "@/texts";
import { useEditProfileDialogContext } from "@/utils/components/profile/use-edit-profile-dialog-context";

export function useEditProfileDialogHeaderController() {
  const { tabs, close, profileInfo } = useEditProfileDialogContext();

  return {
    tabs,
    actions: [
      {
        key: "cancel",
        label: texts.common.cancel,
        variant: "outline" as const,
        onClick: close,
        disabled: false,
      },
      {
        key: "save",
        label: profileInfo.isSaving ? texts.common.saving : texts.common.save,
        variant: "default" as const,
        onClick: profileInfo.save,
        disabled: profileInfo.isSaving,
      },
    ],
  };
}
