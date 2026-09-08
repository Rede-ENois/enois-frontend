import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import { BarChart3, Calendar, FileText, Film, Image } from "lucide-react";

export function createFeedComposerActions(
  postType: PostView["type"],
  mediaType: "image" | "video" | null,
  mediaCount: number,
  setPostType: (type: PostView["type"]) => void,
  openMediaPicker: () => void,
) {
  return [
    {
      key: "insight",
      icon: Image,
      label: texts.feed.composer.types.insight,
      active: postType === "INSIGHT",
      onClick: () => setPostType("INSIGHT"),
    },
    {
      key: "article",
      icon: FileText,
      label: texts.feed.composer.types.article,
      active: postType === "ARTICLE",
      onClick: () => setPostType("ARTICLE"),
    },
    {
      key: "question",
      icon: BarChart3,
      label: texts.feed.composer.types.question,
      active: postType === "QUESTION",
      onClick: () => setPostType("QUESTION"),
    },
    {
      key: "project",
      icon: Calendar,
      label: texts.feed.composer.types.project,
      active: postType === "PROJECT",
      onClick: () => setPostType("PROJECT"),
    },
    {
      key: "media",
      icon: mediaType === "video" ? Film : Image,
      label:
        mediaType === "video"
          ? texts.feed.composer.video
          : mediaCount > 0
            ? texts.feed.composer.mediaCount(mediaCount)
            : texts.feed.composer.media,
      active: mediaCount > 0,
      onClick: openMediaPicker,
    },
  ];
}
