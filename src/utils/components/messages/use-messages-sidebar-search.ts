import { useState } from "react";

export function useMessagesSidebarSearch() {
  const [showSearch, setShowSearch] = useState(false);

  return {
    showSearch,
    toggleSearch: () => setShowSearch((visible) => !visible),
    closeSearch: () => setShowSearch(false),
  };
}
