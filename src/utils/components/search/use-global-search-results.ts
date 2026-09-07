import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { searchContent } from "@/lib/api/search";

export function useGlobalSearchResults(query: string) {
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchContent(debounced),
    enabled: debounced.length >= 2,
  });

  return {
    debounced,
    items: data?.items ?? [],
    isFetching,
  };
}
