import { useEffect, useState } from "react";

export function useMentionSelectionIndex(resultCount: number) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [resultCount]);

  return {
    selectedIndex,
    select: setSelectedIndex,
    next: () => setSelectedIndex((index) => (index + 1) % resultCount),
    previous: () => setSelectedIndex((index) => (index - 1 + resultCount) % resultCount),
  };
}
