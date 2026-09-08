import type { ChangeEventHandler, RefObject } from "react";

import type { CommunityCropPurpose } from "@/types/components/communities/community-crop-purpose";
import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";

export function createCommunityImageField(
  purpose: CommunityCropPurpose,
  value: string,
  inputRef: RefObject<HTMLInputElement | null>,
  handleFileSelect: (purpose: CommunityCropPurpose) => ChangeEventHandler<HTMLInputElement>,
  setField: (field: "cover" | "avatar", value: string) => void,
): CommunityImageFieldProps {
  const field = purpose === "COVER" ? "cover" : "avatar";

  return {
    purpose,
    value,
    inputRef,
    onChange: handleFileSelect(purpose),
    onRemove: () => setField(field, ""),
  };
}
