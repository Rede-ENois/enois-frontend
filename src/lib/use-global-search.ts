import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { searchContent } from "@/lib/api/search";
import type { SearchResult } from "@/types/application/search/search-result";
import { navigateToHref } from "@/utils/navigation";

export function useGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

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

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchContent(debounced),
    enabled: debounced.length >= 2,
  });

  const closeSearch = () => {
    setOpen(false);
    setQuery("");
  };

  const openMobileSearch = () => {
    setMobileOpen(true);
    setOpen(true);
  };

  const closeMobileSearch = () => {
    setMobileOpen(false);
    closeSearch();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOpen(true);
  };

  const handleSelect = (item: SearchResult) => {
    closeMobileSearch();
    navigateToHref(item.href, navigate);
  };

  return {
    query,
    debounced,
    open,
    mobileOpen,
    searchRef,
    inputRef,
    items: results?.items ?? [],
    isFetching,
    openMobileSearch,
    closeMobileSearch,
    handleQueryChange,
    handleFocus: () => setOpen(true),
    handleSelect,
  };
}
