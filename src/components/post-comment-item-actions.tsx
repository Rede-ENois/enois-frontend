import { texts } from "@/texts";
import { useCommentItemContext } from "@/utils/components/post/use-comment-item-context";

import { CommentReactionPicker } from "@/components/comment-reaction-picker";

export function CommentItemActions() {
  const { showDelete, reply, remove, reactionLabel, reactionOptions } = useCommentItemContext();

  return (
    <div className="mt-1 flex items-center gap-3 px-3 text-[11px] font-light text-text-subtle">
      <button onClick={reply} className="transition-colors hover:text-primary">
        {texts.posts.comments.reply}
      </button>

      <CommentReactionPicker label={reactionLabel} options={reactionOptions} />

      {showDelete && (
        <button
          onClick={remove}
          className="text-destructive transition-colors hover:text-destructive/80"
        >
          {texts.posts.comments.delete}
        </button>
      )}
    </div>
  );
}
