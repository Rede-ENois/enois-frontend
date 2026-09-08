import { useForgotPasswordStore } from "@/stores/forgot-password.store";

export function useForgotPasswordDialogController() {
  const open = useForgotPasswordStore((state) => state.open);
  const sent = useForgotPasswordStore((state) => state.sent);
  const setOpen = useForgotPasswordStore((state) => state.setOpen);

  return { open, sent, setOpen };
}
