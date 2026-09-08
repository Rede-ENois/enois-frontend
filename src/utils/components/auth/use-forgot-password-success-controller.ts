import { useForgotPasswordStore } from "@/stores/forgot-password.store";

export function useForgotPasswordSuccessController() {
  return {
    close: useForgotPasswordStore((state) => state.close),
  };
}
