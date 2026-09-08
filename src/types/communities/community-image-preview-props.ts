import type { CommunityImageFieldProps } from "@/types/communities/community-image-field-props";

export type CommunityImagePreviewProps = Pick<
  CommunityImageFieldProps,
  "value" | "inputRef" | "onRemove"
>;
