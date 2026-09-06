import type { PlayIconProps } from "@/types/components/assets/play-icon-props";

export function PlayIcon({ className }: PlayIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
