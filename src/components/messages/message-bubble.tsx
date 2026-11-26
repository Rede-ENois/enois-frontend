import { REACTION_PICKER_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { MessageBubbleProps } from "@/types/routes/messages/message-bubble-props";
import { MessageBubble as MessageBubbleView } from "@rede-enois/design-system/domain";

import { formatTime } from "@/components/post/format-time";
import { MediaGrid } from "@/components/post/media-grid";
import { RichText } from "@/components/post/rich-text";

/** Um balão da conversa: avatar do outro, texto, mídia, hora e reações. */
export function MessageBubble({
  message,
  currentUserId,
  peer,
  profileHref,
  isMe,
  ...props
}: MessageBubbleProps) {
  const replyQuote = message.replyTo
    ? {
        from:
          message.replyTo.from === currentUserId
            ? texts.messages.you
            : (peer?.name ?? texts.messages.unknownAuthor),
        text: message.replyTo.text || texts.messages.attachmentPreview,
        isMe: message.replyTo.from === currentUserId,
      }
    : null;

  return (
    <MessageBubbleView
      {...props}
      message={message}
      isMe={isMe}
      peer={peer}
      profileHref={profileHref}
      emojis={REACTION_PICKER_EMOJIS}
      timeLabel={formatTime(message.time)}
      replyQuote={replyQuote}
      content={
        message.text.trim().length > 0 && (
          <RichText
            content={message.text}
            writtenAt={message.time}
            mediaSpoiler={message.mediaSpoiler}
            className="break-words"
            linkClassName="break-all underline underline-offset-2"
          />
        )
      }
      media={
        message.mediaIds &&
        message.mediaIds.length > 0 && (
          <MediaGrid mediaIds={message.mediaIds} compact mediaSpoiler={message.mediaSpoiler} />
        )
      }
    />
  );
}
