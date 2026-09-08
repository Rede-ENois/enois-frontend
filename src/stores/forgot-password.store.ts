import { create } from "zustand";

import { FORGOT_PASSWORD_INITIAL_STATE } from "@/consts/components/auth/forgot-password-initial-state";
import { forgotPassword } from "@/lib/api/auth/forgot-password";
import type { ForgotPasswordStore } from "@/types/stores/forgot-password-store";

export const useForgotPasswordStore = create<ForgotPasswordStore>()((set) => ({
  ...FORGOT_PASSWORD_INITIAL_STATE,
  setOpen: (open) => set(open ? { open: true } : FORGOT_PASSWORD_INITIAL_STATE),
  close: () => set(FORGOT_PASSWORD_INITIAL_STATE),
  submit: async (email) => {
    set({ formError: null, loading: true });

    try {
      await forgotPassword(email);
      set({ sent: true });
    } catch (formError) {
      set({ formError });
    } finally {
      set({ loading: false });
    }
  },
}));
