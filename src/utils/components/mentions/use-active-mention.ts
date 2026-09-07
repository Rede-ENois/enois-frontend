import { useState } from "react";

import { findActiveMention } from "@/utils/components/mentions/find-active-mention";

export function useActiveMention() {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(-1);

  const clear = () => {
    setQuery("");
    setIndex(-1);
  };
  const update = (text: string, cursor: number) => {
    const [nextQuery, nextIndex] = findActiveMention(text, cursor);
    setQuery(nextQuery);
    setIndex(nextIndex);
  };

  return { query, index, clear, update };
}
