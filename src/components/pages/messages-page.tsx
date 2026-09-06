import { useState } from "react";

import { ActiveConversation } from "@/components/active-conversation";
import { AppContainer } from "@/components/app-container";
import { MessagesSidebar } from "@/components/messages-sidebar";

export function Mensagens() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <AppContainer>
      <div className="surface-card grid h-[calc(100dvh-11rem)] md:h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <MessagesSidebar activeId={activeId} onSelect={setActiveId} />
        <ActiveConversation conversationId={activeId} onBack={() => setActiveId(null)} />
      </div>
    </AppContainer>
  );
}
