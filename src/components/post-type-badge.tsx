import type { PostTypeBadgeProps } from "@/types/components/post/post-type-badge-props";

export function PostTypeBadge({ meta }: PostTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
