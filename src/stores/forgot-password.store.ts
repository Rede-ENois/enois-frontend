import { create } from "zustand";

import { forgotPassword } from "@/lib/api/auth/forgot-password";
import type { ForgotPasswordStore } from "@/types/stores/forgot-password-store";

const INITIAL_STATE = {
  open: false,
  sent: false,
  loading: false,
  formError: null,
};

export const useForgotPasswordStore = create<ForgotPasswordStore>()((set) => ({
  ...INITIAL_STATE,
  setOpen: (open) => set(open ? { open: true } : INITIAL_STATE),
  close: () => set(INITIAL_STATE),
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
