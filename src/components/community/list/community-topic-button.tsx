import type { SelectableButtonProps } from "@/types/components/shared/selectable-button-props";

export function CommunityTopicButton({ isActive, onClick, children }: SelectableButtonProps) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-sm transition ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{children}</button>;
}
