import type { PostContentTextProps } from "@/types/components/post/post-content-text-props";
import { linkifyText } from "@/utils/linkify-text";

export function PostContentText({ content }: PostContentTextProps) {
  return (
    <p className="mt-4 whitespace-pre-line break-words text-[15px] font-light leading-relaxed text-text-strong">
      {linkifyText(content)}
    </p>
  );
}
