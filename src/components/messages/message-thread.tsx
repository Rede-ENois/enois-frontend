import type { FormEventHandler } from "react";

import { Link } from "@tanstack/react-router";

import { ArrowLeft, Send } from "lucide-react";

import type { Conversation, Message, Profile } from "@/lib/api";
import { texts } from "@/texts";
import { getOtherParticipantId } from "@/utils/messages";

import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { MessageList } from "./message-list";

type MessageThreadProps = {
  conversation: Conversation | null;
  otherUser?: Profile;
  currentUserId: string;
  messages: Message[];
  text: string;
  sending: boolean;
  onBack: () => void;
  onTextChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function MessageThread({
  conversation,
  otherUser,
  currentUserId,
  messages,
  text,
  sending,
  onBack,
  onTextChange,
  onSubmit,
}: MessageThreadProps) {
  if (!conversation) {
    return (
      <div className="hidden min-h-0 flex-col md:flex">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
        </div>
      </div>
    );
  }

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;
  const otherUserId =
    getOtherParticipantId(conversation.participantIds, currentUserId) ?? currentUserId;

  return (
    <div className="flex min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherUserId }}>
            <UserAvatar src={otherUser?.avatar} alt={title} className="h-10 w-10 shrink-0" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-semibold">{title}</p>
            {otherUser?.headline && (
              <p className="truncate text-xs text-muted-foreground">{otherUser.headline}</p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{texts.messages.noMessages}</p>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            otherUser={otherUser}
            otherUserId={otherUserId}
          />
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={texts.messages.inputPlaceholder}
          className="h-10 rounded-full bg-muted"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
