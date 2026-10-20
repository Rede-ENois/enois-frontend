import type { ToastAction } from "./toast-action";
import type { ToastVariant } from "./toast-variant";

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
};
