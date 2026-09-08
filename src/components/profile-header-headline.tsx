import type { ProfileHeaderHeadlineProps } from "@/types/components/profile/profile-header-headline-props";

export function ProfileHeaderHeadline({ headline }: ProfileHeaderHeadlineProps) {
  return <p className="mt-1 break-words text-[14px] font-light text-primary">{headline}</p>;
}
