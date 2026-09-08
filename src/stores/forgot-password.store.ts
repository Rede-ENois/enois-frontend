import { FORGOT_PASSWORD_INITIAL_STATE } from "@/constants/components/auth/forgot-password-initial-state";
import type { ForgotPasswordStore } from "@/types/stores/forgot-password-store";
import { create } from "zustand";

import { forgotPassword } from "@/lib/api/auth/forgot-password";

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
