import type { ReactNode } from "react";

type CommunityTopicButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function CommunityTopicButton({
  isActive,
  onClick,
  children,
}: CommunityTopicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
