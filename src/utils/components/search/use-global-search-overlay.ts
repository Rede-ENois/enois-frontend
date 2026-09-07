import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";

export function useGlobalSearchOverlay(clearQuery: () => void) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus();
  }, [mobileOpen]);

  const closeMobileSearch = () => {
    setMobileOpen(false);
    setOpen(false);
    clearQuery();
  };

  return {
    open,
    mobileOpen,
    searchRef,
    inputRef,
    openResults: () => setOpen(true),
    openMobileSearch: () => {
      setMobileOpen(true);
      setOpen(true);
    },
    closeMobileSearch,
    handleBackdropMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => {
      if (mobileOpen && event.target === event.currentTarget) closeMobileSearch();
    },
  };
}
