import { useState } from "react";

export function useCommunityHeaderEditState() {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    close: () => setOpen(false),
  };
}
