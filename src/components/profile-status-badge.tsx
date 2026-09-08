import type { ProfileStatusBadgeProps } from "@/types/components/profile/profile-status-badge-props";

export function ProfileStatusBadge({ label, className }: ProfileStatusBadgeProps) {
  return (
    <span
      className={`rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light ${className}`}
    >
      {label}
    </span>
  );
}
