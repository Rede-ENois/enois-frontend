import { useState } from "react";

export function useGlobalSearchInput() {
  const [query, setQuery] = useState("");

  return {
    query,
    setQuery,
    clearQuery: () => setQuery(""),
  };
}
