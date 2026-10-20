import type { ToastAction } from "./toast-action";
import type { ToastVariant } from "./toast-variant";

export type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
};
