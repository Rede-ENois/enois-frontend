import type { MouseEventHandler } from "react";

import type { ButtonProps } from "@/types/components/ui/button-props";

export type CommunityCardMembershipAction = {
  variant: ButtonProps["variant"];
  label: string;
  disabled: boolean;
  run: MouseEventHandler<HTMLButtonElement>;
};
