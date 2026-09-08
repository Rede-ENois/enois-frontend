import { FORGOT_PASSWORD_INITIAL_STATE } from "@/constants/auth/forgot-password-initial-state";
import type { ForgotPasswordStore } from "@/types/auth/forgot-password-store";
import { create } from "zustand";

export const useForgotPasswordStore = create<ForgotPasswordStore>()((set) => ({
  ...FORGOT_PASSWORD_INITIAL_STATE,
  setOpen: (open) => set(open ? { open: true } : FORGOT_PASSWORD_INITIAL_STATE),
  setSent: (sent) => set({ sent }),
  close: () => set(FORGOT_PASSWORD_INITIAL_STATE),
}));
