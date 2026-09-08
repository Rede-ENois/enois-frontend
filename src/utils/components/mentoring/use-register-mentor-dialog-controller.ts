import { useCallback, useState } from "react";

export function useRegisterMentorDialogController() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return {
    open,
    setOpen,
    close,
  };
}
