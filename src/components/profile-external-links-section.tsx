import { Link as LinkIcon } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { ProfileSection } from "@/components/profile-section";

export function ProfileExternalLinksSection({ user }: ProfileSidebarProps) {
  if (user.externalLinks.length === 0) return null;

  return (
    <ProfileSection title={texts.profile.sections.links}>
      <ul className="space-y-2 text-[13px] font-light">
        {user.externalLinks.map((link) => (
          <li key={link} className="flex items-center gap-2 text-text-subtle">
            <LinkIcon className="h-4 w-4" />
            <span className="truncate text-text-strong">{link}</span>
          </li>
        ))}
      </ul>
    </ProfileSection>
  );
}
