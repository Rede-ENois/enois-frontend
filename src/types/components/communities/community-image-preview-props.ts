import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";

export type CommunityImagePreviewProps = Pick<
  CommunityImageFieldProps,
  "value" | "inputRef" | "onRemove"
>;
