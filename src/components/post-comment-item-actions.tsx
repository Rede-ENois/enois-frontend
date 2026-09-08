import { texts } from "@/texts";
import type { CommentItemActionsProps } from "@/types/components/post/comment-item-actions-props";

import { CommentReactionPicker } from "@/components/comment-reaction-picker";

export function CommentItemActions(props: CommentItemActionsProps) {
  return (
    <div className="mt-1 flex items-center gap-3 px-3 text-[11px] font-light text-text-subtle">
      <button onClick={props.onReply} className="transition-colors hover:text-primary">
        {texts.posts.comments.reply}
      </button>

      <CommentReactionPicker label={props.reactionLabel} options={props.reactionOptions} />

      {props.showDelete && (
        <button
          onClick={props.onRemove}
          className="text-destructive transition-colors hover:text-destructive/80"
        >
          {texts.posts.comments.delete}
        </button>
      )}
    </div>
  );
}
