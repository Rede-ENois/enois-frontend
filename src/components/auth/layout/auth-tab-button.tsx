import type { ReactNode } from "react";

type AuthTabButtonProps = {
  isActive: boolean;
  children: ReactNode;
  onClick: () => void;
};

export function AuthTabButton({
  isActive,
  children,
  onClick,
}: AuthTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
