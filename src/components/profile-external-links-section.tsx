import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";
import { Link as LinkIcon } from "lucide-react";

import { createProfileExternalLinksSectionViewModel } from "@/utils/components/profile/create-profile-external-links-section-view-model";

import { ProfileSection } from "@/components/profile-section";

export function ProfileExternalLinksSection(props: ProfileSidebarProps) {
  const { visible, links } = createProfileExternalLinksSectionViewModel(props);

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.links}>
      <ul className="space-y-2 text-[13px] font-light">
        {links.map((link) => (
          <li key={link} className="flex items-center gap-2 text-text-subtle">
            <LinkIcon className="h-4 w-4" />

            <span className="truncate text-text-strong">{link}</span>
          </li>
        ))}
      </ul>
    </ProfileSection>
  );
}
