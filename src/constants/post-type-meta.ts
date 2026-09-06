import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import type { PostTypeMeta } from "@/types/components/post/post-type-meta";

export const typeMeta: Record<PostView["type"], PostTypeMeta> = {
  INSIGHT: {
    label: texts.posts.types.insight,
    className: "bg-highlight-insight text-highlight-insight-text",
    classAvatar: "bg-user-insight text-highlight-insight-text",
  },
  QUESTION: {
    label: texts.posts.types.question,
    className: "bg-secondary/30 text-secondary-foreground",
    classAvatar: "",
  },
  PROJECT: {
    label: texts.posts.types.project,
    className: "bg-highlight-project text-highlight-project-text",
    classAvatar: "bg-user-project text-user-project-text",
  },
  OPPORTUNITY: {
    label: texts.posts.types.opportunity,
    className: "bg-opportunity/20 text-opportunity-foreground",
    classAvatar: "",
  },
  ARTICLE: {
    label: texts.posts.types.article,
    className: "bg-highlight-article text-highlight-article-text",
    classAvatar: "bg-user-article text-user-article-text",
  },
};
