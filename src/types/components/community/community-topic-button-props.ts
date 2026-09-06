import type { ReactNode } from "react";

export type CommunityTopicButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};
