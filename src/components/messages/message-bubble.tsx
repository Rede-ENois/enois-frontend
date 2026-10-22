import { Link } from "@tanstack/react-router";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { MessageBubbleProps } from "@/types/routes/messages/message-bubble-props";
import { Check, CheckCheck, Smile } from "lucide-react";

import { formatTime } from "@/components/post/format-time";
import { MediaGrid } from "@/components/post/media-grid";
import { ReactionPicker } from "@/components/post/reaction-picker";
import { RichText } from "@/components/post/rich-text";
import { UserAvatar } from "@/components/user-avatar";
import { UserBadges } from "@/components/user-badge";

/** Um balão da conversa: avatar do outro, texto, mídia, hora e reações. */
export function MessageBubble({
  message,
  isMe,
  otherUser,
  otherId,
  selecting,
  selected,
  onToggleSelect,
  onReact,
  readByOther = false,
}: MessageBubbleProps) {
  return (
    <div
      onClick={onToggleSelect}
      className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${
        selecting ? "cursor-pointer" : ""
      }`}
    >
      {!isMe && (
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
          <span className="relative mb-1 inline-block">
            <UserAvatar src={otherUser?.avatar} alt={otherUser?.name} className="h-7 w-7" />
            {/* No avatar, só o primeiro emblema: é enfeite da foto, não a
                linha do nome — empilhar cinco ali viraria borrão. */}
            <UserBadges
              badge={otherUser?.badge}
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 ring-1 ring-card"
            />
          </span>
        </Link>
      )}
      <div
        className={`min-w-0 max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          isMe
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-card text-foreground"
        } ${selected ? "ring-2 ring-destructive/70" : ""}`}
      >
        {message.text.trim().length > 0 && (
          <RichText
            content={message.text}
            mediaSpoiler={message.mediaSpoiler}
            className="break-words"
            linkClassName="break-all underline underline-offset-2"
          />
        )}

        {message.mediaIds && message.mediaIds.length > 0 && (
          <div className="mt-1">
            <MediaGrid mediaIds={message.mediaIds} compact mediaSpoiler={message.mediaSpoiler} />
          </div>
        )}

        <p
          className={`mt-1 flex items-center gap-1 text-xs ${
            isMe ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatTime(message.time)}

          {isMe && (
            <span
              title={readByOther ? texts.messages.readReceiptRead : texts.messages.readReceiptSent}
              aria-label={
                readByOther ? texts.messages.readReceiptRead : texts.messages.readReceiptSent
              }
            >
              {readByOther ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </p>

        {/* Reações: mesmos emojis dos comentários. A pílula alterna a reação e
            o botão abre o seletor completo. */}
        <div
          className={`mt-1 flex flex-wrap items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}
          onClick={(event) => event.stopPropagation()}
        >
          {Object.entries(message.reactions ?? {}).map(([type, count]) => (
            <button
              key={type}
              type="button"
              onClick={() => onReact?.(type)}
              className={`inline-flex h-6 items-center gap-1 rounded-full px-1.5 text-xs leading-none transition ${
                message.myReaction === type
                  ? "bg-primary/20 text-primary-text ring-1 ring-primary/40"
                  : isMe
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-muted text-text-subtle hover:bg-muted/80"
              }`}
              title={type.toLowerCase()}
            >
              <span className="inline-flex h-4 items-center justify-center text-sm leading-none">
                {REACTION_EMOJIS[type as ReactionType] ?? type}
              </span>

              <span className="tabular-nums leading-none">{count}</span>
            </button>
          ))}

          <ReactionPicker
            activeType={(message.myReaction as ReactionType) ?? null}
            onReact={(type) => onReact?.(type)}
            buttonClassName={`inline-flex h-6 w-6 items-center justify-center rounded-full transition ${
              isMe
                ? "text-primary-foreground/70 hover:bg-primary-foreground/15"
                : "text-text-subtle hover:bg-muted"
            }`}
            buttonTitle={texts.posts.reactions.react}
          >
            <Smile className="h-3.5 w-3.5" />
          </ReactionPicker>
        </div>
      </div>
    </div>
  );
}
