import { texts } from "@/texts";
import { createProfileExternalLinksSectionViewModel } from "@/utils/components/profile/create-profile-external-links-section-view-model";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";
import { Link as LinkIcon } from "lucide-react";

import { ProfileSection } from "@/components/profile-section";

export function ProfileExternalLinksSection() {
  const { user } = useProfilePageContext();
  const { visible, links } = createProfileExternalLinksSectionViewModel(user);

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
