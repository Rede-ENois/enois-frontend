import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { searchApi } from "@/lib/api";
import type { SearchResult } from "@/lib/api";
import { navigateToHref } from "@/utils/navigation";

export function useGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const debounceTimer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileOpen) inputRef.current?.focus();
  }, [isMobileOpen]);

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
  };
  const closeMobileSearch = () => {
    setIsMobileOpen(false);
    closeSearch();
  };
  const handleSelect = (searchResult: SearchResult) => {
    closeMobileSearch();
    navigateToHref(searchResult.href, navigate);
  };

  return {
    query,
    debouncedQuery,
    results: searchData?.items ?? [],
    isSearching,
    isOpen,
    isMobileOpen,
    searchRef,
    inputRef,
    openMobileSearch: () => {
      setIsMobileOpen(true);
      setIsOpen(true);
    },
    closeMobileSearch,
    handleQueryChange: (value: string) => {
      setQuery(value);
      setIsOpen(true);
    },
    handleFocus: () => setIsOpen(true),
    handleSelect,
  };
}
