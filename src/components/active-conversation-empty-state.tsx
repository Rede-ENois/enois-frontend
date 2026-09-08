import { texts } from "@/texts";

export function ActiveConversationEmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
    </div>
  );
}
