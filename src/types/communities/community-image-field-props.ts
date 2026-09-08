import type { ChangeEventHandler, RefObject } from "react";

import type { CommunityCropPurpose } from "@/types/communities/community-crop-purpose";

export type CommunityImageFieldProps = {
  purpose: CommunityCropPurpose;
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onRemove: () => void;
};
