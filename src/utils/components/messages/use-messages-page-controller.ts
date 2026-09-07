import { useState } from "react";

export function useMessagesPageController() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return {
    activeId,
    selectConversation: setActiveId,
    clearConversation: () => setActiveId(null),
  };
}
