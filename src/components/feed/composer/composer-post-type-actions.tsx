import { BarChart3, Calendar, FileText, Image } from "lucide-react";

import type { PostView } from "@/lib/api";
import { texts } from "@/texts";

import { ComposerAction } from "./composer-action";

const actions: Array<{
  type: PostView["type"];
  icon: React.ElementType;
  label: string;
}> = [
  { type: "INSIGHT", icon: Image, label: texts.feed.composer.types.insight },
  { type: "ARTICLE", icon: FileText, label: texts.feed.composer.types.article },
  { type: "QUESTION", icon: BarChart3, label: texts.feed.composer.types.question },
  { type: "PROJECT", icon: Calendar, label: texts.feed.composer.types.project },
];

export function ComposerPostTypeActions({
  postType,
  onChange,
}: {
  postType: PostView["type"];
  onChange: (type: PostView["type"]) => void;
}) {
  return actions.map((action) => (
    <ComposerAction
      key={action.type}
      icon={action.icon}
      label={action.label}
      active={postType === action.type}
      onClick={() => onChange(action.type)}
    />
  ));
}
