import { useForgotPasswordStore } from "@/stores/auth/forgot-password.store";

export function useForgotPasswordSuccessController() {
  return {
    close: useForgotPasswordStore((state) => state.close),
  };
}
