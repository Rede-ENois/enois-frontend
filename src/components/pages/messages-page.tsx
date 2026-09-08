import { ActiveConversation } from "@/components/active-conversation";
import { AppContainer } from "@/components/app-container";
import { MessagesSidebar } from "@/components/messages-sidebar";

export function Mensagens() {
  return (
    <AppContainer>
      <div className="surface-card grid h-[calc(100dvh-11rem)] md:h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <MessagesSidebar />
        <ActiveConversation />
      </div>
    </AppContainer>
  );
}
