import { useState } from "react";

export function useForgotPasswordDialogState(reset: () => void) {
  const [open, setOpen] = useState(false);

  const close = () => {
    reset();
    setOpen(false);
  };

  return {
    open,
    close,
    handleOpenChange: (nextOpen: boolean) => {
      if (nextOpen) setOpen(true);
      else close();
    },
  };
}
