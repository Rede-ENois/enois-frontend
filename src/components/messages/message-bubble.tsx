import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import type { MessageBubbleProps } from "@/types/routes/messages/message-bubble-props";
import { MessageBubble as MessageBubbleView } from "@rede-enois/design-system/domain";

import { formatTime } from "@/components/post/format-time";
import { MediaGrid } from "@/components/post/media-grid";
import { RichText } from "@/components/post/rich-text";

/** Um balão da conversa: avatar do outro, texto, mídia, hora e reações. */
export function MessageBubble({ message, otherUser, otherId, ...props }: MessageBubbleProps) {
  return (
    <MessageBubbleView
      {...props}
      message={message}
      peer={otherUser}
      profileHref={`/perfil/${otherUser?.username ?? otherId ?? ""}`}
      emojis={REACTION_EMOJIS}
      timeLabel={formatTime(message.time)}
      content={
        message.text.trim().length > 0 && (
          <RichText
            content={message.text}
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
