import { texts } from "@/texts";
import type { AuthorInfoProps } from "@/types/components/post/author-info-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

export function createAuthorInfoViewModel({ createdAt }: AuthorInfoProps) {
  return {
    timeLabel: texts.posts.authorTime(formatRelativeTime(createdAt)),
  };
}
