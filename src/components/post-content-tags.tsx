import { texts } from "@/texts";
import type { PostContentTagsProps } from "@/types/components/post/post-content-tags-props";

import { Badge } from "@/components/ui/badge";

export function PostContentTags({ tags }: PostContentTagsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="rounded-full border border-border-soft bg-transparent font-light text-text-subtle"
        >
          {texts.posts.tag(tag)}
        </Badge>
      ))}
    </div>
  );
}
